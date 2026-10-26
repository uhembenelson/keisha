import { createHmac, timingSafeEqual } from "node:crypto";

import { getMongoDatabase } from "@/lib/mongodb";
import { getPaymentSettings } from "@/lib/payment-settings";
import { createPrintfulOrder } from "@/lib/printful";

export const runtime = "nodejs";

function validSignature(payload: string, signatureHeader: string, secret: string) {
  const entries = signatureHeader.split(",").map((part) => part.split("="));
  const timestamp = entries.find(([key]) => key === "t")?.[1];
  const signatures = entries.filter(([key]) => key === "v1").map(([, value]) => value);
  if (!timestamp || !signatures.length || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  return signatures.some((signature) => {
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
  });
}

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature") || "";
  const settings = await getPaymentSettings();
  if (!settings?.webhookSecret || !validSignature(payload, signature, settings.webhookSecret)) return new Response("Invalid signature", { status: 400 });
  const event = JSON.parse(payload) as { type?: string; data?: { object?: Record<string, unknown> } };
  const session = event.data?.object;
  if (session && ["checkout.session.completed", "checkout.session.async_payment_succeeded", "checkout.session.async_payment_failed"].includes(event.type || "")) {
    const database = await getMongoDatabase();
    const orderId = typeof session.client_reference_id === "string" ? session.client_reference_id : undefined;
    if (database && orderId) {
      const paid = event.type !== "checkout.session.async_payment_failed" && session.payment_status === "paid";
      const customer = session.customer_details as { email?: string; name?: string; phone?: string; address?: Record<string, unknown> } | undefined;
      const collected = session.collected_information as { shipping_details?: { name?: string; address?: Record<string, unknown> } } | undefined;
      const shipping = collected?.shipping_details || session.shipping_details as { name?: string; address?: Record<string, unknown> } | undefined;
      await database.collection("merch_orders").updateOne({ id: orderId }, { $set: { status: paid ? "paid" : event.type === "checkout.session.async_payment_failed" ? "payment-failed" : "processing", customerEmail: customer?.email || "", customerName: customer?.name || "", shippingDetails: shipping || customer?.address || null, amountTotal: session.amount_total || 0, currency: session.currency || "usd", updatedAt: new Date().toISOString() } });
      if (paid) {
        const order = await database.collection("merch_orders").findOne({ id: orderId });
        const printfulItems = (Array.isArray(order?.items) ? order.items : []).filter((item) => Number(item.printfulSyncVariantId) > 0);
        if (printfulItems.length > 0 && !order?.printfulOrderId) {
          const address = shipping?.address || customer?.address || {};
          const address1 = typeof address.line1 === "string" ? address.line1 : "";
          const city = typeof address.city === "string" ? address.city : "";
          const countryCode = typeof address.country === "string" ? address.country : "";
          const zip = typeof address.postal_code === "string" ? address.postal_code : "";
          if (!address1 || !city || !countryCode || !zip) {
            await database.collection("merch_orders").updateOne({ id: orderId }, { $set: { printfulStatus: "address-error", printfulError: "Stripe did not return a complete shipping address.", updatedAt: new Date().toISOString() } });
          } else {
            try {
              const printfulOrder = await createPrintfulOrder({
                orderId,
                recipient: {
                  name: shipping?.name || customer?.name || "Customer",
                  address1,
                  address2: typeof address.line2 === "string" ? address.line2 : undefined,
                  city,
                  stateCode: typeof address.state === "string" ? address.state : undefined,
                  countryCode,
                  zip,
                  email: customer?.email,
                  phone: customer?.phone,
                },
                items: printfulItems.map((item) => ({ syncVariantId: Number(item.printfulSyncVariantId), quantity: Number(item.quantity) || 1, retailPrice: ((Number(item.unitAmount) || 0) / 100).toFixed(2) })),
              });
              await database.collection("merch_orders").updateOne({ id: orderId }, { $set: { printfulOrderId: printfulOrder.id || null, printfulStatus: printfulOrder.status || (printfulOrder.autoConfirmed ? "submitted" : "draft"), printfulDashboardUrl: printfulOrder.dashboard_url || "", printfulError: "", updatedAt: new Date().toISOString() } });
            } catch (error) {
              await database.collection("merch_orders").updateOne({ id: orderId }, { $set: { printfulStatus: "failed", printfulError: error instanceof Error ? error.message : "Printful fulfillment failed.", updatedAt: new Date().toISOString() } });
              return Response.json({ error: "Printful fulfillment failed." }, { status: 500 });
            }
          }
        }
      }
    }
  }
  return Response.json({ received: true });
}

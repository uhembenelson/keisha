import { createHmac, timingSafeEqual } from "node:crypto";

import { getMongoDatabase } from "@/lib/mongodb";
import { getPaymentSettings } from "@/lib/payment-settings";

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
      await database.collection("merch_orders").updateOne({ id: orderId }, { $set: { status: paid ? "paid" : event.type === "checkout.session.async_payment_failed" ? "payment-failed" : "processing", customerEmail: (session.customer_details as { email?: string } | undefined)?.email || "", customerName: (session.customer_details as { name?: string } | undefined)?.name || "", shippingDetails: session.shipping_details || null, amountTotal: session.amount_total || 0, currency: session.currency || "usd", updatedAt: new Date().toISOString() } });
    }
  }
  return Response.json({ received: true });
}

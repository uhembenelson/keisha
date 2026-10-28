import { createHmac, timingSafeEqual } from "node:crypto";

import { getMongoDatabase } from "@/lib/mongodb";
import { getPaymentSettings } from "@/lib/payment-settings";
import { createPrintfulOrder, getPrintfulSettings } from "@/lib/printful";
import { sendTransactionalEmail } from "@/lib/email-studio";
import { createShippingRates, getShippingSettings, purchaseShippingLabel, shippingSettingsReady, type ShippingAddress } from "@/lib/shipping";

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

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] || character);
}

function confirmedShippingAddress(shipping: { name?: string; address?: Record<string, unknown> } | undefined, fallback: ShippingAddress | undefined, email: string) {
  const address = shipping?.address;
  if (!address || address.country !== "US") return null;
  const stringValue = (value: unknown) => typeof value === "string" ? value : "";
  const result: ShippingAddress = {
    name: stringValue(shipping?.name) || fallback?.name || "",
    email: email || fallback?.email || "",
    phone: fallback?.phone || "",
    street1: stringValue(address.line1),
    street2: stringValue(address.line2),
    city: stringValue(address.city),
    state: stringValue(address.state),
    zip: stringValue(address.postal_code),
    country: "US",
  };
  return result.street1 && result.city && result.state && result.zip ? result : null;
}

function shippingAddressDiffers(left: ShippingAddress | undefined, right: ShippingAddress | null) {
  if (!left || !right) return false;
  const fields: (keyof ShippingAddress)[] = ["name", "street1", "street2", "city", "state", "zip", "country"];
  return fields.some((field) => String(left[field] || "").trim().toLowerCase().replace(/\s+/g, " ") !== String(right[field] || "").trim().toLowerCase().replace(/\s+/g, " "));
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
    if (orderId && !database) return Response.json({ error: "Order storage is temporarily unavailable." }, { status: 500 });
    if (database && orderId) {
      const existingOrder = await database.collection("merch_orders").findOne({ id: orderId });
      if (!existingOrder) return Response.json({ error: "Order record is not available yet." }, { status: 500 });
      const paid = event.type !== "checkout.session.async_payment_failed" && session.payment_status === "paid";
      const customer = session.customer_details as { email?: string; name?: string; phone?: string; address?: Record<string, unknown> } | undefined;
      const collected = session.collected_information as { shipping_details?: { name?: string; address?: Record<string, unknown> } } | undefined;
      const shipping = collected?.shipping_details || session.shipping_details as { name?: string; address?: Record<string, unknown> } | undefined;
      const totalDetails = session.total_details as { amount_tax?: number; amount_shipping?: number; amount_discount?: number } | undefined;
      const originalShippingAddress = existingOrder.shippingAddress as ShippingAddress | undefined;
      const checkoutShippingAddress = existingOrder.orderType === "book" && existingOrder.format === "physical"
        ? confirmedShippingAddress(shipping, originalShippingAddress, customer?.email || "")
        : null;
      await database.collection("merch_orders").updateOne({ id: orderId }, { $set: { status: paid ? "paid" : event.type === "checkout.session.async_payment_failed" ? "payment-failed" : "processing", customerEmail: customer?.email || "", customerName: customer?.name || "", shippingDetails: shipping || customer?.address || null, ...(checkoutShippingAddress ? { shippingAddress: checkoutShippingAddress, shippingAddressChangedByCustomer: shippingAddressDiffers(originalShippingAddress, checkoutShippingAddress) } : {}), amountSubtotal: session.amount_subtotal || 0, amountTotal: session.amount_total || 0, taxAmount: totalDetails?.amount_tax || 0, stripeShippingAmount: totalDetails?.amount_shipping || 0, currency: session.currency || "usd", updatedAt: new Date().toISOString() } });
      if (paid) {
        const order = await database.collection("merch_orders").findOne({ id: orderId });
        if (order?.orderType === "book" && order.presale === true && order.shippoRateId && !order.shippoTransactionId) {
          await database.collection("merch_orders").updateOne({ id: orderId }, { $set: { shippoStatus: "presale-awaiting-release", shippoError: "Payment and shipping were collected. Release this preorder when the book is ready to ship.", updatedAt: new Date().toISOString() } });
        }
        if (order?.orderType === "book" && order.shippoRateId && !order.shippoTransactionId) {
          if (order.presale === true) {
            // Presale labels are purchased only after an admin releases the order.
          } else {
          const shippingSettings = await getShippingSettings();
          if (!shippingSettingsReady(shippingSettings)) {
            await database.collection("merch_orders").updateOne({ id: orderId }, { $set: { shippoStatus: "setup-required", shippoError: "Complete Shippo setup before creating this label.", updatedAt: new Date().toISOString() } });
          } else if (!shippingSettings!.labelPurchaseEnabled) {
            await database.collection("merch_orders").updateOne({ id: orderId }, { $set: { shippoStatus: "label-locked", shippoError: "Payment received. Label purchasing is locked; enable it in Shipping settings when ready.", updatedAt: new Date().toISOString() } });
          } else if (!shippingSettings!.autoPurchase) {
            await database.collection("merch_orders").updateOne({ id: orderId }, { $set: { shippoStatus: "ready-for-label", shippoError: "", updatedAt: new Date().toISOString() } });
          } else {
            const claimed = await database.collection("merch_orders").findOneAndUpdate(
              { id: orderId, shippoTransactionId: { $exists: false }, shippoStatus: { $ne: "purchasing-label" } },
              { $set: { shippoStatus: "purchasing-label", shippoError: "", updatedAt: new Date().toISOString() } },
              { returnDocument: "after" },
            );
            if (claimed) {
              try {
                let rateId = String(order.shippoRateId);
                let shipmentId = String(order.shippoShipmentId || "");
                let shippingRate = order.shippingRate;
                let labelAmount = Number(order.shippingAmount) || 0;
                if (order.shippingAddressChangedByCustomer === true) {
                  const address = order.shippingAddress as ShippingAddress | undefined;
                  if (!address) throw new Error("Stripe returned a changed delivery address that could not be rated.");
                  const freshShipment = await createShippingRates(shippingSettings!, address, Math.max(1, Number(order.items?.[0]?.quantity) || 1));
                  const previousRate = order.shippingRate as { provider?: string; service?: string } | undefined;
                  const selectedRate = freshShipment.rates.find((rate) => rate.provider.toLowerCase() === previousRate?.provider?.toLowerCase() && rate.service.toLowerCase() === previousRate?.service?.toLowerCase()) || freshShipment.rates[0];
                  if (!selectedRate) throw new Error("Shippo did not return a current rate for the confirmed delivery address.");
                  rateId = selectedRate.id;
                  shipmentId = freshShipment.shipmentId;
                  shippingRate = selectedRate;
                  labelAmount = selectedRate.amount;
                }
                const label = await purchaseShippingLabel(shippingSettings!, rateId, orderId);
                await database.collection("merch_orders").updateOne({ id: orderId }, { $set: { shippoTransactionId: label.object_id || "", shippoStatus: "label-created", shippoRateId: rateId, shippoShipmentId: shipmentId, shippingRate, shippoLabelAmount: labelAmount, shippingVarianceAmount: labelAmount - (Number(order.shippingAmount) || 0), labelUrl: label.label_url || "", trackingNumber: label.tracking_number || "", trackingUrl: label.tracking_url_provider || "", status: "processing", updatedAt: new Date().toISOString() } });
              } catch (error) {
                await database.collection("merch_orders").updateOne({ id: orderId }, { $set: { shippoStatus: "label-failed", shippoError: error instanceof Error ? error.message : "Shippo label creation failed.", updatedAt: new Date().toISOString() } });
              }
            }
          }
          }
        }
        if (order?.orderType === "book" && order.presale === true && !order.presaleConfirmationEmailSentAt) {
          const bookTitle = String(order.items?.[0]?.name || "your book");
          const rawReleaseDate = String(order.presaleReleaseDate || "");
          const releaseDate = /^\d{4}-\d{2}-\d{2}$/.test(rawReleaseDate) ? new Date(`${rawReleaseDate}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : rawReleaseDate || "the announced release date";
          const total = new Intl.NumberFormat("en-US", { style: "currency", currency: String(order.currency || "usd").toUpperCase() }).format((Number(order.amountTotal) || 0) / 100);
          const message = order.format === "digital"
            ? `Your preorder for ${bookTitle} is confirmed. Your payment of ${total}, including any applicable tax, was received. The digital download will be emailed on ${releaseDate}.`
            : `Your preorder for ${bookTitle} is confirmed. Your payment of ${total}, including shipping and any applicable tax, was received. We expect to ship on ${releaseDate}. We will email tracking details when your order ships.`;
          try {
            await sendTransactionalEmail({ to: String(order.customerEmail || customer?.email || ""), subject: `Preorder confirmed: ${bookTitle}`, html: `<main style="margin:0 auto;max-width:600px;padding:36px 24px;background:#fffaf1;color:#29271f;font-family:Georgia,serif"><p style="color:#7f2737;font:700 12px Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase">Keisha WriteNow Allen</p><h1 style="font-size:32px;line-height:1.15">Your preorder is confirmed.</h1><p style="font:16px/1.7 Arial,sans-serif">${escapeHtml(message)}</p><p style="font:14px/1.6 Arial,sans-serif">Thank you for supporting this new release.</p></main>`, text: `${message}\n\nThank you for supporting this new release.`, idempotencyKey: `presale/${orderId}/confirmation` });
            await database.collection("merch_orders").updateOne({ id: orderId }, { $set: { presaleConfirmationEmailSentAt: new Date().toISOString(), presaleConfirmationEmailError: "", updatedAt: new Date().toISOString() } });
          } catch (error) {
            await database.collection("merch_orders").updateOne({ id: orderId }, { $set: { presaleConfirmationEmailError: error instanceof Error ? error.message : "The preorder confirmation email could not be sent.", updatedAt: new Date().toISOString() } });
          }
        }
        const printfulItems = (Array.isArray(order?.items) ? order.items : []).filter((item) => Number(item.printfulSyncVariantId) > 0);
        if (printfulItems.length > 0 && !order?.printfulOrderId) {
          const printfulSettings = await getPrintfulSettings();
          if (printfulSettings?.fulfillmentEnabled !== true) {
            await database.collection("merch_orders").updateOne({ id: orderId }, { $set: { printfulStatus: "test-skipped", printfulError: "Printful order forwarding is disabled for payment testing. No Printful order was created.", updatedAt: new Date().toISOString() } });
            return Response.json({ received: true, printfulSkipped: true });
          }
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

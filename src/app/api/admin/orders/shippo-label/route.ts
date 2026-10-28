import { cookies } from "next/headers";

import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { getMongoDatabase } from "@/lib/mongodb";
import { sendTransactionalEmail } from "@/lib/email-studio";
import { createShippingRates, getShippingSettings, purchaseShippingLabel, shippingSettingsReady, type ShippingAddress } from "@/lib/shipping";

export const runtime = "nodejs";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] || character);
}

export async function POST(request: Request) {
  if (!isValidAdminSession((await cookies()).get(ADMIN_SESSION_COOKIE)?.value)) return Response.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json().catch(() => null) as { orderId?: string } | null;
  const database = await getMongoDatabase();
  if (!database) return Response.json({ error: "Order storage is unavailable." }, { status: 503 });
  const order = await database.collection("merch_orders").findOne({ id: body?.orderId, orderType: "book", format: "physical" });
  if (!order || order.status !== "paid") return Response.json({ error: "Only paid physical book orders can purchase a label." }, { status: 400 });
  if (order.shippoTransactionId) return Response.json({ error: "A shipping label already exists for this order." }, { status: 409 });
  if (!order.shippoRateId && order.presale !== true) return Response.json({ error: "This order has no Shippo rate." }, { status: 400 });
  const settings = await getShippingSettings();
  if (!shippingSettingsReady(settings)) return Response.json({ error: "Complete Shippo setup before purchasing a label." }, { status: 503 });
  if (!settings!.labelPurchaseEnabled) return Response.json({ error: "Label purchasing is locked in Shipping settings." }, { status: 403 });

  let rateId = String(order.shippoRateId || "");
  let shipmentId = String(order.shippoShipmentId || "");
  let shippingRate = order.shippingRate;
  let labelAmount = Number(order.shippingAmount) || 0;
  const presale = order.presale === true;
  const needsFreshRate = presale || order.shippingAddressChangedByCustomer === true;
  if (needsFreshRate) {
    const label = presale ? "preorder" : "order";
    const claimed = await database.collection("merch_orders").updateOne(
      { id: order.id, status: "paid", shippoTransactionId: { $exists: false }, shippoStatus: { $ne: "purchasing-label" } },
      { $set: { shippoStatus: "purchasing-label", shippoError: "", updatedAt: new Date().toISOString() } },
    );
    if (!claimed.modifiedCount) return Response.json({ error: `This ${label} is already being released or already has a label.` }, { status: 409 });
  }

  try {
    if (needsFreshRate) {
      const address = order.shippingAddress as ShippingAddress | undefined;
      const quantity = Math.max(1, Number(order.items?.[0]?.quantity) || 1);
      if (!address?.name || !address.street1 || !address.city || !address.state || !address.zip || address.country !== "US") throw new Error("The order does not have a complete shipping address.");
      const freshShipment = await createShippingRates(settings!, address, quantity);
      const previousRate = order.shippingRate as { provider?: string; service?: string } | undefined;
      const selectedRate = freshShipment.rates.find((rate) => rate.provider.toLowerCase() === previousRate?.provider?.toLowerCase() && rate.service.toLowerCase() === previousRate?.service?.toLowerCase()) || freshShipment.rates[0];
      if (!selectedRate) throw new Error("Shippo did not return a current rate for this delivery address.");
      rateId = selectedRate.id;
      shipmentId = freshShipment.shipmentId;
      shippingRate = selectedRate;
      labelAmount = selectedRate.amount;
    }

    const label = await purchaseShippingLabel(settings!, rateId, String(order.id));
    const now = new Date().toISOString();
    const changes = {
      shippoTransactionId: label.object_id || "",
      shippoStatus: "label-created",
      shippoError: "",
      shippoShipmentId: shipmentId,
      shippoRateId: rateId,
      shippingRate,
      shippoLabelAmount: labelAmount,
      shippingVarianceAmount: labelAmount - (Number(order.shippingAmount) || 0),
      labelUrl: label.label_url || "",
      trackingNumber: label.tracking_number || "",
      trackingUrl: label.tracking_url_provider || "",
      ...(presale ? { presaleReleasedAt: now } : {}),
      status: "processing",
      updatedAt: now,
    };
    await database.collection("merch_orders").updateOne({ id: order.id, shippoTransactionId: { $exists: false } }, { $set: changes });

    let emailError = "";
    if (presale && order.customerEmail && label.tracking_url_provider) {
      const bookTitle = String(order.items?.[0]?.name || "your book");
      try {
        const trackingUrl = String(label.tracking_url_provider);
        const trackingNumber = String(label.tracking_number || "Pending");
        await sendTransactionalEmail({
          to: String(order.customerEmail),
          subject: "Your preorder is on its way: " + bookTitle,
          html: "<main style=\"margin:0 auto;max-width:600px;padding:36px 24px;background:#fffaf1;color:#29271f;font-family:Georgia,serif\"><p style=\"color:#7f2737;font:700 12px Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase\">Keisha WriteNow Allen</p><h1 style=\"font-size:32px;line-height:1.15\">Your preorder is shipping.</h1><p style=\"font:16px/1.7 Arial,sans-serif\">Your copy of " + escapeHtml(bookTitle) + " is being prepared for shipment.</p><p style=\"font:16px/1.7 Arial,sans-serif\"><a href=\"" + escapeHtml(trackingUrl) + "\" style=\"color:#7f2737;font-weight:700\">Track your package</a></p><p style=\"font:13px/1.6 Arial,sans-serif\">Tracking number: " + escapeHtml(trackingNumber) + "</p></main>",
          text: "Your preorder of " + bookTitle + " is being prepared for shipment. Track your package: " + trackingUrl + "\nTracking number: " + trackingNumber,
          idempotencyKey: "presale/" + String(order.id) + "/shipment",
        });
      } catch (error) {
        emailError = error instanceof Error ? error.message : "The shipping notification could not be sent.";
      }
      await database.collection("merch_orders").updateOne({ id: order.id }, { $set: { shippingEmailSentAt: emailError ? "" : new Date().toISOString(), shippingEmailError: emailError, updatedAt: new Date().toISOString() } });
    }
    return Response.json({ ok: true, emailError, order: { ...order, ...changes, ...(presale ? { shippingEmailError: emailError } : {}) } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Label purchase failed.";
    await database.collection("merch_orders").updateOne({ id: order.id }, { $set: { shippoStatus: "label-failed", shippoError: message, updatedAt: new Date().toISOString() } });
    return Response.json({ error: message }, { status: 502 });
  }
}

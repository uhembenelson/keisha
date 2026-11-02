import { after } from "next/server";

import { getMongoDatabase } from "@/lib/mongodb";
import { getPrintfulSettings } from "@/lib/printful";
import { syncPrintfulProductsToCms } from "@/lib/printful-sync";
import { sendTransactionalEmail } from "@/lib/email-studio";

export const runtime = "nodejs";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] || character);
}

function trackingHref(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
  } catch {
    return "";
  }
}

export async function POST(request: Request) {
  const settings = await getPrintfulSettings();
  const secret = new URL(request.url).searchParams.get("secret") || "";
  if (!settings?.webhookSecret || secret !== settings.webhookSecret) return new Response("Unauthorized", { status: 401 });
  const event = await request.json().catch(() => null) as {
    type?: string;
    created?: number;
    store?: number;
    store_id?: number;
    data?: { order?: { id?: number; external_id?: string; status?: string }; shipment?: { id?: number; tracking_number?: string | number; tracking_url?: string; carrier?: string; service?: string } };
  } | null;
  if (!event?.type) return Response.json({ received: true });
  if (settings.storeId && String(event.store || event.store_id || "") !== settings.storeId) return new Response("Store mismatch", { status: 403 });
  if (event.type === "product_synced" || event.type === "product_updated") {
    after(async () => {
      try {
        await syncPrintfulProductsToCms();
      } catch (error) {
        console.error("Automatic Printful product sync failed.", error);
      }
    });
  }
  const orderId = event.data?.order?.external_id;
  const database = await getMongoDatabase();
  if (event.type === "package_shipped" && orderId && !database) return new Response("Order storage is temporarily unavailable.", { status: 503 });
  if (database && orderId) {
    const order = event.type === "package_shipped" ? await database.collection("merch_orders").findOne({ id: orderId }) : null;
    if (event.type === "package_shipped" && !order) return Response.json({ received: true, ignored: "This shipment is not linked to a website order." });
    const shipment = event.data?.shipment;
    const status = event.type === "package_shipped" ? "shipped" : event.data?.order?.status || event.type.replace(/^order_/, "");
    const trackingNumber = shipment?.tracking_number == null ? "" : String(shipment.tracking_number);
    const trackingUrl = trackingHref(shipment?.tracking_url || "");
    await database.collection("merch_orders").updateOne({ id: orderId }, { $set: {
      printfulStatus: status,
      printfulOrderId: event.data?.order?.id || null,
      ...(event.type === "package_shipped" ? { trackingNumber, trackingUrl, carrier: shipment?.carrier || "", printfulShippingEmailError: "" } : {}),
      updatedAt: new Date().toISOString(),
    } });

    if (event.type === "package_shipped") {
      const customerEmail = String(order?.customerEmail || "").trim();
      const shipmentIdentity = shipment?.id != null ? String(shipment.id) : trackingNumber;
      if (!customerEmail || (!trackingNumber && !trackingUrl) || !shipmentIdentity) {
        const error = !customerEmail ? "Customer email is missing; the Printful shipment email was not sent." : "Printful did not include a tracking number or tracking link.";
        await database.collection("merch_orders").updateOne({ id: orderId }, { $set: { printfulShippingEmailError: error, updatedAt: new Date().toISOString() } });
        return new Response(error, { status: 500 });
      }

      const customerName = String(order?.customerName || "there").trim() || "there";
      const carrier = String(shipment?.carrier || "").trim();
      const items = (Array.isArray(order?.items) ? order.items : []) as Array<{ name?: string; quantity?: number }>;
      const itemList = items.map((item) => `<li style="margin:0 0 8px">${Math.max(1, Number(item.quantity) || 1)} × ${escapeHtml(String(item.name || "Merchandise"))}</li>`).join("");
      const trackingLink = trackingUrl ? `<p style="margin:28px 0"><a href="${escapeHtml(trackingUrl)}" style="display:inline-block;background:#7f2737;color:#fff3df;padding:14px 22px;text-decoration:none;font:700 14px Arial,sans-serif">Track your package</a></p>` : "";
      const trackingLine = trackingNumber ? `Tracking number: ${trackingNumber}` : "Use the tracking button below to follow your package.";
      const subject = "Your Keisha WriteNow order is on its way";
      try {
        await sendTransactionalEmail({
          to: customerEmail,
          subject,
          html: `<main style="margin:0 auto;max-width:600px;padding:36px 24px;background:#fffaf1;color:#29271f;font-family:Georgia,serif"><p style="color:#7f2737;font:700 12px Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase">Keisha WriteNow Allen</p><h1 style="font-size:32px;line-height:1.15">Your order is on its way.</h1><p style="font:16px/1.7 Arial,sans-serif">Hi ${escapeHtml(customerName)}, your order has shipped${carrier ? ` with ${escapeHtml(carrier)}` : ""}.</p>${itemList ? `<ul style="font:14px/1.6 Arial,sans-serif;padding-left:20px">${itemList}</ul>` : ""}${trackingLink}<p style="font:14px/1.6 Arial,sans-serif">${escapeHtml(trackingLine)}</p><p style="font:13px/1.6 Arial,sans-serif;color:#6f6a60">Thank you for supporting Keisha WriteNow Allen.</p></main>`,
          text: `Hi ${customerName}, your order has shipped${carrier ? ` with ${carrier}` : ""}.\n\n${items.map((item) => `${Math.max(1, Number(item.quantity) || 1)} × ${String(item.name || "Merchandise")}`).join("\n")}\n\n${trackingLine}${trackingUrl ? `\n${trackingUrl}` : ""}\n\nThank you for supporting Keisha WriteNow Allen.`,
          idempotencyKey: `printful/${orderId}/shipment/${shipmentIdentity}`,
        });
        await database.collection("merch_orders").updateOne({ id: orderId }, { $set: { printfulShippingEmailSentAt: new Date().toISOString(), printfulShippingEmailError: "", updatedAt: new Date().toISOString() } });
      } catch (error) {
        const message = error instanceof Error ? error.message : "The Printful shipment email could not be sent.";
        await database.collection("merch_orders").updateOne({ id: orderId }, { $set: { printfulShippingEmailError: message, updatedAt: new Date().toISOString() } });
        return new Response("Shipment notification could not be sent.", { status: 500 });
      }
    }
  }
  return Response.json({ received: true });
}

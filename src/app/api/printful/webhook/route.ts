import { after } from "next/server";

import { getMongoDatabase } from "@/lib/mongodb";
import { getPrintfulSettings } from "@/lib/printful";
import { syncPrintfulProductsToCms } from "@/lib/printful-sync";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const settings = await getPrintfulSettings();
  const secret = new URL(request.url).searchParams.get("secret") || "";
  if (!settings?.webhookSecret || secret !== settings.webhookSecret) return new Response("Unauthorized", { status: 401 });
  const event = await request.json().catch(() => null) as {
    type?: string;
    store?: number;
    store_id?: number;
    data?: { order?: { id?: number; external_id?: string; status?: string }; shipment?: { tracking_number?: string; tracking_url?: string; carrier?: string } };
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
  if (database && orderId) {
    const status = event.type === "package_shipped" ? "shipped" : event.data?.order?.status || event.type.replace(/^order_/, "");
    await database.collection("merch_orders").updateOne({ id: orderId }, { $set: {
      printfulStatus: status,
      printfulOrderId: event.data?.order?.id || null,
      trackingNumber: event.data?.shipment?.tracking_number || "",
      trackingUrl: event.data?.shipment?.tracking_url || "",
      carrier: event.data?.shipment?.carrier || "",
      updatedAt: new Date().toISOString(),
    } });
  }
  return Response.json({ received: true });
}

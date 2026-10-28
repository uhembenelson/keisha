import { randomUUID } from "node:crypto";

import { getCmsContent } from "@/lib/cms";
import { getMongoDatabase } from "@/lib/mongodb";
import { createShippingRates, getShippingSettings, shippingSettingsReady, type ShippingAddress } from "@/lib/shipping";

export const runtime = "nodejs";

function validAddress(address: Partial<ShippingAddress> | undefined): address is ShippingAddress {
  return Boolean(address?.name?.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email || "") && address?.phone?.trim() && address?.street1?.trim() && address?.city?.trim() && address?.state?.trim() && address?.zip?.trim() && address?.country === "US");
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { bookId?: string; quantity?: number; address?: Partial<ShippingAddress> } | null;
  if (!validAddress(body?.address)) return Response.json({ error: "Enter a complete US delivery address, email, and phone number." }, { status: 400 });
  const cms = await getCmsContent();
  const book = cms.books.find((entry) => entry.id === body?.bookId && entry.published && entry.availability === "paid" && entry.physicalEnabled && entry.stripeEnabled);
  if (!book) return Response.json({ error: "This book is not available for direct checkout." }, { status: 400 });
  const quantity = Math.max(1, Math.min(10, Math.floor(Number(body?.quantity) || 1)));
  const settings = await getShippingSettings();
  if (!shippingSettingsReady(settings)) return Response.json({ error: "Shipping is being configured. Please try again later." }, { status: 503 });
  const database = await getMongoDatabase();
  if (!database) return Response.json({ error: "Shipping quote storage is unavailable." }, { status: 503 });
  try {
    const quote = await createShippingRates(settings!, { ...body.address, country: "US" }, quantity);
    const quoteId = randomUUID();
    const quotes = database.collection("shipping_quotes");
    await quotes.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await quotes.insertOne({ id: quoteId, bookId: book.id, quantity, address: body.address, shipmentId: quote.shipmentId, rates: quote.rates, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 30 * 60_000) });
    return Response.json({ quoteId, rates: quote.rates });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Shipping rates could not be calculated." }, { status: 502 });
  }
}

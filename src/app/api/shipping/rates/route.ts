import { randomUUID } from "node:crypto";

import { bookLineCopyCount, isBookBagEligible, normalizeBookLines, type BookLineRequest } from "@/lib/book-order";
import { getCmsBooks } from "@/lib/cms";
import type { CmsBook } from "@/lib/cms-types";
import { getMongoDatabase } from "@/lib/mongodb";
import { createShippingRates, getShippingSettings, shippingSettingsReady, ShippingTimeoutError, type ShippingAddress } from "@/lib/shipping";
import { isValidUsZip, US_STATES } from "@/lib/us-states";

export const runtime = "nodejs";

function readAddress(input: Partial<ShippingAddress> | undefined): { address: ShippingAddress } | { error: string } {
  const address: ShippingAddress = {
    name: String(input?.name || "").trim(),
    email: String(input?.email || "").trim(),
    phone: String(input?.phone || "").trim(),
    street1: String(input?.street1 || "").trim(),
    street2: String(input?.street2 || "").trim(),
    city: String(input?.city || "").trim(),
    state: String(input?.state || "").trim().toUpperCase(),
    zip: String(input?.zip || "").trim(),
    country: "US",
  };
  if (!address.name) return { error: "Enter the recipient's full name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email)) return { error: "Enter a valid email address for shipping updates." };
  if (!address.phone) return { error: "Enter a phone number for the carrier." };
  if (!address.street1) return { error: "Enter the street address." };
  if (!address.city) return { error: "Enter the city." };
  if (!US_STATES.some(([code]) => code === address.state)) return { error: "Choose a US state from the list." };
  if (!isValidUsZip(address.zip)) return { error: "Enter a valid US ZIP code, for example 10001 or 10001-1234. We currently ship within the United States only." };
  return { address };
}

function singleBookAvailable(book: CmsBook | undefined) {
  return Boolean(book && book.published && book.availability === "paid" && book.physicalEnabled && book.stripeEnabled);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { bookId?: string; quantity?: number; items?: BookLineRequest[]; address?: Partial<ShippingAddress> } | null;
  const parsedAddress = readAddress(body?.address);
  if ("error" in parsedAddress) return Response.json({ error: parsedAddress.error }, { status: 400 });
  const requestedItems = Array.isArray(body?.items) ? body.items : [];
  const isBag = requestedItems.length > 0;
  const lines = normalizeBookLines(isBag ? requestedItems : body?.bookId ? [{ bookId: body.bookId, quantity: body.quantity }] : []);
  if (lines.length === 0) return Response.json({ error: "Choose at least one book before calculating shipping." }, { status: 400 });
  const books = await getCmsBooks();
  const available = lines.every((line) => {
    const book = books.find((entry) => entry.id === line.bookId);
    return isBag ? isBookBagEligible(book) : singleBookAvailable(book);
  });
  if (!available) return Response.json({ error: isBag ? "One or more books in your bag are not available for direct checkout." : "This book is not available for direct checkout." }, { status: 400 });
  const quantity = bookLineCopyCount(lines);
  const settings = await getShippingSettings();
  if (!shippingSettingsReady(settings)) return Response.json({ error: "Shipping is being configured. Please try again later." }, { status: 503 });
  const database = await getMongoDatabase();
  if (!database) return Response.json({ error: "Shipping quote storage is unavailable." }, { status: 503 });
  try {
    const quote = await createShippingRates(settings!, parsedAddress.address, quantity);
    const quoteId = randomUUID();
    const quotes = database.collection("shipping_quotes");
    await quotes.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await quotes.insertOne({ id: quoteId, bookId: lines[0].bookId, quantity, items: lines, address: parsedAddress.address, shipmentId: quote.shipmentId, rates: quote.rates, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 30 * 60_000) });
    return Response.json({ quoteId, rates: quote.rates });
  } catch (error) {
    if (error instanceof ShippingTimeoutError) return Response.json({ error: error.message }, { status: 504 });
    return Response.json({ error: error instanceof Error ? error.message : "Shipping rates could not be calculated." }, { status: 502 });
  }
}

import { randomUUID } from "node:crypto";

import { getCmsContent } from "@/lib/cms";
import { getMongoDatabase } from "@/lib/mongodb";
import { getPaymentSettings, paymentSettingsReady } from "@/lib/payment-settings";

export const runtime = "nodejs";

function unitAmount(price: string) {
  const amount = Number(price.replace(/[^0-9.]/g, ""));
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) : 0;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { bookId?: string; quantity?: number } | null;
  const cms = await getCmsContent();
  const book = cms.books.find((entry) => entry.id === body?.bookId && entry.published && entry.availability === "paid" && entry.stripeEnabled);
  const amount = book ? unitAmount(book.price) : 0;
  if (!book || !amount) return Response.json({ error: "This book is not available for direct checkout." }, { status: 400 });

  const settings = await getPaymentSettings();
  if (!paymentSettingsReady(settings)) return Response.json({ error: "Secure checkout is being configured. Please try again later." }, { status: 503 });
  const quantity = Math.max(1, Math.min(10, Math.floor(Number(body?.quantity) || 1)));
  const database = await getMongoDatabase();
  if (!database) return Response.json({ error: "Order storage is unavailable." }, { status: 503 });

  const orderId = randomUUID();
  const origin = (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, "");
  const form = new URLSearchParams({
    mode: "payment",
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/books/${book.slug}`,
    client_reference_id: orderId,
    "metadata[order_id]": orderId,
    "metadata[order_type]": "book",
    billing_address_collection: "required",
    "shipping_address_collection[allowed_countries][0]": "US",
    "line_items[0][quantity]": String(quantity),
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": String(amount),
    "line_items[0][price_data][product_data][name]": book.title,
  });
  if (book.shortDescription) form.set("line_items[0][price_data][product_data][description]", book.shortDescription.slice(0, 500));
  const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", { method: "POST", headers: { authorization: `Bearer ${settings!.secretKey}`, "content-type": "application/x-www-form-urlencoded" }, body: form });
  const stripe = await stripeResponse.json() as { id?: string; url?: string; error?: { message?: string } };
  if (!stripeResponse.ok || !stripe.id || !stripe.url) return Response.json({ error: stripe.error?.message || "Stripe checkout could not be created." }, { status: 502 });

  await database.collection("merch_orders").insertOne({ id: orderId, orderType: "book", stripeSessionId: stripe.id, status: "pending", items: [{ productId: book.id, name: book.title, variantId: "", variantName: "", printfulSyncVariantId: null, fulfillment: "book", quantity, unitAmount: amount }], amountTotal: amount * quantity, currency: "usd", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  return Response.json({ url: stripe.url });
}

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
  const body = await request.json().catch(() => null) as { items?: { id?: string; quantity?: number }[] } | null;
  const requested = Array.isArray(body?.items) ? body.items.slice(0, 20) : [];
  if (!requested.length) return Response.json({ error: "Your cart is empty." }, { status: 400 });
  const settings = await getPaymentSettings();
  if (!paymentSettingsReady(settings)) return Response.json({ error: "Secure checkout is being configured. Please try again later." }, { status: 503 });
  const cms = await getCmsContent();
  const items = requested.map((requestedItem) => {
    const product = cms.merch.find((entry) => entry.id === requestedItem.id && entry.published);
    const quantity = Math.max(1, Math.min(10, Math.floor(Number(requestedItem.quantity) || 1)));
    const amount = product ? unitAmount(product.price) : 0;
    return product && amount ? { product, quantity, amount } : null;
  }).filter((item): item is NonNullable<typeof item> => Boolean(item));
  if (items.length !== requested.length) return Response.json({ error: "One or more products are no longer available." }, { status: 400 });

  const orderId = randomUUID();
  const database = await getMongoDatabase();
  if (!database) return Response.json({ error: "Order storage is unavailable." }, { status: 503 });
  const origin = (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, "");
  const form = new URLSearchParams({ mode: "payment", success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${origin}/cart`, client_reference_id: orderId, "metadata[order_id]": orderId, billing_address_collection: "required", "shipping_address_collection[allowed_countries][0]": "US" });
  items.forEach(({ product, quantity, amount }, index) => {
    form.set(`line_items[${index}][quantity]`, String(quantity));
    form.set(`line_items[${index}][price_data][currency]`, "usd");
    form.set(`line_items[${index}][price_data][unit_amount]`, String(amount));
    form.set(`line_items[${index}][price_data][product_data][name]`, product.name);
    if (product.shortDescription) form.set(`line_items[${index}][price_data][product_data][description]`, product.shortDescription.slice(0, 500));
  });
  const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", { method: "POST", headers: { authorization: `Bearer ${settings!.secretKey}`, "content-type": "application/x-www-form-urlencoded" }, body: form });
  const stripe = await stripeResponse.json() as { id?: string; url?: string; error?: { message?: string } };
  if (!stripeResponse.ok || !stripe.id || !stripe.url) return Response.json({ error: stripe.error?.message || "Stripe checkout could not be created." }, { status: 502 });
  await database.collection("merch_orders").insertOne({ id: orderId, stripeSessionId: stripe.id, status: "pending", items: items.map(({ product, quantity, amount }) => ({ productId: product.id, name: product.name, quantity, unitAmount: amount })), amountTotal: items.reduce((sum, item) => sum + item.amount * item.quantity, 0), currency: "usd", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  return Response.json({ url: stripe.url });
}

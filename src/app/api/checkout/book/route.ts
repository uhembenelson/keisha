import { randomUUID } from "node:crypto";

import { getCmsContent } from "@/lib/cms";
import { getMongoDatabase } from "@/lib/mongodb";
import { getPaymentSettings, paymentSettingsReady } from "@/lib/payment-settings";
import type { ShippingAddress, ShippingRate } from "@/lib/shipping";

export const runtime = "nodejs";

function unitAmount(price: string) {
  const amount = Number(price.replace(/[^0-9.]/g, ""));
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) : 0;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { bookId?: string; format?: "physical" | "digital"; quantity?: number; quoteId?: string; rateId?: string } | null;
  const cms = await getCmsContent();
  const format = body?.format === "digital" ? "digital" : "physical";
  const book = cms.books.find((entry) => entry.id === body?.bookId && entry.published && entry.availability === "paid");
  const amount = book ? unitAmount(format === "digital" ? book.digitalPrice : book.price) : 0;
  if (!book || !amount || (format === "digital" ? !book.digitalEnabled || !book.digitalDownloadUrl.trim() : !book.physicalEnabled || !book.stripeEnabled)) {
    return Response.json({ error: "This book format is not available for direct checkout." }, { status: 400 });
  }
  const presale = book.presaleEnabled === true;
  const today = new Date().toISOString().slice(0, 10);
  if (presale && (!book.presaleReleaseDate || (book.presaleEndDate && book.presaleEndDate < today))) {
    return Response.json({ error: "Preorders for this book are closed." }, { status: 409 });
  }

  const settings = await getPaymentSettings();
  if (!paymentSettingsReady(settings)) return Response.json({ error: "Secure checkout is being configured. Please try again later." }, { status: 503 });
  const database = await getMongoDatabase();
  if (!database) return Response.json({ error: "Order storage is unavailable." }, { status: 503 });
  let quote: { address?: ShippingAddress; shipmentId?: string; rates?: ShippingRate[] } | null = null;
  let selectedRate: ShippingRate | undefined;
  let quantity = 1;
  if (format === "physical") {
    quantity = Math.max(1, Math.min(10, Math.floor(Number(body?.quantity) || 1)));
    quote = await database.collection("shipping_quotes").findOne({ id: body?.quoteId, bookId: book.id, quantity, expiresAt: { $gt: new Date() } }) as { address?: ShippingAddress; shipmentId?: string; rates?: ShippingRate[] } | null;
    selectedRate = quote?.rates?.find((rate) => rate.id === body?.rateId);
    if (!quote?.address || !selectedRate) return Response.json({ error: "Your shipping quote expired. Calculate shipping again." }, { status: 400 });
  }

  const orderId = randomUUID();
  const origin = (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, "");
  const form = new URLSearchParams({
    mode: "payment",
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/books/${book.slug}`,
    client_reference_id: orderId,
    "metadata[order_id]": orderId,
    "metadata[order_type]": "book",
    "metadata[format]": format,
    "metadata[presale]": presale ? "true" : "false",
    "automatic_tax[enabled]": "true",
    "line_items[0][quantity]": String(quantity),
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": String(amount),
    "line_items[0][price_data][tax_behavior]": "exclusive",
    "line_items[0][price_data][product_data][name]": `${presale ? "Pre-order: " : ""}${book.title}`,
  });
  if (book.shortDescription) form.set("line_items[0][price_data][product_data][description]", book.shortDescription.slice(0, 500));
  if (format === "physical") {
    form.set("customer_email", quote!.address!.email);
    form.set("billing_address_collection", "required");
    form.set("shipping_address_collection[allowed_countries][0]", "US");
    form.set("shipping_options[0][shipping_rate_data][type]", "fixed_amount");
    form.set("shipping_options[0][shipping_rate_data][display_name]", `${selectedRate!.provider} ${selectedRate!.service} shipping`);
    form.set("shipping_options[0][shipping_rate_data][fixed_amount][amount]", String(selectedRate!.amount));
    form.set("shipping_options[0][shipping_rate_data][fixed_amount][currency]", selectedRate!.currency);
    form.set("shipping_options[0][shipping_rate_data][tax_behavior]", "exclusive");
  }
  const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", { method: "POST", headers: { authorization: `Bearer ${settings!.secretKey}`, "content-type": "application/x-www-form-urlencoded" }, body: form });
  const stripe = await stripeResponse.json() as { id?: string; url?: string; error?: { message?: string } };
  if (!stripeResponse.ok || !stripe.id || !stripe.url) return Response.json({ error: stripe.error?.message || "Stripe checkout could not be created." }, { status: 502 });

  const order = format === "digital"
    ? { id: orderId, orderType: "book", format, presale, presaleReleaseDate: presale ? book.presaleReleaseDate : "", stripeSessionId: stripe.id, status: "pending", customerEmail: "", customerName: "", digitalDownloadUrl: book.digitalDownloadUrl.trim(), items: [{ productId: book.id, name: book.title, variantId: "", variantName: "", printfulSyncVariantId: null, fulfillment: "digital", quantity: 1, unitAmount: amount }], amountTotal: amount, currency: "usd", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    : { id: orderId, orderType: "book", format, presale, presaleReleaseDate: presale ? book.presaleReleaseDate : "", stripeSessionId: stripe.id, status: "pending", customerEmail: quote!.address!.email, customerName: quote!.address!.name, shippingAddress: quote!.address, shippoShipmentId: quote!.shipmentId, shippoRateId: selectedRate!.id, shippingRate: selectedRate, shippingAmount: selectedRate!.amount, shippoStatus: presale ? "presale-awaiting-release" : "awaiting-payment", items: [{ productId: book.id, name: book.title, variantId: "", variantName: "", printfulSyncVariantId: null, fulfillment: "shippo", quantity, unitAmount: amount }], amountTotal: amount * quantity + selectedRate!.amount, currency: "usd", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  await database.collection("merch_orders").insertOne(order);
  if (format === "physical") await database.collection("shipping_quotes").updateOne({ id: body?.quoteId }, { $set: { usedAt: new Date().toISOString(), orderId } });
  return Response.json({ url: stripe.url });
}

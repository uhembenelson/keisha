import { randomUUID } from "node:crypto";

import { bookLineCopyCount, bookLinesMatch, bookLinesTotal, bookUnitAmount, isBookBagEligible, normalizeBookLines, type BookLine, type BookLineRequest } from "@/lib/book-order";
import { getCmsBooks } from "@/lib/cms";
import type { CmsBook } from "@/lib/cms-types";
import { getMongoDatabase } from "@/lib/mongodb";
import { getPaymentSettings, paymentSettingsReady } from "@/lib/payment-settings";
import type { ShippingAddress, ShippingRate } from "@/lib/shipping";

export const runtime = "nodejs";

type PricedLine = BookLine & { book: CmsBook; unitAmount: number };

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { items?: BookLineRequest[]; quoteId?: string; rateId?: string } | null;
  const lines = normalizeBookLines(body?.items);
  if (lines.length === 0) return Response.json({ error: "Your book bag is empty." }, { status: 400 });

  const books = await getCmsBooks();
  const priced: PricedLine[] = [];
  for (const line of lines) {
    const book = books.find((entry) => entry.id === line.bookId && isBookBagEligible(entry));
    if (!book || (line.signedCopy && !book.signedCopyEnabled)) continue;
    const unitAmount = bookUnitAmount(book, line.signedCopy);
    if (unitAmount > 0) priced.push({ ...line, book, unitAmount });
  }
  if (priced.length !== lines.length) return Response.json({ error: "One or more books in your bag are no longer available." }, { status: 400 });

  const database = await getMongoDatabase();
  if (!database) return Response.json({ error: "Order storage is unavailable." }, { status: 503 });
  const quantity = bookLineCopyCount(lines);
  const quote = await database.collection("shipping_quotes").findOne({ id: body?.quoteId, quantity, expiresAt: { $gt: new Date() } }) as { address?: ShippingAddress; shipmentId?: string; rates?: ShippingRate[]; items?: BookLine[] } | null;
  if (!quote?.address || !bookLinesMatch(quote.items || [], lines)) return Response.json({ error: "Your shipping quote expired. Calculate shipping again." }, { status: 400 });
  const selectedRate = quote.rates?.find((rate) => rate.id === body?.rateId);
  if (!selectedRate) return Response.json({ error: "Choose a shipping method before continuing." }, { status: 400 });

  const settings = await getPaymentSettings();
  if (!paymentSettingsReady(settings)) return Response.json({ error: "Secure checkout is being configured. Please try again later." }, { status: 503 });

  const orderId = randomUUID();
  const origin = (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, "");
  const customerForm = new URLSearchParams({
    email: quote.address.email,
    name: quote.address.name,
    phone: quote.address.phone,
    "address[line1]": quote.address.street1,
    "address[line2]": quote.address.street2,
    "address[city]": quote.address.city,
    "address[state]": quote.address.state,
    "address[postal_code]": quote.address.zip,
    "address[country]": "US",
    "shipping[name]": quote.address.name,
    "shipping[phone]": quote.address.phone,
    "shipping[address][line1]": quote.address.street1,
    "shipping[address][line2]": quote.address.street2,
    "shipping[address][city]": quote.address.city,
    "shipping[address][state]": quote.address.state,
    "shipping[address][postal_code]": quote.address.zip,
    "shipping[address][country]": "US",
    "metadata[order_id]": orderId,
  });
  const customerResponse = await fetch("https://api.stripe.com/v1/customers", { method: "POST", headers: { authorization: `Bearer ${settings!.secretKey}`, "content-type": "application/x-www-form-urlencoded", "idempotency-key": `books/${orderId}/customer` }, body: customerForm });
  const customer = await customerResponse.json().catch(() => null) as { id?: string; error?: { message?: string } } | null;
  if (!customerResponse.ok || !customer?.id) return Response.json({ error: customer?.error?.message || "Your delivery details could not be prepared for Stripe." }, { status: 502 });

  const form = new URLSearchParams({
    mode: "payment",
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/books/bag`,
    client_reference_id: orderId,
    customer: customer.id,
    "customer_update[address]": "auto",
    "customer_update[shipping]": "auto",
    "billing_address_collection": "required",
    "automatic_tax[enabled]": "true",
    "metadata[order_id]": orderId,
    "metadata[order_type]": "book",
    "metadata[format]": "physical",
    "metadata[presale]": "false",
    "shipping_options[0][shipping_rate_data][type]": "fixed_amount",
    "shipping_options[0][shipping_rate_data][display_name]": `${selectedRate.provider} ${selectedRate.service} shipping`,
    "shipping_options[0][shipping_rate_data][fixed_amount][amount]": String(selectedRate.amount),
    "shipping_options[0][shipping_rate_data][fixed_amount][currency]": selectedRate.currency,
    "shipping_options[0][shipping_rate_data][tax_behavior]": "exclusive",
  });
  priced.forEach((line, index) => {
    form.set(`line_items[${index}][quantity]`, String(line.quantity));
    form.set(`line_items[${index}][price_data][currency]`, "usd");
    form.set(`line_items[${index}][price_data][unit_amount]`, String(line.unitAmount));
    form.set(`line_items[${index}][price_data][tax_behavior]`, "exclusive");
    form.set(`line_items[${index}][price_data][product_data][name]`, `${line.signedCopy ? "Signed copy: " : ""}${line.book.title}`);
    form.set(`line_items[${index}][price_data][product_data][tax_code]`, "txcd_99999999");
    if (line.book.shortDescription) form.set(`line_items[${index}][price_data][product_data][description]`, line.book.shortDescription.slice(0, 500));
  });

  const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", { method: "POST", headers: { authorization: `Bearer ${settings!.secretKey}`, "content-type": "application/x-www-form-urlencoded" }, body: form });
  const stripe = await stripeResponse.json() as { id?: string; url?: string; error?: { message?: string } };
  if (!stripeResponse.ok || !stripe.id || !stripe.url) return Response.json({ error: stripe.error?.message || "Stripe checkout could not be created." }, { status: 502 });

  const subtotal = bookLinesTotal(priced);
  const order = {
    id: orderId,
    orderType: "book",
    orderSource: "book-bag",
    format: "physical",
    presale: false,
    signedCopy: priced.some((line) => line.signedCopy),
    stripeSessionId: stripe.id,
    stripeCustomerId: customer.id,
    status: "pending",
    customerEmail: quote.address.email,
    customerName: quote.address.name,
    shippingAddress: quote.address,
    shippoShipmentId: quote.shipmentId,
    shippoRateId: selectedRate.id,
    shippingRate: selectedRate,
    shippingAmount: selectedRate.amount,
    shippoStatus: "awaiting-payment",
    items: priced.map((line) => ({ productId: line.book.id, name: line.book.title, variantId: "", variantName: line.signedCopy ? "Signed copy" : "", printfulSyncVariantId: null, fulfillment: "shippo", quantity: line.quantity, unitAmount: line.unitAmount })),
    amountTotal: subtotal + selectedRate.amount,
    currency: "usd",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await database.collection("merch_orders").insertOne(order);
  await database.collection("shipping_quotes").updateOne({ id: body?.quoteId }, { $set: { usedAt: new Date().toISOString(), orderId } });
  return Response.json({ url: stripe.url });
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { LoaderCircle, Minus, Plus, ShoppingBag, Trash2, Truck } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { CmsMerchProduct } from "@/lib/cms-types";
import { US_STATES } from "@/lib/us-states";
import { readMerchCart, writeMerchCart, type MerchCartItem } from "@/lib/merch-cart";

type DeliveryAddress = { name: string; email: string; phone: string; street1: string; street2: string; city: string; state: string; zip: string; country: "US" };

function priceNumber(price: string) {
  return Number(price.replace(/[^0-9.]/g, "")) || 0;
}

const fieldClass = "mt-1.5 w-full rounded-xl border border-charcoal/15 bg-white px-4 py-3 text-sm text-charcoal outline-none focus:border-burgundy focus:ring-2 focus:ring-burgundy/10";

export function CartPageClient({ products }: { products: CmsMerchProduct[] }) {
  const [items, setItems] = useState<MerchCartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "delivery">("cart");
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState("");
  const shippingForm = useRef<HTMLFormElement>(null);
  const [address, setAddress] = useState<DeliveryAddress>({ name: "", email: "", phone: "", street1: "", street2: "", city: "", state: "", zip: "", country: "US" });

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setItems(readMerchCart());
      setReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const rows = useMemo(() => items.map((item) => {
    const product = products.find((entry) => entry.id === item.id);
    const variant = item.variantId ? product?.variants.find((entry) => entry.id === item.variantId) : undefined;
    return { ...item, product, variant };
  }).filter((item): item is MerchCartItem & { product: CmsMerchProduct; variant: CmsMerchProduct["variants"][number] | undefined } => Boolean(item.product)), [items, products]);
  const total = rows.reduce((sum, row) => sum + priceNumber(row.variant?.price || row.product.price) * row.quantity, 0);

  function update(id: string, variantId: string | undefined, quantity: number) {
    const matches = (item: MerchCartItem) => item.id === id && item.variantId === variantId;
    const next = quantity <= 0 ? items.filter((item) => !matches(item)) : items.map((item) => matches(item) ? { ...item, quantity: Math.min(quantity, 10) } : item);
    setItems(next); writeMerchCart(next);
    if (next.length === 0) setCheckoutStep("cart");
  }

  async function checkout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCheckingOut(true); setError("");
    try {
      const response = await fetch("/api/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ items: rows.map(({ id, variantId, quantity }) => ({ id, variantId, quantity })), address }) });
      const result = await response.json().catch(() => ({})) as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || "Checkout could not be started.");
      window.location.assign(result.url);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Checkout could not be started.");
      setCheckingOut(false);
    }
  }

  if (!ready) return <div className="grid min-h-64 place-items-center"><LoaderCircle className="size-7 animate-spin text-burgundy" /></div>;
  if (rows.length === 0) return <div className="border border-charcoal/10 bg-cream p-10 text-center"><ShoppingBag className="mx-auto size-10 text-burgundy/40" /><h2 className="mt-5 font-display text-4xl">Your cart is empty.</h2><p className="mt-3 text-sm text-charcoal/60">Explore the merch collection and add something you love.</p><Link href="/merch" className="mt-7 inline-flex bg-burgundy px-6 py-3 text-sm font-semibold text-cream">Shop merch</Link></div>;

  return <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
    <div className="space-y-4">
      {rows.map(({ product, variant, variantId, quantity }) => <article key={`${product.id}:${variantId || "default"}`} className="grid grid-cols-[6rem_1fr] gap-5 border border-charcoal/10 bg-cream p-4 sm:grid-cols-[8rem_1fr_auto] sm:items-center">
        <div className="relative aspect-square bg-dusty-rose/15">{product.image ? <Image src={product.image} alt={product.name} fill unoptimized={product.image.startsWith("/api/uploads/") || /^https?:\/\//.test(product.image)} className="object-cover" /> : <ShoppingBag className="absolute inset-0 m-auto size-8 text-burgundy/35" />}</div>
        <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-burgundy">{product.category}</p><h2 className="mt-2 font-display text-2xl">{product.name}</h2>{variant && <p className="mt-1 text-xs font-semibold text-charcoal/50">{variant.name}</p>}<p className="mt-2 text-sm font-semibold">{variant?.price ? `$${Number(variant.price).toFixed(2)}` : product.price}</p><div className="mt-4 inline-flex items-center border border-charcoal/15"><button type="button" onClick={() => update(product.id, variantId, quantity - 1)} className="grid size-9 place-items-center" aria-label={`Reduce ${product.name} quantity`}><Minus className="size-3.5" /></button><span className="grid min-w-9 place-items-center text-sm font-semibold">{quantity}</span><button type="button" onClick={() => update(product.id, variantId, quantity + 1)} className="grid size-9 place-items-center" aria-label={`Increase ${product.name} quantity`}><Plus className="size-3.5" /></button></div></div>
        <button type="button" onClick={() => update(product.id, variantId, 0)} className="col-span-2 inline-flex items-center gap-2 text-xs font-semibold text-red-700 sm:col-span-1"><Trash2 className="size-4" />Remove</button>
      </article>)}

      {checkoutStep === "delivery" && <form ref={shippingForm} id="merch-delivery-form" onSubmit={(event) => void checkout(event)} className="grid gap-5 border border-charcoal/10 bg-cream p-5 sm:grid-cols-2 sm:p-7">
        <div className="sm:col-span-2 flex items-start gap-3 border-b border-charcoal/10 pb-5"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-burgundy/10 text-burgundy"><Truck className="size-5" /></span><div><h2 className="font-display text-2xl">Delivery details</h2><p className="mt-1 text-sm leading-6 text-charcoal/60">Enter where to send your merch. Shipping is free; Stripe will calculate any applicable tax before payment.</p></div></div>
        <label className="text-xs font-semibold uppercase tracking-[0.1em] text-charcoal/55">Full name<input autoComplete="name" required value={address.name} onChange={(event) => setAddress((current) => ({ ...current, name: event.target.value }))} className={fieldClass} /></label>
        <label className="text-xs font-semibold uppercase tracking-[0.1em] text-charcoal/55">Email<input autoComplete="email" required type="email" value={address.email} onChange={(event) => setAddress((current) => ({ ...current, email: event.target.value }))} className={fieldClass} /></label>
        <label className="text-xs font-semibold uppercase tracking-[0.1em] text-charcoal/55">Phone<input autoComplete="tel" required type="tel" value={address.phone} onChange={(event) => setAddress((current) => ({ ...current, phone: event.target.value }))} className={fieldClass} /></label>
        <label className="text-xs font-semibold uppercase tracking-[0.1em] text-charcoal/55 sm:col-span-2">Street address<input autoComplete="address-line1" required value={address.street1} onChange={(event) => setAddress((current) => ({ ...current, street1: event.target.value }))} className={fieldClass} /></label>
        <label className="text-xs font-semibold uppercase tracking-[0.1em] text-charcoal/55 sm:col-span-2">Apartment, suite, etc. (optional)<input autoComplete="address-line2" value={address.street2} onChange={(event) => setAddress((current) => ({ ...current, street2: event.target.value }))} className={fieldClass} /></label>
        <label className="text-xs font-semibold uppercase tracking-[0.1em] text-charcoal/55">City<input autoComplete="address-level2" required value={address.city} onChange={(event) => setAddress((current) => ({ ...current, city: event.target.value }))} className={fieldClass} /></label>
        <label className="text-xs font-semibold uppercase tracking-[0.1em] text-charcoal/55">State<select autoComplete="address-level1" required value={address.state} onChange={(event) => setAddress((current) => ({ ...current, state: event.target.value }))} className={fieldClass}><option value="">Choose a state</option>{US_STATES.map(([code, name]) => <option key={code} value={code}>{name} ({code})</option>)}</select></label>
        <label className="text-xs font-semibold uppercase tracking-[0.1em] text-charcoal/55">ZIP code<input autoComplete="postal-code" required placeholder="10001" pattern="[0-9]{5}(-[0-9]{4})?" inputMode="numeric" maxLength={10} value={address.zip} onChange={(event) => setAddress((current) => ({ ...current, zip: event.target.value }))} className={fieldClass} /></label>
        <div className="rounded-xl border border-charcoal/10 bg-white px-4 py-3 text-sm text-charcoal/65">Country: <strong>United States</strong></div>
        {error && <p role="alert" className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
      </form>}
    </div>

    <aside className="border border-charcoal/10 bg-charcoal p-6 text-cream lg:sticky lg:top-28"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">{checkoutStep === "cart" ? "Order summary" : "Delivery and payment"}</p><div className="mt-6 flex items-center justify-between border-b border-cream/15 pb-5"><span>Subtotal</span><strong>${total.toFixed(2)}</strong></div><div className="mt-4 flex items-center justify-between text-sm"><span>Merch shipping</span><strong className="text-gold">Free</strong></div><p className="mt-4 text-xs leading-5 text-cream/55">Applicable taxes are calculated by Stripe at checkout.</p>
      {error && checkoutStep === "cart" && <p className="mt-5 bg-red-950/50 p-3 text-sm text-red-100">{error}</p>}
      {checkoutStep === "cart" ? <button type="button" onClick={() => { setError(""); setCheckoutStep("delivery"); }} className="mt-6 inline-flex w-full items-center justify-center gap-2 bg-gold px-5 py-3.5 text-sm font-bold text-charcoal">Continue to delivery details</button> : <><button type="button" onClick={() => shippingForm.current?.requestSubmit()} disabled={checkingOut} className="mt-6 inline-flex w-full items-center justify-center gap-2 bg-gold px-5 py-3.5 text-sm font-bold text-charcoal disabled:opacity-60">{checkingOut ? <><LoaderCircle className="size-4 animate-spin" />Opening secure payment…</> : "Continue to payment"}</button><button type="button" onClick={() => { setError(""); setCheckoutStep("cart"); }} disabled={checkingOut} className="mt-3 w-full px-5 py-2 text-sm font-semibold text-cream/65 hover:text-cream disabled:opacity-60">Back to cart</button></>}
      <Link href="/merch" className="mt-4 block text-center text-xs font-semibold text-cream/55 underline underline-offset-4 hover:text-cream">Keep shopping</Link>
    </aside>
  </div>;
}

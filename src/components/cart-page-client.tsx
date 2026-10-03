"use client";

import Image from "next/image";
import Link from "next/link";
import { LoaderCircle, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { CmsMerchProduct } from "@/lib/cms-types";
import { readMerchCart, writeMerchCart, type MerchCartItem } from "@/lib/merch-cart";

function priceNumber(price: string) {
  return Number(price.replace(/[^0-9.]/g, "")) || 0;
}

export function CartPageClient({ products }: { products: CmsMerchProduct[] }) {
  const [items, setItems] = useState<MerchCartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setItems(readMerchCart());
      setReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);
  const rows = useMemo(() => items.map((item) => ({ ...item, product: products.find((product) => product.id === item.id) })).filter((item): item is MerchCartItem & { product: CmsMerchProduct } => Boolean(item.product)), [items, products]);
  const total = rows.reduce((sum, row) => sum + priceNumber(row.product.price) * row.quantity, 0);

  function update(id: string, quantity: number) {
    const next = quantity <= 0 ? items.filter((item) => item.id !== id) : items.map((item) => item.id === id ? { ...item, quantity: Math.min(quantity, 10) } : item);
    setItems(next); writeMerchCart(next);
  }

  async function checkout() {
    setCheckingOut(true); setError("");
    try {
      const response = await fetch("/api/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ items: rows.map(({ id, quantity }) => ({ id, quantity })) }) });
      const result = await response.json() as { url?: string; error?: string };
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
    <div className="space-y-4">{rows.map(({ product, quantity }) => <article key={product.id} className="grid grid-cols-[6rem_1fr] gap-5 border border-charcoal/10 bg-cream p-4 sm:grid-cols-[8rem_1fr_auto] sm:items-center">
      <div className="relative aspect-square bg-dusty-rose/15">{product.image ? <Image src={product.image} alt={product.name} fill unoptimized={product.image.startsWith("/api/uploads/")} className="object-cover" /> : <ShoppingBag className="absolute inset-0 m-auto size-8 text-burgundy/35" />}</div>
      <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-burgundy">{product.category}</p><h2 className="mt-2 font-display text-2xl">{product.name}</h2><p className="mt-2 text-sm font-semibold">{product.price}</p><div className="mt-4 inline-flex items-center border border-charcoal/15"><button type="button" onClick={() => update(product.id, quantity - 1)} className="grid size-9 place-items-center" aria-label={`Reduce ${product.name} quantity`}><Minus className="size-3.5" /></button><span className="grid min-w-9 place-items-center text-sm font-semibold">{quantity}</span><button type="button" onClick={() => update(product.id, quantity + 1)} className="grid size-9 place-items-center" aria-label={`Increase ${product.name} quantity`}><Plus className="size-3.5" /></button></div></div>
      <button type="button" onClick={() => update(product.id, 0)} className="col-span-2 inline-flex items-center gap-2 text-xs font-semibold text-red-700 sm:col-span-1"><Trash2 className="size-4" />Remove</button>
    </article>)}</div>
    <aside className="border border-charcoal/10 bg-charcoal p-6 text-cream lg:sticky lg:top-28"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Order summary</p><div className="mt-6 flex items-center justify-between border-b border-cream/15 pb-5"><span>Subtotal</span><strong>${total.toFixed(2)}</strong></div><p className="mt-4 text-xs leading-5 text-cream/55">Shipping and applicable taxes are finalized securely during Stripe checkout.</p>{error && <p className="mt-5 bg-red-950/50 p-3 text-sm text-red-100">{error}</p>}<button type="button" onClick={checkout} disabled={checkingOut} className="mt-6 inline-flex w-full items-center justify-center gap-2 bg-gold px-5 py-3.5 text-sm font-bold text-charcoal disabled:opacity-60">{checkingOut ? <><LoaderCircle className="size-4 animate-spin" />Opening checkout…</> : "Secure checkout"}</button></aside>
  </div>;
}

"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useState } from "react";

import { addMerchToCart } from "@/lib/merch-cart";
import type { CmsMerchVariant } from "@/lib/cms-types";

export function AddToCartButton({ productId, label = "Add to cart", className, variants = [], requireVariant = false }: { productId: string; label?: string; className: string; variants?: CmsMerchVariant[]; requireVariant?: boolean }) {
  const [added, setAdded] = useState(false);
  const availableVariants = variants.filter((variant) => variant.available);
  const [variantId, setVariantId] = useState(availableVariants[0]?.id || "");
  if (added) return <Link href="/cart" className={className}>Added · View cart <ShoppingBag className="size-4" /></Link>;
  return <div className="mt-auto pt-6">{availableVariants.length > 0 && <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-charcoal/55">Choose an option<select value={variantId} onChange={(event) => setVariantId(event.target.value)} className="mt-2 w-full border border-charcoal/15 bg-white px-3 py-2.5 text-sm text-charcoal outline-none focus:border-burgundy">{availableVariants.map((variant) => <option key={variant.id} value={variant.id}>{variant.name}{variant.price ? ` — $${Number(variant.price).toFixed(2)}` : ""}</option>)}</select></label>}{requireVariant && availableVariants.length === 0 && <p className="text-sm font-semibold text-red-700">Currently unavailable</p>}<button type="button" disabled={requireVariant && !variantId} onClick={() => { addMerchToCart(productId, variantId || undefined); setAdded(true); }} className={`${className} ${availableVariants.length > 0 ? "mt-3" : ""} disabled:cursor-not-allowed disabled:opacity-45`}>{label}<ShoppingBag className="size-4" /></button></div>;
}

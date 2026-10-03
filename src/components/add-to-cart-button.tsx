"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useState } from "react";

import { addMerchToCart } from "@/lib/merch-cart";

export function AddToCartButton({ productId, label = "Add to cart", className }: { productId: string; label?: string; className: string }) {
  const [added, setAdded] = useState(false);
  if (added) return <Link href="/cart" className={className}>Added · View cart <ShoppingBag className="size-4" /></Link>;
  return <button type="button" onClick={() => { addMerchToCart(productId); setAdded(true); }} className={className}>{label}<ShoppingBag className="size-4" /></button>;
}

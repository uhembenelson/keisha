"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";

import { MERCH_CART_EVENT, readMerchCart } from "@/lib/merch-cart";

export function CartLink({ mobile = false }: { mobile?: boolean }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const update = () => setCount(readMerchCart().reduce((sum, item) => sum + item.quantity, 0));
    update();
    window.addEventListener(MERCH_CART_EVENT, update);
    window.addEventListener("storage", update);
    return () => { window.removeEventListener(MERCH_CART_EVENT, update); window.removeEventListener("storage", update); };
  }, []);
  return <Link href="/cart" className={mobile ? "flex items-center justify-between border-b border-charcoal/15 py-4 font-display text-3xl text-burgundy" : "relative grid size-9 place-items-center border border-burgundy/20 text-burgundy hover:bg-burgundy hover:text-cream"} aria-label={`Shopping cart with ${count} items`}><span className={mobile ? "flex items-center gap-3" : ""}><ShoppingBag className="size-5" />{mobile && "Cart"}</span>{count > 0 && <span className={mobile ? "text-sm font-sans font-bold" : "absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-gold text-[0.65rem] font-bold text-charcoal"}>{count}</span>}</Link>;
}

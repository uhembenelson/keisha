"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useEffect } from "react";

import { writeMerchCart } from "@/lib/merch-cart";

export function CheckoutSuccess() {
  useEffect(() => { writeMerchCart([]); }, []);
  return <div className="mx-auto max-w-2xl border border-charcoal/10 bg-cream p-8 text-center sm:p-12"><span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-700 text-white"><Check className="size-6" /></span><h1 className="mt-6 font-display text-5xl">Thank you for your order.</h1><p className="mt-4 text-base leading-7 text-charcoal/65">Your payment was submitted securely through Stripe. A receipt and order confirmation will be sent to the email used during checkout.</p><Link href="/merch" className="mt-8 inline-flex bg-burgundy px-6 py-3 text-sm font-semibold text-cream">Continue shopping</Link></div>;
}

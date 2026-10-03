import type { Metadata } from "next";

import { CartPageClient } from "@/components/cart-page-client";
import { Navbar } from "@/components/navbar";
import { SiteFooter } from "@/components/site-footer";
import { getCmsContent } from "@/lib/cms";

export const metadata: Metadata = { title: "Shopping Cart", robots: { index: false, follow: true } };
export const dynamic = "force-dynamic";

export default async function CartPage() {
  const products = (await getCmsContent()).merch.filter((product) => product.published);
  return <main className="min-h-screen bg-[#fffaf1] text-charcoal"><Navbar /><section className="px-5 pb-20 pt-36 sm:px-8 lg:px-12 lg:pb-28"><div className="mx-auto max-w-[82rem]"><p className="section-kicker">Your order</p><h1 className="mt-4 font-display text-5xl sm:text-6xl">Shopping cart</h1><div className="mt-10"><CartPageClient products={products} /></div></div></section><SiteFooter /></main>;
}

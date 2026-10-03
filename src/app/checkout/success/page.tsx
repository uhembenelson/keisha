import type { Metadata } from "next";

import { CheckoutSuccess } from "@/components/checkout-success";
import { Navbar } from "@/components/navbar";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = { title: "Order received", robots: { index: false, follow: false } };

export default function CheckoutSuccessPage() {
  return <main className="min-h-screen bg-[#fffaf1] text-charcoal"><Navbar /><section className="px-5 pb-20 pt-40 sm:px-8 lg:px-12 lg:pb-28"><CheckoutSuccess /></section><SiteFooter /></main>;
}

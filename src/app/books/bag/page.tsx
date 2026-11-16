import type { Metadata } from "next";

import { BookBagClient } from "@/components/book-bag-client";
import { Navbar } from "@/components/navbar";
import { SiteFooter } from "@/components/site-footer";
import { getCmsContent } from "@/lib/cms";

export const metadata: Metadata = { title: "Book Bag", robots: { index: false, follow: true } };
export const dynamic = "force-dynamic";

export default async function BookBagPage() {
  const books = (await getCmsContent()).books.filter((book) => book.published);
  return (
    <main className="min-h-screen bg-[#fffaf1] text-charcoal">
      <Navbar />
      <section className="px-5 pb-20 pt-36 sm:px-8 lg:px-12 lg:pb-28">
        <div className="mx-auto max-w-[82rem]">
          <p className="section-kicker">Your order</p>
          <h1 className="mt-4 font-display text-5xl sm:text-6xl">Book bag</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-charcoal/65">Mix any titles and quantities. Everything in your bag ships together in one order, so shipping is calculated once.</p>
          <div className="mt-10"><BookBagClient books={books} /></div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

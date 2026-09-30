import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Navbar } from "@/components/navbar";
import { PageHero } from "@/components/page-hero";
import { SiteFooter } from "@/components/site-footer";
import { BookAction } from "@/components/book-action";
import { getCmsContent } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Books",
  description:
    "Browse the novels by Keisha ‘WriteNow’ Allen, including the contemporary fiction titles Worth the Weight and The Love Enthusiast.",
  alternates: { canonical: "/books" },
};
export const dynamic = "force-dynamic";

export default async function BooksPage() {
  const cms = await getCmsContent();
  const books = cms.books.filter((book) => book.published);
  return (
    <main className="bg-[#fffaf1] text-charcoal">
      <Navbar />
      <PageHero eyebrow="Published work" title="Stories beyond the expected.">Discover contemporary fiction filled with layered women, complicated love, lighthearted humor, and messages that linger.</PageHero>
      <section className="px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto grid max-w-[82rem] gap-8 lg:grid-cols-2">
          {books.map((book) => (
            <article key={book.id} className="grid overflow-hidden border border-charcoal/12 bg-cream sm:grid-cols-[0.8fr_1.2fr]">
              <Link href={`/books/${book.slug}`} className="relative min-h-[32rem] bg-dusty-rose/25">
                <Image src={book.cover} alt={`${book.title} cover`} fill unoptimized={book.cover.startsWith("/api/uploads/")} sizes="(max-width: 640px) 100vw, 32vw" className="object-contain p-8 drop-shadow-xl" />
              </Link>
              <div className="flex flex-col justify-end p-8 lg:p-10">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-burgundy">{book.category}</p>
                <h2 className="mt-3 font-display text-4xl leading-none sm:text-5xl">{book.title}</h2>
                <p className="mt-5 text-base leading-7 text-charcoal/70">{book.shortDescription}</p>
                <div className="mt-8 flex flex-wrap items-center gap-4"><BookAction book={book} /><Link href={`/books/${book.slug}`} className="inline-flex w-fit items-center gap-2 border-b-2 border-burgundy pb-1 text-sm font-semibold text-burgundy">Read more <ArrowUpRight className="size-4" /></Link></div>
              </div>
            </article>
          ))}
          {books.length === 0 && <p className="col-span-full py-16 text-center font-display text-3xl text-charcoal/55">New books will be shared here soon.</p>}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

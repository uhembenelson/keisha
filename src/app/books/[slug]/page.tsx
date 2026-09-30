import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

import { Navbar } from "@/components/navbar";
import { SiteFooter } from "@/components/site-footer";
import { getCmsContent } from "@/lib/cms";
import { BookAction } from "@/components/book-action";

export const dynamic = "force-dynamic";

type BookPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: BookPageProps): Promise<Metadata> {
  const { slug } = await params;
  const cms = await getCmsContent();
  const book = cms.books.find((item) => item.slug === slug && item.published);

  if (!book) {
    return { title: "Book not found", robots: { index: false, follow: true } };
  }

  const description = book.shortDescription || book.description?.slice(0, 160) || `Read ${book.title} by Keisha ‘WriteNow’ Allen.`;

  return {
    title: book.title,
    description,
    alternates: { canonical: `/books/${book.slug}` },
    openGraph: {
      type: "book",
      title: `${book.title} by Keisha ‘WriteNow’ Allen`,
      description,
      images: book.cover ? [{ url: book.cover, alt: `${book.title} book cover` }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${book.title} by Keisha ‘WriteNow’ Allen`,
      description,
    },
  };
}

export default async function BookPage({ params }: BookPageProps) {
  const { slug } = await params;
  const cms = await getCmsContent();
  const book = cms.books.find((item) => item.slug === slug && item.published);
  if (!book) notFound();

  return (
    <main className="bg-cream text-charcoal">
      <Navbar />
      <section className="bg-charcoal px-5 pb-20 pt-36 text-cream sm:px-8 sm:pt-40 lg:px-12">
        <div className="mx-auto grid max-w-[82rem] gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
          <div className="relative min-h-[38rem]"><Image src={book.cover} alt={`${book.title} book cover`} fill priority unoptimized={book.cover.startsWith("/api/uploads/")} sizes="(max-width: 1024px) 100vw, 36vw" className="object-contain drop-shadow-2xl" /></div>
          <div>
            <Link href="/books" className="inline-flex items-center gap-2 text-sm font-semibold text-gold"><ArrowLeft className="size-4" /> All books</Link>
            <p className="mt-10 text-xs font-semibold uppercase tracking-[0.22em] text-gold">{book.category}</p>
            <h1 className="mt-4 font-display text-6xl leading-none sm:text-7xl">{book.title}</h1>
            <div className="mt-8 space-y-5 text-base leading-8 text-cream/75 sm:text-lg">{book.description.split(/\n\n+/).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
            <div className="mt-8 flex flex-wrap items-center gap-5"><BookAction book={book} tone="gold" /><Link href="/contact" className="inline-flex items-center gap-2 border-b border-cream/40 pb-1 text-sm font-semibold text-cream">Ask about a signed copy <ArrowUpRight className="size-4" /></Link></div>
          </div>
        </div>
      </section>
      {(book.gallery ?? []).length > 0 && <section className="px-5 py-16 sm:px-8 lg:px-12 lg:py-24"><div className="mx-auto max-w-[82rem]"><p className="section-kicker">Inside the story</p><div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{book.gallery.map((image) => <div key={image} className="relative aspect-[4/3] overflow-hidden bg-dusty-rose/20"><Image src={image} alt={`${book.title} gallery`} fill unoptimized={image.startsWith("/api/uploads/")} sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" /></div>)}</div></div></section>}
      <SiteFooter />
    </main>
  );
}

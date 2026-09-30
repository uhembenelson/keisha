import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Navbar } from "@/components/navbar";
import { SiteFooter } from "@/components/site-footer";
import { getCmsContent } from "@/lib/cms";

export const dynamic = "force-dynamic";

type NewsPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: NewsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = (await getCmsContent()).news.find((entry) => entry.slug === slug && entry.published);

  if (!item) {
    return { title: "Article not found", robots: { index: false, follow: true } };
  }

  const description = item.excerpt || item.body?.slice(0, 160) || `Read the latest from Keisha ‘WriteNow’ Allen.`;

  return {
    title: item.title,
    description,
    alternates: { canonical: `/news/${item.slug}` },
    openGraph: {
      type: "article",
      title: item.title,
      description,
      images: item.image ? [{ url: item.image, alt: item.title }] : undefined,
      publishedTime: item.date || undefined,
    },
    twitter: { card: "summary_large_image", title: item.title, description },
  };
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = (await getCmsContent()).news.find((entry) => entry.slug === slug && entry.published);
  if (!item) notFound();
  return <main className="bg-[#fffaf1] text-charcoal"><Navbar /><article className="px-5 pb-20 pt-36 sm:px-8 lg:px-12 lg:pb-28"><div className="mx-auto max-w-4xl"><Link href="/news" className="inline-flex items-center gap-2 text-sm font-semibold text-burgundy"><ArrowLeft className="size-4" />All news</Link><p className="mt-12 text-xs font-semibold uppercase tracking-[0.2em] text-burgundy">{item.date || "News & journal"}</p><h1 className="mt-4 font-display text-5xl leading-tight sm:text-7xl">{item.title}</h1><p className="mt-6 text-xl leading-8 text-charcoal/60">{item.excerpt}</p>{item.image && <div className="relative mt-10 aspect-[16/9] overflow-hidden"><Image src={item.image} alt="" fill unoptimized={item.image.startsWith("/api/uploads/")} className="object-cover" /></div>}<div className="mt-10 space-y-6 text-base leading-8 text-charcoal/75 sm:text-lg">{item.body.split(/\n\n+/).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>{item.gallery.length > 0 && <Gallery title="Story gallery" images={item.gallery} />}</div></article><SiteFooter /></main>;
}

function Gallery({ title, images }: { title: string; images: string[] }) { return <section className="mt-14 border-t border-charcoal/15 pt-10"><h2 className="font-display text-3xl">{title}</h2><div className="mt-6 grid gap-4 sm:grid-cols-2">{images.map((image) => <div key={image} className="relative aspect-[4/3] overflow-hidden"><Image src={image} alt="" fill unoptimized={image.startsWith("/api/uploads/")} className="object-cover" /></div>)}</div></section>; }

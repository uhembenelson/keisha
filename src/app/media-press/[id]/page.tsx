import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { SiteFooter } from "@/components/site-footer";
import { getCmsContent } from "@/lib/cms";
export const dynamic = "force-dynamic";

type MediaPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: MediaPageProps): Promise<Metadata> {
  const { id } = await params;
  const item = (await getCmsContent()).media.find((entry) => entry.id === id && entry.published);

  if (!item) {
    return { title: "Feature not found", robots: { index: false, follow: true } };
  }

  const description = item.summary || `${item.type} featuring Keisha ‘WriteNow’ Allen on ${item.outlet}.`;

  return {
    title: item.title,
    description,
    alternates: { canonical: `/media-press/${item.id}` },
    openGraph: {
      type: "article",
      title: `${item.title} — ${item.outlet}`,
      description,
      images: item.image ? [{ url: item.image, alt: item.title }] : undefined,
    },
    twitter: { card: "summary_large_image", title: item.title, description },
  };
}
export default async function MediaDetailPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const cms = await getCmsContent(); const item = cms.media.find((entry) => entry.id === id && entry.published); if (!item) notFound(); return <main className="bg-[#fffaf1] text-charcoal"><Navbar /><article className="px-5 pb-20 pt-36 sm:px-8 lg:px-12 lg:pb-28"><div className="mx-auto max-w-5xl"><Link href="/media-press" className="inline-flex items-center gap-2 text-sm font-semibold text-burgundy"><ArrowLeft className="size-4" />{cms.settings.mediaPageBackLabel}</Link><p className="mt-12 text-xs font-semibold uppercase tracking-[0.2em] text-burgundy">{item.type}{item.date ? ` · ${item.date}` : ""}</p><h1 className="mt-4 font-display text-5xl leading-tight sm:text-7xl">{item.title}</h1><p className="mt-3 font-semibold text-charcoal/50">{item.outlet}</p>{item.image && <div className="relative mt-10 aspect-[16/9]"><Image src={item.image} alt="" fill unoptimized={item.image.startsWith("/api/uploads/")} className="object-cover" /></div>}<p className="mt-10 whitespace-pre-wrap text-lg leading-8 text-charcoal/75">{item.summary}</p>{item.mediaUrl && <a href={item.mediaUrl} target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-2 bg-charcoal px-6 py-3 text-sm font-semibold text-cream">{item.mediaCtaLabel || cms.settings.mediaPageOpenLinkFallback} <ArrowUpRight className="size-4" /></a>}{item.gallery.length > 0 && <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{item.gallery.map((image) => <div key={image} className="relative aspect-[4/3]"><Image src={image} alt="" fill unoptimized={image.startsWith("/api/uploads/")} className="object-cover" /></div>)}</div>}<Link href="/contact" className="mt-10 inline-flex items-center gap-2 bg-burgundy px-6 py-3 text-sm font-semibold text-cream">{cms.settings.mediaPageInquiryLabel} <ArrowUpRight className="size-4" /></Link></div></article><SiteFooter /></main>; }

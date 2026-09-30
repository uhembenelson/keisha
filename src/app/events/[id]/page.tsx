import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { SiteFooter } from "@/components/site-footer";
import { getCmsContent } from "@/lib/cms";
export const dynamic = "force-dynamic";

type EventPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { id } = await params;
  const item = (await getCmsContent()).events.find((entry) => entry.id === id && entry.published);

  if (!item) {
    return { title: "Event not found", robots: { index: false, follow: true } };
  }

  const when = item.date ? new Date(item.date).toLocaleDateString("en-US", { dateStyle: "long" }) : "Date to be announced";
  const description = `${item.title} — ${when} in ${item.location}. ${item.description?.slice(0, 120) ?? ""}`.trim();

  return {
    title: item.title,
    description,
    alternates: { canonical: `/events/${item.id}` },
    openGraph: {
      type: "article",
      title: `${item.title} — Keisha ‘WriteNow’ Allen`,
      description,
      images: item.image ? [{ url: item.image, alt: item.title }] : undefined,
    },
    twitter: { card: "summary_large_image", title: item.title, description },
  };
}
export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const item = (await getCmsContent()).events.find((entry) => entry.id === id && entry.published); if (!item) notFound(); return <main className="bg-cream text-charcoal"><Navbar /><article className="px-5 pb-20 pt-36 sm:px-8 lg:px-12 lg:pb-28"><div className="mx-auto max-w-5xl"><Link href="/events" className="inline-flex items-center gap-2 text-sm font-semibold text-burgundy"><ArrowLeft className="size-4" />All events</Link><div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">{item.image && <div className="relative min-h-[28rem]"><Image src={item.image} alt="" fill unoptimized={item.image.startsWith("/api/uploads/")} className="object-cover" /></div>}<div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-burgundy">{item.date ? new Date(item.date).toLocaleString() : "Date to be announced"}</p><h1 className="mt-4 font-display text-5xl leading-tight sm:text-6xl">{item.title}</h1><p className="mt-3 font-semibold text-charcoal/55">{item.location}</p><p className="mt-7 whitespace-pre-wrap text-base leading-8 text-charcoal/75">{item.description}</p><Link href="/contact" className="mt-8 inline-flex items-center gap-2 bg-burgundy px-6 py-3 text-sm font-semibold text-cream">Ask about this event <ArrowUpRight className="size-4" /></Link></div></div>{item.gallery.length > 0 && <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{item.gallery.map((image) => <div key={image} className="relative aspect-[4/3]"><Image src={image} alt="" fill unoptimized={image.startsWith("/api/uploads/")} className="object-cover" /></div>)}</div>}</div></article><SiteFooter /></main>; }

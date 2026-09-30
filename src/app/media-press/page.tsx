import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Camera, Mic2, Play } from "lucide-react";

import { Navbar } from "@/components/navbar";
import { PageHero } from "@/components/page-hero";
import { SiteFooter } from "@/components/site-footer";
import { getCmsContent } from "@/lib/cms";

export const metadata: Metadata = { title: "Media + Press | Keisha WriteNow Allen" };

export const dynamic = "force-dynamic";

export default async function MediaPressPage() {
  const cms = await getCmsContent();
  const mediaItems = cms.media.filter((item) => item.published);
  return (
    <main className="bg-[#fffaf1] text-charcoal">
      <Navbar />
      <PageHero eyebrow="Media + Press" title="Conversations about books, creativity, and purpose.">Resources and inquiry information for interviews, features, speaking engagements, and press opportunities.</PageHero>
      <section className="px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto grid max-w-[82rem] gap-12 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="relative min-h-[36rem] overflow-hidden"><Image src="/images/keisha-profile-c.png" alt="Keisha WriteNow Allen portrait" fill sizes="(max-width: 1024px) 100vw, 42vw" className="object-cover" /></div>
          <div>
            <p className="section-kicker">Press resources</p>
            <h2 className="mt-5 font-display text-4xl leading-tight sm:text-5xl">A contemporary fiction author with a purpose-led story.</h2>
            <div className="mt-9 grid gap-px bg-charcoal/12 sm:grid-cols-3">
              <div className="bg-cream p-6"><Mic2 className="size-5 text-burgundy" /><p className="mt-8 font-display text-2xl">Interviews</p></div>
              <div className="bg-cream p-6"><Camera className="size-5 text-burgundy" /><p className="mt-8 font-display text-2xl">Features</p></div>
              <div className="bg-cream p-6"><Play className="size-5 text-burgundy" /><p className="mt-8 font-display text-2xl">Appearances</p></div>
            </div>
            <p className="mt-8 text-base leading-8 text-charcoal/70">Keisha speaks about discovering your purpose, contemporary fiction, creative entrepreneurship, publishing, and the life-changing work of returning to your voice.</p>
            <Link href="/contact" className="mt-8 inline-flex items-center gap-2 bg-burgundy px-6 py-3 text-sm font-semibold text-cream">Send a media inquiry <ArrowUpRight className="size-4" /></Link>
          </div>
        </div>
        {mediaItems.length > 0 && <div className="mx-auto mt-16 max-w-[82rem] border-t border-charcoal/15 pt-12"><p className="section-kicker">Featured coverage</p><div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{mediaItems.map((item) => <article key={item.id} className="overflow-hidden bg-cream">{item.image && <Link href={`/media-press/${item.id}`} className="relative block aspect-[16/10]"><Image src={item.image} alt="" fill unoptimized={item.image.startsWith("/api/uploads/")} sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" /></Link>}<div className="p-7"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-burgundy">{item.type}{item.date ? ` · ${item.date}` : ""}</p><h2 className="mt-4 font-display text-3xl leading-tight">{item.title}</h2><p className="mt-2 text-sm font-semibold text-charcoal/50">{item.outlet}</p><p className="mt-5 text-sm leading-6 text-charcoal/70">{item.summary}</p><Link href={`/media-press/${item.id}`} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-burgundy">View feature <ArrowUpRight className="size-4" /></Link></div></article>)}</div></div>}
      </section>
      <SiteFooter />
    </main>
  );
}

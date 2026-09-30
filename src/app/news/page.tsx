import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Newspaper } from "lucide-react";

import { Navbar } from "@/components/navbar";
import { NewsletterForm } from "@/components/newsletter-form";
import { PageHero } from "@/components/page-hero";
import { SiteFooter } from "@/components/site-footer";
import { getCmsContent } from "@/lib/cms";

export const metadata: Metadata = { title: "News | Keisha WriteNow Allen" };

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const cms = await getCmsContent();
  const updates = cms.news.filter((item) => item.published);
  return (
    <main className="bg-[#fffaf1] text-charcoal">
      <Navbar />
      <PageHero eyebrow="News & journal" title="The latest from Keisha’s creative world.">Book news, writing reflections, interviews, and inspiration from the journey.</PageHero>
      <section className="px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-[82rem]">
          <div className="grid gap-px border border-charcoal/12 bg-charcoal/12 md:grid-cols-2 lg:grid-cols-3">
            {updates.map((item) => <article key={item.id} className="bg-cream">{item.image && <Link href={`/news/${item.slug}`} className="relative block aspect-[16/10]"><Image src={item.image} alt="" fill unoptimized={item.image.startsWith("/api/uploads/")} sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" /></Link>}<div className="p-8 sm:p-10"><Newspaper className="size-5 text-burgundy" /><p className="mt-12 text-xs font-semibold uppercase tracking-[0.16em] text-burgundy">{item.date || "Latest update"}</p><h2 className="mt-3 font-display text-3xl"><Link href={`/news/${item.slug}`}>{item.title}</Link></h2><p className="mt-3 text-base leading-7 text-charcoal/70">{item.excerpt}</p><Link href={`/news/${item.slug}`} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-burgundy">Read the story <ArrowUpRight className="size-4" /></Link></div></article>)}
            {updates.length === 0 && <div className="col-span-full bg-cream px-8 py-16 text-center"><Newspaper className="mx-auto size-6 text-burgundy" /><h2 className="mt-5 font-display text-3xl">The next story is taking shape.</h2><p className="mx-auto mt-3 max-w-lg text-base leading-7 text-charcoal/65">News, writing reflections, and book updates will be published here soon.</p></div>}
          </div>
          <div className="mt-16 grid gap-10 bg-burgundy p-8 text-cream sm:p-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">The WriteNow Letter</p><h2 className="mt-4 font-display text-4xl sm:text-5xl">{cms.settings.newsletterTitle}</h2></div>
            <div><NewsletterForm /><Link href="/contact" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gold">Have a story idea? Contact Keisha <ArrowUpRight className="size-4" /></Link></div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

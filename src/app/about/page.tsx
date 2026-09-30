import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Navbar } from "@/components/navbar";
import { PageHero } from "@/components/page-hero";
import { SiteFooter } from "@/components/site-footer";
import { getCmsContent } from "@/lib/cms";

export const metadata: Metadata = {
  title: "About",
  description:
    "Meet Keisha ‘WriteNow’ Allen — a Miami-based project manager by day and contemporary fiction author, singer, and speaker by calling.",
  alternates: { canonical: "/about" },
};

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const cms = await getCmsContent();
  return (
    <main className="bg-cream text-charcoal">
      <Navbar />
      <PageHero eyebrow="About Keisha" title="A writer shaped by purpose, humor, and heart.">
        {cms.settings.heroBio}
      </PageHero>
      <section className="px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto grid max-w-[82rem] gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div className="relative min-h-[38rem] overflow-hidden bg-dusty-rose/25">
            <Image src={cms.settings.aboutImage || cms.settings.heroImage || "/images/pic.jpeg"} alt="Keisha WriteNow Allen" fill sizes="(max-width: 1024px) 100vw, 42vw" className="object-cover" />
          </div>
          <div className="max-w-2xl lg:pt-8">
            <p className="section-kicker">Her story</p>
            <h2 className="mt-6 font-display text-4xl font-medium leading-tight sm:text-5xl">Rediscovering writing changed the direction of her life.</h2>
            <div className="mt-8 space-y-6 text-base leading-8 text-charcoal/75 sm:text-lg">
              <p>{cms.settings.heroBio}</p>
              <p>Keisha enjoys creating stories with lighthearted humor that leave a profound message. She’s a testament of what the power of finding and following your purpose can do and aims to inspire others to do the same.</p>
              <p>In her spare time, you can find her at a wine tasting event, music or comedy show, traveling, sampling vegan dishes, or simply curled up with a captivating read.</p>
            </div>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link href="/books" className="inline-flex items-center gap-2 bg-burgundy px-6 py-3 text-sm font-semibold text-cream">Explore the books <ArrowUpRight className="size-4" /></Link>
              <Link href="/contact" className="inline-flex items-center gap-2 border-b-2 border-burgundy px-1 py-3 text-sm font-semibold text-burgundy">Contact Keisha <ArrowUpRight className="size-4" /></Link>
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

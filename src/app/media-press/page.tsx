import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Navbar } from "@/components/navbar";
import { PageHero } from "@/components/page-hero";
import { SiteFooter } from "@/components/site-footer";
import { getCmsContent } from "@/lib/cms";
import { CMS_MEDIA_CATEGORIES, type CmsMediaCategory } from "@/lib/cms-types";

export const metadata: Metadata = {
  title: "Media + Press",
  description:
    "Interviews, podcast appearances, and features featuring author Keisha ‘WriteNow’ Allen.",
  alternates: { canonical: "/media-press" },
};

export const dynamic = "force-dynamic";

function categoryAnchor(category: CmsMediaCategory) {
  return `media-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
}

export default async function MediaPressPage() {
  const cms = await getCmsContent();
  const mediaItems = cms.media.filter((item) => item.published);
  return (
    <main className="bg-[#fffaf1] text-charcoal">
      <Navbar />
      <PageHero eyebrow={cms.settings.mediaPageEyebrow} title={cms.settings.mediaPageTitle} image={cms.settings.mediaPageHeroImage} imageAlt={cms.settings.mediaPageHeroImageAlt}>{cms.settings.mediaPageIntro}</PageHero>
      <section className="px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto grid max-w-[82rem] gap-12 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="relative min-h-[36rem] overflow-hidden"><Image src={cms.settings.mediaPageImage} alt={cms.settings.mediaPageImageAlt} fill unoptimized={cms.settings.mediaPageImage.startsWith("/api/uploads/")} sizes="(max-width: 1024px) 100vw, 42vw" className="object-cover" /></div>
          <div>
            <p className="section-kicker">{cms.settings.mediaPageResourcesKicker}</p>
            <h2 className="mt-5 font-display text-4xl leading-tight sm:text-5xl">{cms.settings.mediaPageResourcesTitle}</h2>
            <div className="mt-9 grid gap-px bg-charcoal/12 sm:grid-cols-2">
              {CMS_MEDIA_CATEGORIES.map((category, index) => {
                const count = mediaItems.filter((item) => item.type === category).length;
                const content = <><span className="text-xs font-semibold text-burgundy">{String(index + 1).padStart(2, "0")}</span><span className="font-display text-2xl">{category}</span>{count > 0 && <span className="text-xs font-semibold text-charcoal/45">{count} {count === 1 ? "item" : "items"}</span>}</>;
                return count > 0 ? <a key={category} href={`#${categoryAnchor(category)}`} className="flex min-h-24 items-center justify-between gap-4 bg-cream p-5 transition hover:bg-dusty-rose/15">{content}</a> : <div key={category} className="flex min-h-24 items-center justify-between gap-4 bg-cream p-5">{content}</div>;
              })}
            </div>
            <p className="mt-8 text-base leading-8 text-charcoal/70">{cms.settings.mediaPageResourcesCopy}</p>
            <Link href="/contact" className="mt-8 inline-flex items-center gap-2 bg-burgundy px-6 py-3 text-sm font-semibold text-cream">{cms.settings.mediaPageInquiryLabel} <ArrowUpRight className="size-4" /></Link>
          </div>
        </div>
        {mediaItems.length > 0 && <div className="mx-auto mt-16 max-w-[82rem] space-y-16 border-t border-charcoal/15 pt-12">{CMS_MEDIA_CATEGORIES.map((category) => {
          const categoryItems = mediaItems.filter((item) => item.type === category);
          if (categoryItems.length === 0) return null;
          return <section key={category} id={categoryAnchor(category)} className="scroll-mt-28"><p className="section-kicker">{category}</p><div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{categoryItems.map((item) => <article key={item.id} className="overflow-hidden bg-cream">{item.image && <Link href={`/media-press/${item.id}`} className="relative block aspect-[16/10]"><Image src={item.image} alt="" fill unoptimized={item.image.startsWith("/api/uploads/")} sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" /></Link>}<div className="p-7"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-burgundy">{item.type}{item.date ? ` · ${item.date}` : ""}</p><h2 className="mt-4 font-display text-3xl leading-tight">{item.title}</h2><p className="mt-2 text-sm font-semibold text-charcoal/50">{item.outlet}</p><p className="mt-5 text-sm leading-6 text-charcoal/70">{item.summary}</p><div className="mt-6 flex flex-wrap items-center gap-4"><Link href={`/media-press/${item.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-burgundy">{cms.settings.mediaPageDetailLabel} <ArrowUpRight className="size-4" /></Link>{item.mediaUrl && <a href={item.mediaUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-charcoal px-4 py-2.5 text-sm font-semibold text-cream">{item.mediaCtaLabel || cms.settings.mediaPageOpenLinkFallback} <ArrowUpRight className="size-4" /></a>}</div></div></article>)}</div></section>;
        })}</div>}
      </section>
      <SiteFooter />
    </main>
  );
}

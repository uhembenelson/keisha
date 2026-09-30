import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Navbar } from "@/components/navbar";
import { PageHero } from "@/components/page-hero";
import { SiteFooter } from "@/components/site-footer";
import { getCmsContent } from "@/lib/cms";

export const dynamic = "force-dynamic";

function toParagraphs(value: string) {
  return value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function isExternal(href: string) {
  return /^(https?:)?\/\//i.test(href) || /^(mailto:|tel:)/i.test(href);
}

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getCmsContent();
  const description = (settings.aboutPageIntro || "").trim() || undefined;

  return {
    title: "About",
    description,
    alternates: { canonical: "/about" },
    openGraph: { title: `About | ${settings.siteName}`, description },
  };
}

export default async function AboutPage() {
  const { settings } = await getCmsContent();
  const paragraphs = toParagraphs(settings.aboutPageBody);

  if (!settings.aboutPageEnabled) {
    return (
      <main className="bg-cream text-charcoal">
        <Navbar />
        <section className="px-5 py-32 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-2xl">
            <h1 className="font-display text-5xl">About page is not published.</h1>
            <p className="mt-5 text-base leading-7 text-charcoal/70">
              Enable it in the admin area under Site settings to make this page visible.
            </p>
          </div>
        </section>
        <SiteFooter />
      </main>
    );
  }

  return (
    <main className="bg-cream text-charcoal">
      <Navbar />
      <PageHero eyebrow={settings.aboutPageEyebrow} title={settings.aboutPageTitle}>
        {settings.aboutPageIntro ? <p>{settings.aboutPageIntro}</p> : null}
      </PageHero>
      <section className="px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto grid max-w-[82rem] gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div className="relative min-h-[38rem] overflow-hidden bg-dusty-rose/25">
            <Image
              src={settings.aboutPageImage || settings.aboutImage || settings.heroImage || "/images/pic.jpeg"}
              alt={settings.aboutPageImageAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 42vw"
              className="object-cover"
            />
          </div>
          <div className="max-w-2xl lg:pt-8">
            <p className="section-kicker">{settings.aboutPageKicker}</p>
            <h2 className="mt-6 font-display text-4xl font-medium leading-tight sm:text-5xl">
              {settings.aboutPageHeading}
            </h2>
            <div className="mt-8 space-y-6 text-base leading-8 text-charcoal/75 sm:text-lg">
              {paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
            <div className="mt-9 flex flex-wrap gap-4">
              {settings.aboutPagePrimaryCtaLabel &&
                (isExternal(settings.aboutPagePrimaryCtaHref) ? (
                  <a
                    href={settings.aboutPagePrimaryCtaHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-burgundy px-6 py-3 text-sm font-semibold text-cream"
                  >
                    {settings.aboutPagePrimaryCtaLabel} <ArrowUpRight className="size-4" />
                  </a>
                ) : (
                  <Link
                    href={settings.aboutPagePrimaryCtaHref}
                    className="inline-flex items-center gap-2 bg-burgundy px-6 py-3 text-sm font-semibold text-cream"
                  >
                    {settings.aboutPagePrimaryCtaLabel} <ArrowUpRight className="size-4" />
                  </Link>
                ))}
              {settings.aboutPageSecondaryCtaLabel &&
                (isExternal(settings.aboutPageSecondaryCtaHref) ? (
                  <a
                    href={settings.aboutPageSecondaryCtaHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 border-b-2 border-burgundy px-1 py-3 text-sm font-semibold text-burgundy"
                  >
                    {settings.aboutPageSecondaryCtaLabel} <ArrowUpRight className="size-4" />
                  </a>
                ) : (
                  <Link
                    href={settings.aboutPageSecondaryCtaHref}
                    className="inline-flex items-center gap-2 border-b-2 border-burgundy px-1 py-3 text-sm font-semibold text-burgundy"
                  >
                    {settings.aboutPageSecondaryCtaLabel} <ArrowUpRight className="size-4" />
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

import type { Metadata } from "next";
import { Fragment, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpenText,
  Mail,
  Mic2,
  PenLine,
  Sparkles,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ContactForm } from "@/components/contact-form";
import { Navbar } from "@/components/navbar";
import { NewsletterForm } from "@/components/newsletter-form";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { SiteFooter } from "@/components/site-footer";
import { getCmsContent } from "@/lib/cms";
import { BookAction } from "@/components/book-action";
import type { CmsHomepageSectionId } from "@/lib/cms-types";

export const metadata: Metadata = {
  title: "Author & Creative Entrepreneur",
  description:
    "Keisha ‘WriteNow’ Allen is a Miami-based contemporary fiction author, singer, and speaker. Discover Worth the Weight and The Love Enthusiast.",
  alternates: { canonical: "/" },
};

const creativeRoles = [
  {
    number: "01",
    title: "Writer",
    copy: "Contemporary fiction with lighthearted humor and a message that lingers.",
    icon: PenLine,
  },
  {
    number: "02",
    title: "Author",
    copy: "Stories about love, purpose, self-discovery, and the courage to begin again.",
    icon: BookOpenText,
  },
  {
    number: "03",
    title: "Speaker",
    copy: "Honest conversations that encourage people to find and follow their purpose.",
    icon: Mic2,
  },
  {
    number: "04",
    title: "Publisher",
    copy: "Creating space for fresh voices and stories beyond the expected.",
    icon: Sparkles,
  },
];

export const dynamic = "force-dynamic";

export default async function Home() {
  const cms = await getCmsContent();
  const books = cms.books.filter((book) => book.published);
  const heroFeatureBook = cms.settings.heroPromotionType === "book"
    ? books.find((book) => book.id === cms.settings.heroFeatureBookId)
    : undefined;
  const heroNewsletterVisible = cms.settings.heroPromotionType === "newsletter";
  const heroPromotionVisible = Boolean(heroFeatureBook || heroNewsletterVisible);
  const homepageBlocks: Record<CmsHomepageSectionId, ReactNode> = {
    hero: (
      <section id="top" className="relative isolate min-h-[90svh] bg-charcoal text-cream">
        <div className="absolute inset-x-0 top-20 h-[60svh] w-full sm:top-24 md:inset-x-auto md:inset-y-0 md:right-0 md:h-auto lg:w-[65%] xl:w-[58%]">
          <div
            className="relative h-full w-full"
            style={{
              maskImage:
                "linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.4) 3%, rgba(0, 0, 0, 0.85) 8%, black 14%, black 100%)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.4) 3%, rgba(0, 0, 0, 0.85) 8%, black 14%, black 100%)",
            }}
          >
            <Image
              src={cms.settings.heroImage || "/images/pic.jpeg"}
              alt="Keisha ‘WriteNow’ Allen smiling"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover object-top"
            />
          </div>
          {/* Subtle gradient feather that blends the left background color into the photo's edge */}
          <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-32 bg-gradient-to-r from-charcoal via-charcoal/60 to-transparent md:block lg:w-40" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-b from-transparent via-charcoal/55 to-charcoal md:hidden" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(43,27,31,0.2)_0%,transparent_18%)] md:bg-[linear-gradient(90deg,#2b1b1f_0%,#2b1b1f_28%,rgba(43,27,31,0.85)_40%,rgba(43,27,31,0.25)_55%,transparent_68%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-transparent to-charcoal/25" />

        <div className="relative z-20 mx-auto flex min-h-[90svh] max-w-[90rem] flex-col justify-start px-5 pb-12 pt-[60svh] sm:px-8 md:justify-center md:py-20 lg:px-12 lg:py-14">
          <div className="max-w-3xl">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.25em] text-gold sm:text-sm">{cms.settings.heroEyebrow}</p>
            <h1 className="font-display text-[clamp(3.7rem,6.2vw,6.6rem)] font-medium leading-[0.88] tracking-[-0.035em] text-cream">
              {cms.settings.heroTitle}
              <span className="block italic text-gold">{cms.settings.heroAccent}</span>
            </h1>
          </div>

          <div className={`mt-12 grid items-end gap-8 sm:mt-14 ${heroPromotionVisible ? "lg:grid-cols-[minmax(0,31rem)_1fr] lg:gap-20" : "lg:grid-cols-1"}`}>
            {heroFeatureBook && <article className="grid min-h-[15.5rem] grid-cols-[0.78fr_1.22fr] bg-cream text-charcoal shadow-2xl shadow-black/25">
              <div className="relative m-3 mr-0 overflow-hidden bg-dusty-rose/25">
                <Image src={heroFeatureBook.cover} alt={`${heroFeatureBook.title} book cover`} fill unoptimized={heroFeatureBook.cover.startsWith("/api/uploads/")} sizes="220px" className="object-contain p-2 drop-shadow-lg" />
              </div>
              <div className="flex flex-col p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-burgundy">{cms.settings.heroFeatureEyebrow}</p>
                <h2 className="mt-2 font-display text-2xl font-semibold leading-[0.92] sm:text-3xl">{heroFeatureBook.title}</h2>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-charcoal/80">{heroFeatureBook.shortDescription}</p>
                <Link href={`/books/${heroFeatureBook.slug}`} className="mt-auto inline-flex w-fit items-center gap-2 bg-burgundy px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-charcoal">{cms.settings.heroFeatureCtaLabel} <ArrowUpRight className="size-4" /></Link>
              </div>
            </article>}
            {heroNewsletterVisible && <article className="grid min-h-[15.5rem] grid-cols-[0.68fr_1.32fr] bg-cream text-charcoal shadow-2xl shadow-black/25">
              <div className="m-3 mr-0 flex flex-col justify-between bg-burgundy p-5 text-cream">
                <Mail className="size-8 text-gold" />
                <p className="font-display text-2xl leading-tight">The WriteNow Letter</p>
              </div>
              <div className="flex flex-col p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-burgundy">Newsletter exclusive</p>
                <h2 className="mt-2 font-display text-2xl font-semibold leading-[0.94] sm:text-3xl">{cms.settings.heroNewsletterTitle}</h2>
                <p className="mt-3 line-clamp-3 text-sm leading-5 text-charcoal/75">{cms.settings.heroNewsletterCopy}</p>
                <div className="mt-4">
                  {cms.settings.newsletterExternalUrl ? <a href={cms.settings.newsletterExternalUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-burgundy px-4 py-2.5 text-xs font-semibold text-cream transition-colors hover:bg-charcoal">{cms.settings.heroNewsletterCtaLabel} <ArrowUpRight className="size-4" /></a> : <NewsletterForm variant="light" compact source="Homepage hero newsletter" submitLabel={cms.settings.heroNewsletterCtaLabel} />}
                </div>
              </div>
            </article>}

            <div className="max-w-xl justify-self-end border-t border-cream/35 pt-6 lg:mb-1">
              <p className="line-clamp-3 text-base font-normal leading-relaxed text-cream/95 sm:text-lg sm:leading-8">{cms.settings.heroBio}</p>
              <Link href="/about" className="mt-6 inline-flex items-center gap-2 bg-cream px-6 py-3.5 text-sm font-semibold text-charcoal transition-colors hover:bg-gold sm:text-base">Learn more <ArrowUpRight className="size-4" /></Link>
            </div>
          </div>
        </div>
      </section>
    ),
    about: (
      <section id="about" className="bg-cream px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-[82rem]">
          <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="section-kicker">01 / Meet the author</p>
              <p className="mt-8 max-w-md text-base leading-7 text-charcoal/80">{cms.settings.aboutIntro}</p>
              <a href="/about" className="mt-7 inline-flex items-center gap-2 border-b-2 border-burgundy pb-1 text-base font-semibold text-burgundy transition-colors hover:border-charcoal hover:text-charcoal">
                Read Keisha’s story <ArrowUpRight className="size-4" />
              </a>
            </div>
            <h2 className="whitespace-pre-line font-display text-[clamp(2.7rem,4vw,4.2rem)] font-medium leading-[1.02] tracking-[-0.025em] text-charcoal">
              {cms.settings.aboutHeading}
            </h2>
          </div>

          <div className="mt-20 grid gap-5 md:grid-cols-12 md:grid-rows-2">
            <div className="relative min-h-[30rem] overflow-hidden bg-dusty-rose md:col-span-5 md:row-span-2">
              <Image src={cms.settings.aboutImage || "/images/keisha-profile-c.png"} alt="Portrait of Keisha WriteNow Allen" fill sizes="(max-width: 768px) 100vw, 42vw" className="object-cover" />
            </div>
            <div className="flex min-h-60 flex-col justify-between bg-white p-7 md:col-span-4 lg:p-9">
              <span className="font-display text-6xl text-gold">{cms.settings.homepageStatOneValue}</span>
              <div><h3 className="font-display text-2xl text-charcoal">{cms.settings.homepageStatOneTitle}</h3><p className="mt-2 text-sm leading-6 text-charcoal/75 sm:text-base">{cms.settings.homepageStatOneDescription}</p></div>
            </div>
            <div className="flex min-h-60 flex-col justify-between bg-burgundy p-7 text-cream md:col-span-3 lg:p-9">
              <span className="font-display text-6xl text-gold">{cms.settings.homepageStatTwoValue}</span>
              <div><h3 className="font-display text-2xl">{cms.settings.homepageStatTwoTitle}</h3><p className="mt-2 text-sm leading-6 text-cream/85 sm:text-base">{cms.settings.homepageStatTwoDescription}</p></div>
            </div>
            <div className="relative min-h-72 overflow-hidden md:col-span-7">
              <Image src="/images/keisha-profile-d.png" alt="Keisha WriteNow Allen smiling" fill sizes="(max-width: 768px) 100vw, 58vw" className="object-cover object-[50%_28%]" />
              <div className="absolute inset-0 bg-gradient-to-r from-charcoal/60 via-transparent to-transparent" />
              <p className="absolute bottom-7 left-7 max-w-xs font-display text-3xl leading-tight text-cream sm:bottom-9 sm:left-9">A testament to the power of following your purpose.</p>
            </div>
          </div>
        </div>
      </section>
    ),
    books: (
      <section id="books" className="bg-[#fffaf1] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-[82rem]">
          <div className="flex flex-col justify-between gap-8 border-b border-charcoal/15 pb-9 md:flex-row md:items-end">
            <div>
              <p className="section-kicker">02 / Published work</p>
              <h2 className="mt-4 font-display text-5xl font-medium tracking-[-0.03em] text-charcoal sm:text-6xl lg:text-7xl">Stories worth lingering over.</h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-charcoal/60 md:text-right">Contemporary fiction filled with layered women, complicated love, and the brave work of choosing a life that fits.</p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            {books.map((book, index) => (
              <article key={book.id} className="group grid overflow-hidden border border-charcoal/12 bg-cream sm:grid-cols-[0.78fr_1.22fr]">
                <Link href={`/books/${book.slug}`} className="relative min-h-[27rem] overflow-hidden bg-dusty-rose/30 p-8 sm:min-h-[38rem]" aria-label={`View ${book.title}`}>
                  <Image src={book.cover} alt={`${book.title} book cover`} fill unoptimized={book.cover.startsWith("/api/uploads/")} sizes="(max-width: 640px) 100vw, 32vw" className="object-contain p-8 drop-shadow-[0_22px_18px_rgba(43,27,31,0.18)] transition-transform duration-500 group-hover:scale-[1.025]" />
                </Link>
                <div className="flex flex-col p-7 sm:p-8 lg:p-10">
                  <div className="flex items-start justify-between gap-5"><span className="font-display text-4xl text-gold">{String(index + 1).padStart(2, "0")}</span><span className="text-sm font-semibold uppercase tracking-[0.14em] text-burgundy">{book.availability === "free" ? "Free" : book.price}</span></div>
                  <div className="mt-auto pt-16 sm:pt-10">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-burgundy">{book.category}</p>
                    <h3 className="mt-3 font-display text-4xl font-medium leading-none tracking-[-0.02em] text-charcoal lg:text-5xl">{book.title}</h3>
                    <p className="mt-5 text-base leading-7 text-charcoal/80">{book.shortDescription}</p>
                    <div className="mt-8 flex flex-wrap items-center gap-4"><BookAction book={book} /><Link href={`/books/${book.slug}`} className="inline-flex items-center gap-2 border-b-2 border-charcoal/40 pb-1 text-base font-semibold text-charcoal transition-colors hover:border-burgundy hover:text-burgundy">Discover the book <ArrowUpRight className="size-4" /></Link></div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    ),
    creative: (
      <section className="bg-charcoal px-5 py-24 text-cream sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-[82rem]">
          <div className="grid gap-12 lg:grid-cols-[0.74fr_1.26fr]">
            <div>
              <p className="section-kicker section-kicker-dark">03 / The creative world</p>
              <h2 className="mt-5 max-w-lg font-display text-5xl font-medium leading-[1.03] tracking-[-0.03em] sm:text-6xl">More than one way to tell a story.</h2>
              <p className="mt-6 max-w-md text-sm leading-7 text-cream/60">Keisha’s work lives at the intersection of imagination, encouragement, and creative entrepreneurship.</p>
            </div>
            <div className="grid border border-cream/10 sm:grid-cols-2">
              {creativeRoles.map((role) => {
                const Icon = role.icon;
                return (
                  <article key={role.title} className="relative min-h-64 border-b border-cream/10 p-7 last:border-b-0 sm:border-r sm:p-9 sm:nth-[3]:border-b-0 sm:nth-[4]:border-b-0 sm:nth-[2n]:border-r-0">
                    <span className="absolute right-6 top-4 font-display text-6xl text-cream/8">{role.number}</span>
                    <Icon className="size-5 text-gold" />
                    <h3 className="mt-14 font-display text-3xl text-cream">{role.title}</h3>
                    <p className="mt-3 max-w-xs text-sm leading-6 text-cream/55">{role.copy}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    ),
    "featured-book": (
      <section className="bg-cream">
        <div className="grid lg:grid-cols-2">
          <div className="relative min-h-[35rem] bg-dusty-rose/25 lg:min-h-[44rem]">
            <Image src="/images/the-love-enthusiast-mockup.png" alt="The Love Enthusiast hardcover books" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-contain p-8 sm:p-14" />
          </div>
          <div className="flex items-center bg-burgundy px-7 py-20 text-cream sm:px-12 lg:px-16 xl:px-24">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Now available</p>
              <h2 className="mt-5 font-display text-5xl font-medium leading-[0.96] tracking-[-0.03em] sm:text-6xl xl:text-7xl">Love has a melody all its own.</h2>
              <p className="mt-7 text-base leading-8 text-cream/90 sm:text-lg">The Love Enthusiast is a poignant story of resilience and the indomitable spirit of a woman determined to love, despite the odds stacked against her.</p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/books/the-love-enthusiast" className={cn(buttonVariants({ size: "lg" }), "rounded-full bg-gold px-6 text-charcoal hover:bg-gold/90 text-sm font-semibold")}>Explore the book <ArrowUpRight data-icon="inline-end" /></Link>
                <Link href="/books" className="inline-flex h-10 items-center border-b border-cream/45 text-sm font-semibold text-cream transition-colors hover:border-gold hover:text-gold">View all books</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    ),
    connect: (
      <section id="connect" className="bg-[#fffaf1] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-[82rem]">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:items-end">
            <div><p className="section-kicker">04 / Connect</p><h2 className="mt-5 font-display text-5xl font-medium leading-[0.98] tracking-[-0.03em] text-charcoal sm:text-6xl lg:text-7xl">Let’s keep the conversation going.</h2></div>
            <p className="max-w-lg text-base leading-8 text-charcoal/75 sm:text-lg">Whether you are a reader, interviewer, book club host, or fellow creative, Keisha would love to hear what resonated with you.</p>
          </div>

          <div className="mt-14 grid gap-px overflow-hidden border border-charcoal/12 bg-charcoal/12 md:grid-cols-3">
            <Link href="/media-press" className="group bg-cream p-7 transition-colors hover:bg-dusty-rose/18 sm:p-9">
              <div className="flex items-start justify-between"><Mic2 className="size-5 text-burgundy" /><ArrowUpRight className="size-5 text-charcoal/35 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" /></div>
              <h3 className="mt-16 font-display text-3xl text-charcoal">Media & Press</h3><p className="mt-3 text-sm leading-6 text-charcoal/75">Interviews, features, speaking, and creative conversations.</p>
            </Link>
            <Link href="/events" className="group bg-cream p-7 transition-colors hover:bg-dusty-rose/18 sm:p-9">
              <div className="flex items-start justify-between"><BookOpenText className="size-5 text-burgundy" /><ArrowUpRight className="size-5 text-charcoal/35 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" /></div>
              <h3 className="mt-16 font-display text-3xl text-charcoal">Events</h3><p className="mt-3 text-sm leading-6 text-charcoal/75">Author appearances, readings, and moments to gather.</p>
            </Link>
            <a href="/contact" className="group bg-charcoal p-7 text-cream transition-colors hover:bg-burgundy sm:p-9">
              <div className="flex items-start justify-between"><Mail className="size-5 text-gold" /><ArrowUpRight className="size-5 text-cream/45 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" /></div>
              <h3 className="mt-16 font-display text-3xl">Send a note</h3><p className="mt-3 text-sm leading-6 text-cream/75">For thoughtful messages, media inquiries, and collaborations.</p>
            </a>
          </div>

          <div className="mt-16 grid gap-10 border-t border-charcoal/15 pt-14 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
            <div>
              <p className="section-kicker">Contact Keisha</p>
              <h3 className="mt-5 font-display text-4xl font-medium leading-tight text-charcoal sm:text-5xl">Have a media inquiry, event invitation, or thoughtful note?</h3>
              <p className="mt-5 max-w-md text-base leading-7 text-charcoal/70">Use the form and share a few details. For a larger message area and contact information, visit the dedicated contact page.</p>
              <a href="/contact" className="mt-6 inline-flex items-center gap-2 border-b-2 border-burgundy pb-1 text-sm font-semibold text-burgundy">Open contact page <ArrowUpRight className="size-4" /></a>
            </div>
            <ContactForm />
          </div>
        </div>
      </section>
    ),
    newsletter: (
      <section className="bg-burgundy px-5 py-20 text-cream sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-[82rem] gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">The WriteNow Letter</p>
            <h2 className="mt-4 font-display text-4xl font-medium leading-tight sm:text-5xl">{cms.settings.newsletterTitle}</h2>
          </div>
          <div>
            <p className="mb-5 max-w-xl text-sm leading-7 text-cream/75">{cms.settings.newsletterCopy}</p>
            <NewsletterSignup externalUrl={cms.settings.newsletterExternalUrl} externalLabel={cms.settings.newsletterExternalLabel} />
          </div>
        </div>
      </section>
    ),
  };

  return (
    <main className="overflow-x-clip bg-background text-foreground">
      <Navbar />
      {cms.settings.homepageSections
        .filter((section) => section.enabled)
        .map((section) => <Fragment key={section.id}>{homepageBlocks[section.id]}</Fragment>)}
      <SiteFooter />
    </main>
  );
}

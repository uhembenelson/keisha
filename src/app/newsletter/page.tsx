import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpenText,
  CalendarDays,
  Check,
  LockKeyhole,
  Mail,
  PenLine,
  Plus,
} from "lucide-react";

import { NewsletterForm } from "@/components/newsletter-form";
import { Navbar } from "@/components/navbar";
import { SiteFooter } from "@/components/site-footer";
import { getCmsContent } from "@/lib/cms";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getCmsContent();
  const description =
    settings.newsletterCopy ||
    "Join The WriteNow Letter for new releases, writing notes, appearances, and occasional surprises from Keisha ‘WriteNow’ Allen.";

  return {
    title: "Newsletter",
    description,
    alternates: { canonical: "/newsletter" },
    openGraph: {
      title: "The WriteNow Letter",
      description,
      url: "/newsletter",
      type: "website",
    },
  };
}

const letterBenefits = [
  {
    icon: BookOpenText,
    title: "First look at new releases",
    copy: "Cover reveals, release dates, and early pages before the rest of the world catches on.",
  },
  {
    icon: PenLine,
    title: "Notes from the writing desk",
    copy: "The honest, unpolished moments behind the stories — what is being drafted, revised, and discovered.",
  },
  {
    icon: CalendarDays,
    title: "Invitations & appearances",
    copy: "Readings, events, book-club conversations, and the occasional reader surprise.",
  },
];

const faqs = [
  {
    question: "How often will the letter arrive?",
    answer:
      "The WriteNow Letter is occasional by design. Keisha sends it when there is real news worth sharing — a new release, an appearance, or a story from behind the scenes — not on a rigid schedule.",
  },
  {
    question: "What will I receive?",
    answer:
      "Early word on new books, cover reveals, notes from the writing desk, event invitations, and the occasional surprise for readers of Keisha’s work.",
  },
  {
    question: "Will my email be shared?",
    answer:
      "Never. Your address is used only to send the newsletter. It is never sold, rented, or shared with anyone else.",
  },
  {
    question: "How do I unsubscribe?",
    answer:
      "Every letter includes a one-click unsubscribe link. You can also reply to any email and ask to be removed — no questions asked.",
  },
];

export default async function NewsletterPage() {
  const { settings } = await getCmsContent();
  const externalUrl = settings.newsletterExternalUrl;

  return (
    <main className="bg-[#fffaf1] text-charcoal">
      <Navbar />

      <section className="relative isolate overflow-hidden bg-charcoal px-5 pb-20 pt-36 text-cream sm:px-8 sm:pt-40 lg:px-12 lg:pb-24">
        <div aria-hidden="true" className="pointer-events-none absolute -right-40 top-4 size-[34rem] rounded-full border border-gold/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-64 left-1/4 size-[30rem] rounded-full bg-burgundy/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-[82rem] gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">The WriteNow Letter</p>
            <h1 className="mt-5 font-display text-[clamp(3.2rem,5.8vw,5.8rem)] font-medium leading-[0.92] tracking-[-0.035em] text-cream">
              {settings.newsletterTitle}
            </h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-cream/75 sm:text-lg">{settings.newsletterCopy}</p>
            <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-xs font-semibold uppercase tracking-[0.14em] text-cream/55">
              <span className="inline-flex items-center gap-2"><Mail className="size-4 text-gold" /> Occasional letters</span>
              <span className="inline-flex items-center gap-2"><LockKeyhole className="size-4 text-gold" /> No spam</span>
              <span className="inline-flex items-center gap-2"><Check className="size-4 text-gold" /> Free to join</span>
            </div>
          </div>

          <div id="newsletter-signup" className="scroll-mt-28 bg-cream p-7 text-charcoal shadow-2xl shadow-black/25 sm:p-9 lg:p-10">
            <p className="section-kicker">Join the reading circle</p>
            <h2 className="mt-5 font-display text-4xl font-medium leading-[1.02] tracking-[-0.02em] sm:text-[2.75rem]">Your next chapter, delivered.</h2>
            <p className="mt-4 text-sm leading-7 text-charcoal/65 sm:text-base">Add your email and the next WriteNow Letter will find its way to you.</p>
            <div className="mt-7">
              <NewsletterForm
                variant="light"
                source="Newsletter page"
                submitLabel="Join the newsletter"
                successTitle="You’re on the list."
                successCopy="Welcome to the reading circle. Keep an eye on your inbox for the next WriteNow Letter."
              />
            </div>
            <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-charcoal/50"><LockKeyhole className="mt-0.5 size-3.5 shrink-0 text-burgundy/70" /> Your email stays private. No spam, ever — unsubscribe in one click whenever you like.</p>
            {externalUrl && <a href={externalUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-burgundy underline decoration-burgundy/30 underline-offset-4 transition-colors hover:text-charcoal">Prefer another platform? {settings.newsletterExternalLabel || "Join there"} <ArrowUpRight className="size-3.5" /></a>}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto grid max-w-[82rem] gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div className="relative min-h-[34rem] overflow-hidden bg-dusty-rose/25 sm:min-h-[40rem]">
            <Image src="/images/keisha-portrait.jpg" alt="Keisha ‘WriteNow’ Allen" fill sizes="(max-width: 1024px) 100vw, 38vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/20 to-transparent" />
            <blockquote className="absolute inset-x-0 bottom-0 p-7 text-cream sm:p-9">
              <p className="font-display text-3xl leading-tight sm:text-4xl">“The stories behind the stories — that’s what I love sharing with you.”</p>
              <footer className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-gold">Keisha ‘WriteNow’ Allen</footer>
            </blockquote>
          </div>

          <div className="lg:pt-8">
            <p className="section-kicker">Inside the letter</p>
            <h2 className="mt-5 font-display text-5xl font-medium leading-[0.98] tracking-[-0.03em] sm:text-6xl">A little more of the story.</h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-charcoal/70">This is not a crowded inbox. It is a place for the moments that do not fit on a book page — the ideas taking shape, the invitations worth clearing your calendar for, and the news Keisha wants you to hear first.</p>

            <div className="mt-10 border-t border-charcoal/15">
              {letterBenefits.map((benefit) => (
                <article key={benefit.title} className="grid gap-4 border-b border-charcoal/15 py-7 sm:grid-cols-[2.75rem_1fr] sm:gap-6">
                  <span className="grid size-11 place-items-center rounded-full bg-burgundy/8 text-burgundy"><benefit.icon className="size-5" /></span>
                  <div>
                    <h3 className="font-display text-2xl text-charcoal sm:text-3xl">{benefit.title}</h3>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-charcoal/65 sm:text-base sm:leading-7">{benefit.copy}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-cream px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto grid max-w-[82rem] gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div>
            <p className="section-kicker">Good to know</p>
            <h2 className="mt-5 font-display text-5xl font-medium leading-[0.98] tracking-[-0.03em] sm:text-6xl">A few things before you join.</h2>
            <p className="mt-5 max-w-md text-base leading-7 text-charcoal/70">Still have a question that is not answered here? Keisha would be glad to hear from you.</p>
            <Link href="/contact" className="mt-6 inline-flex items-center gap-2 border-b-2 border-burgundy pb-1 text-sm font-semibold text-burgundy transition-colors hover:border-charcoal hover:text-charcoal">Send a note <ArrowUpRight className="size-4" /></Link>
          </div>

          <div>
            {faqs.map((faq) => (
              <details key={faq.question} className="group border-b border-charcoal/15 py-6 first:border-t first:pt-6">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 font-display text-2xl leading-tight text-charcoal marker:hidden [&::-webkit-details-marker]:hidden sm:text-3xl">
                  {faq.question}
                  <Plus className="mt-0.5 size-5 shrink-0 text-burgundy transition-transform duration-200 group-open:rotate-45" />
                </summary>
                <p className="mt-3 max-w-2xl text-base leading-7 text-charcoal/70">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-burgundy px-5 py-16 text-cream sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[82rem] flex-col items-start justify-between gap-7 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">One more thing</p>
            <h2 className="mt-3 font-display text-4xl font-medium leading-tight sm:text-5xl">The next letter is already taking shape.</h2>
          </div>
          <a href="#newsletter-signup" className="inline-flex shrink-0 items-center gap-2 bg-gold px-6 py-3.5 text-sm font-semibold text-charcoal transition-colors hover:bg-cream">Join the reading circle <ArrowUpRight className="size-4" /></a>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

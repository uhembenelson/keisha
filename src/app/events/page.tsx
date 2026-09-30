import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, Mic2, Users } from "lucide-react";

import { Navbar } from "@/components/navbar";
import { PageHero } from "@/components/page-hero";
import { SiteFooter } from "@/components/site-footer";
import { getCmsContent } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Find book signings, readings, and appearances by Keisha ‘WriteNow’ Allen.",
  alternates: { canonical: "/events" },
};

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const cms = await getCmsContent();
  const events = cms.events.filter((event) => event.published);
  return (
    <main className="bg-cream text-charcoal">
      <Navbar />
      <PageHero eyebrow="Events" title="Meet Keisha beyond the page.">Author appearances, readings, conversations, and gatherings centered on books, creativity, and purpose.</PageHero>
      <section className="px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-[82rem]">
          <div className="grid gap-px border border-charcoal/12 bg-charcoal/12 md:grid-cols-3">
            <article className="bg-[#fffaf1] p-8 sm:p-10"><CalendarDays className="size-5 text-burgundy" /><h2 className="mt-14 font-display text-3xl">Author appearances</h2><p className="mt-3 text-base leading-7 text-charcoal/70">Readings, signings, festivals, and bookstore conversations.</p></article>
            <article className="bg-[#fffaf1] p-8 sm:p-10"><Users className="size-5 text-burgundy" /><h2 className="mt-14 font-display text-3xl">Book clubs</h2><p className="mt-3 text-base leading-7 text-charcoal/70">Thoughtful conversations with readers about love, purpose, and self-discovery.</p></article>
            <article className="bg-[#fffaf1] p-8 sm:p-10"><Mic2 className="size-5 text-burgundy" /><h2 className="mt-14 font-display text-3xl">Speaking</h2><p className="mt-3 text-base leading-7 text-charcoal/70">Purpose-led talks for creative communities, readers, and aspiring authors.</p></article>
          </div>
          {events.length > 0 && <div className="mt-16 grid gap-5 md:grid-cols-2">
            {events.map((event) => <article key={event.id} className="overflow-hidden border-l-4 border-gold bg-charcoal text-cream">{event.image && <Link href={`/events/${event.id}`} className="relative block aspect-[16/9]"><Image src={event.image} alt="" fill unoptimized={event.image.startsWith("/api/uploads/")} sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" /></Link>}<div className="p-8 sm:p-10"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">{event.date ? new Date(event.date).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" }) : "Date to be announced"}</p><h2 className="mt-4 font-display text-4xl">{event.title}</h2><p className="mt-2 text-sm font-semibold text-cream/70">{event.location}</p><p className="mt-5 line-clamp-3 text-base leading-7 text-cream/75">{event.description}</p><Link href={`/events/${event.id}`} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-gold">View event <ArrowUpRight className="size-4" /></Link></div></article>)}
          </div>}
          {events.length === 0 && <div className="mt-16 border-l-4 border-gold bg-charcoal p-8 text-cream sm:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Upcoming dates</p>
            <h2 className="mt-4 font-display text-4xl">New appearances will be announced soon.</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-cream/70">Planning an event, interview, reading, or book-club conversation? Send the details through the contact page.</p>
            <Link href="/contact" className="mt-7 inline-flex items-center gap-2 bg-gold px-6 py-3 text-sm font-semibold text-charcoal">Invite Keisha <ArrowUpRight className="size-4" /></Link>
          </div>}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

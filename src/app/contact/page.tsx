import type { Metadata } from "next";
import { Mail, Mic2, Users } from "lucide-react";

import { ContactForm } from "@/components/contact-form";
import { Navbar } from "@/components/navbar";
import { PageHero } from "@/components/page-hero";
import { SiteFooter } from "@/components/site-footer";
import { getCmsContent } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Keisha ‘WriteNow’ Allen about bookings, interviews, speaking engagements, or your story.",
  alternates: { canonical: "/contact" },
};

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const cms = await getCmsContent();
  return (
    <main className="bg-[#fffaf1] text-charcoal">
      <Navbar />
      <PageHero eyebrow="Contact" title="Let’s start a thoughtful conversation.">For media inquiries, events, book-club conversations, collaborations, and reader messages.</PageHero>
      <section className="px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto grid max-w-[82rem] gap-12 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <p className="section-kicker">Get in touch</p>
            <h2 className="mt-5 font-display text-4xl leading-tight sm:text-5xl">Share what you have in mind.</h2>
            <p className="mt-5 max-w-md text-base leading-8 text-charcoal/70">Include dates, format, audience, and any helpful context for event or media requests.</p>
            <p className="mt-4 text-sm font-semibold text-burgundy">{cms.settings.contactEmail}</p>
            <div className="mt-9 grid gap-4">
              <div className="flex gap-4 border-t border-charcoal/15 pt-5"><Mail className="mt-1 size-5 text-burgundy" /><div><p className="font-semibold">Reader messages</p><p className="mt-1 text-sm text-charcoal/65">Share a note about the books or Keisha’s work.</p></div></div>
              <div className="flex gap-4 border-t border-charcoal/15 pt-5"><Mic2 className="mt-1 size-5 text-burgundy" /><div><p className="font-semibold">Media inquiries</p><p className="mt-1 text-sm text-charcoal/65">Interviews, features, podcasts, and speaking.</p></div></div>
              <div className="flex gap-4 border-t border-charcoal/15 pt-5"><Users className="mt-1 size-5 text-burgundy" /><div><p className="font-semibold">Events & book clubs</p><p className="mt-1 text-sm text-charcoal/65">Invitations, readings, and group conversations.</p></div></div>
            </div>
          </div>
          <ContactForm />
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

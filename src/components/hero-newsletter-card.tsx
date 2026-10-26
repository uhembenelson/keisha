"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Mail, X } from "lucide-react";

import { NewsletterForm } from "@/components/newsletter-form";

type HeroNewsletterCardProps = {
  title: string;
  copy: string;
  ctaLabel: string;
  externalUrl: string;
};

function NewsletterCard({ title, copy, ctaLabel, externalUrl }: HeroNewsletterCardProps) {
  return (
    <article className="grid overflow-hidden bg-[#fffaf1] text-charcoal shadow-2xl shadow-black/25 md:min-h-[15rem] md:grid-cols-[0.72fr_1.28fr]">
      <div className="flex items-center gap-4 bg-burgundy px-5 py-4 text-cream md:m-3 md:mr-0 md:flex-col md:items-start md:justify-between md:p-5">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-gold text-charcoal"><Mail className="size-5" /></span>
        <div><p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-gold">Exclusive updates</p><p className="mt-1 font-display text-2xl leading-none">The WriteNow Letter</p></div>
      </div>
      <div className="flex flex-col p-4 sm:p-5 md:p-6">
        <h2 className="font-display text-[2rem] font-semibold leading-[0.95] tracking-[-0.025em] text-charcoal">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-charcoal/70">{copy}</p>
        <div className="mt-4 md:mt-auto md:pt-4">
          <NewsletterForm variant="light" compact source="Homepage hero newsletter" submitLabel={ctaLabel} />
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link href="/newsletter" className="inline-flex items-center gap-1.5 text-[0.65rem] font-semibold text-burgundy underline decoration-burgundy/30 underline-offset-2">What’s inside the letter? <ArrowUpRight className="size-3" /></Link>
            {externalUrl && <a href={externalUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[0.65rem] font-semibold text-burgundy underline decoration-burgundy/30 underline-offset-2">Use external signup page <ArrowUpRight className="size-3" /></a>}
          </div>
        </div>
      </div>
    </article>
  );
}

export function HeroNewsletterCard(props: HeroNewsletterCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const modalCardRef = useRef<HTMLDivElement>(null);
  const inlinePositionRef = useRef<DOMRect | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupClosing, setPopupClosing] = useState(false);
  const [popupEntering, setPopupEntering] = useState(false);
  const [closeVector, setCloseVector] = useState({ x: 0, y: 0, scale: 0.8 });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      inlinePositionRef.current = cardRef.current?.getBoundingClientRect() ?? null;
      setPopupOpen(true);
      window.requestAnimationFrame(() => setPopupEntering(true));
    }, 140);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!popupOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [popupOpen]);

  function closePopup() {
    if (popupClosing) return;
    const target = inlinePositionRef.current;
    const modal = modalCardRef.current?.getBoundingClientRect();
    if (target && modal) {
      setCloseVector({
        x: target.left + target.width / 2 - (modal.left + modal.width / 2),
        y: target.top + target.height / 2 - (modal.top + modal.height / 2),
        scale: Math.min(target.width / modal.width, target.height / modal.height, 1),
      });
    }
    setPopupClosing(true);
    window.setTimeout(() => setPopupOpen(false), 500);
  }

  return (
    <>
      <div className={popupOpen ? "hidden" : "contents"}><div ref={cardRef}><NewsletterCard {...props} /></div></div>
      {popupOpen && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-cream/70 px-5 py-10 backdrop-blur-[2px] sm:px-8" role="dialog" aria-modal="true" aria-label="Join the newsletter">
        <div
          ref={modalCardRef}
          className={`relative w-[min(92vw,38rem)] transition-[transform,opacity] duration-500 ease-out ${popupClosing ? "opacity-0" : popupEntering ? "opacity-100" : "scale-95 opacity-0"}`}
          style={popupClosing ? { transform: `translate(${closeVector.x}px, ${closeVector.y}px) scale(${closeVector.scale})` } : undefined}
        >
          <button type="button" onClick={closePopup} className="absolute -right-3 -top-3 z-10 grid size-10 place-items-center rounded-full bg-cream text-charcoal shadow-xl ring-1 ring-charcoal/10 transition hover:bg-burgundy hover:text-cream" aria-label="Close newsletter popup"><X className="size-5" /></button>
          <NewsletterCard {...props} />
        </div>
      </div>}
    </>
  );
}

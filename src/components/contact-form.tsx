"use client";

import { FormEvent, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Check, LoaderCircle } from "lucide-react";

export function ContactForm({ compact = false, defaultSubject = "", defaultMessage = "" }: { compact?: boolean; defaultSubject?: string; defaultMessage?: string }) {
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const pathname = usePathname();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          subject: formData.get("subject"),
          message: formData.get("message"),
          website: formData.get("website"),
          source: pathname === "/contact" ? "Contact page" : "Homepage contact section",
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Your message could not be sent.");
      form.reset();
      setSent(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Your message could not be sent.");
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div className="grid min-h-72 place-items-center border border-charcoal/12 bg-cream p-8 text-center">
        <div>
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-burgundy text-cream"><Check className="size-5" /></span>
          <h3 className="mt-5 font-display text-3xl text-charcoal">Thank you for reaching out.</h3>
          <p className="mt-2 text-sm leading-6 text-charcoal/70">Your message has been received. Keisha’s team will follow up as soon as possible.</p>
          <button type="button" onClick={() => setSent(false)} className="mt-5 text-sm font-semibold text-burgundy underline underline-offset-4">Send another message</button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`grid gap-5 ${compact ? "" : "sm:grid-cols-2"}`}>
      <label className="absolute -left-[9999px]" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-charcoal/70">
        Name
        <input name="name" required autoComplete="name" className="h-12 border border-charcoal/15 bg-cream px-4 text-base font-normal normal-case tracking-normal text-charcoal outline-none transition focus:border-burgundy" />
      </label>
      <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-charcoal/70">
        Email
        <input name="email" required type="email" autoComplete="email" className="h-12 border border-charcoal/15 bg-cream px-4 text-base font-normal normal-case tracking-normal text-charcoal outline-none transition focus:border-burgundy" />
      </label>
      <label className={`grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-charcoal/70 ${compact ? "" : "sm:col-span-2"}`}>
        Subject
        <input name="subject" required defaultValue={defaultSubject} className="h-12 border border-charcoal/15 bg-cream px-4 text-base font-normal normal-case tracking-normal text-charcoal outline-none transition focus:border-burgundy" />
      </label>
      <label className={`grid gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-charcoal/70 ${compact ? "" : "sm:col-span-2"}`}>
        Message
        <textarea name="message" required defaultValue={defaultMessage} rows={compact ? 4 : 6} className="resize-none border border-charcoal/15 bg-cream p-4 text-base font-normal normal-case tracking-normal text-charcoal outline-none transition focus:border-burgundy" />
      </label>
      {error && <p role="alert" className={`text-sm font-semibold text-red-700 ${compact ? "" : "sm:col-span-2"}`}>{error}</p>}
      <button type="submit" disabled={pending} className={`inline-flex h-12 items-center justify-center gap-2 bg-burgundy px-6 text-sm font-semibold text-cream transition-colors hover:bg-charcoal disabled:opacity-60 ${compact ? "" : "sm:col-span-2 sm:w-fit"}`}>
        {pending ? <><LoaderCircle className="size-4 animate-spin" /> Sending…</> : <>Send message <ArrowUpRight className="size-4" /></>}
      </button>
    </form>
  );
}

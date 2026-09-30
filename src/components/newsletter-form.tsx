"use client";

import { FormEvent, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Check, LoaderCircle } from "lucide-react";

export function NewsletterForm() {
  const [subscribed, setSubscribed] = useState(false);
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
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: formData.get("email"), website: formData.get("website"), source: pathname === "/news" ? "News page" : "Homepage" }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "We could not add you to the list.");
      form.reset();
      setSubscribed(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "We could not add you to the list.");
    } finally {
      setPending(false);
    }
  }

  if (subscribed) {
    return <p className="flex items-center gap-2 text-sm font-semibold text-cream"><Check className="size-4 text-gold" /> You’re on the list. Welcome to Keisha’s reading circle.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col flex-wrap gap-3 sm:flex-row">
      <label className="absolute -left-[9999px]" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <label className="sr-only" htmlFor="newsletter-email">Email address</label>
      <input id="newsletter-email" name="email" type="email" required autoComplete="email" placeholder="Your email address" className="h-12 min-w-0 flex-1 border border-cream/25 bg-cream/8 px-4 text-base text-cream outline-none placeholder:text-cream/50 focus:border-gold" />
      <button type="submit" disabled={pending} className="inline-flex h-12 items-center justify-center gap-2 bg-gold px-6 text-sm font-semibold text-charcoal transition-colors hover:bg-cream disabled:opacity-60">
        {pending ? <><LoaderCircle className="size-4 animate-spin" /> Joining…</> : <>Join the list <ArrowUpRight className="size-4" /></>}
      </button>
      {error && <p role="alert" className="w-full text-sm font-semibold text-gold">{error}</p>}
    </form>
  );
}

"use client";

import { FormEvent, useId, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Check, LoaderCircle } from "lucide-react";

export function NewsletterForm({
  variant = "dark",
  compact = false,
  source,
  submitLabel = "Join the list",
}: {
  variant?: "dark" | "light";
  compact?: boolean;
  source?: string;
  submitLabel?: string;
} = {}) {
  const [subscribed, setSubscribed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const pathname = usePathname();
  const emailId = useId();

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
        body: JSON.stringify({ email: formData.get("email"), website: formData.get("website"), source: source || (pathname === "/news" ? "News page" : "Homepage") }),
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
    return <p className={`flex items-center gap-2 text-sm font-semibold ${variant === "light" ? "text-charcoal" : "text-cream"}`}><Check className="size-4 text-gold" /> You’re on the list. Welcome to Keisha’s reading circle.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className={`flex max-w-xl flex-col flex-wrap gap-3 ${compact ? "" : "sm:flex-row"}`}>
      <label className="absolute -left-[9999px]" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <label className="sr-only" htmlFor={emailId}>Email address</label>
      <input id={emailId} name="email" type="email" required autoComplete="email" placeholder="Your email address" className={`min-w-0 flex-1 border px-4 outline-none ${compact ? "h-10 text-sm" : "h-12 text-base"} ${variant === "light" ? "border-charcoal/20 bg-white text-charcoal placeholder:text-charcoal/40 focus:border-burgundy" : "border-cream/25 bg-cream/8 text-cream placeholder:text-cream/50 focus:border-gold"}`} />
      <button type="submit" disabled={pending} className={`inline-flex items-center justify-center gap-2 bg-gold font-semibold text-charcoal transition-colors disabled:opacity-60 ${compact ? "h-10 px-4 text-xs" : "h-12 px-6 text-sm"} ${variant === "light" ? "hover:bg-charcoal hover:text-cream" : "hover:bg-cream"}`}>
        {pending ? <><LoaderCircle className="size-4 animate-spin" /> Joining…</> : <>{submitLabel} <ArrowUpRight className="size-4" /></>}
      </button>
      {error && <p role="alert" className={`w-full text-sm font-semibold ${variant === "light" ? "text-burgundy" : "text-gold"}`}>{error}</p>}
    </form>
  );
}

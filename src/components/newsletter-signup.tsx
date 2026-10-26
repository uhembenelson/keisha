import { ArrowUpRight } from "lucide-react";

import { NewsletterForm } from "@/components/newsletter-form";

export function NewsletterSignup({ externalUrl, externalLabel }: { externalUrl: string; externalLabel: string }) {
  return <div><NewsletterForm />{externalUrl && <a href={externalUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-gold underline decoration-gold/40 underline-offset-4 transition hover:text-cream">Prefer the external mailing platform? {externalLabel || "Open signup page"} <ArrowUpRight className="size-3.5" /></a>}</div>;
}

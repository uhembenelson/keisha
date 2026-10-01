import { ArrowUpRight } from "lucide-react";

import { NewsletterForm } from "@/components/newsletter-form";

export function NewsletterSignup({ externalUrl, externalLabel }: { externalUrl: string; externalLabel: string }) {
  if (externalUrl) {
    return (
      <a
        href={externalUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 bg-gold px-6 py-3.5 text-sm font-semibold text-charcoal transition-colors hover:bg-cream"
      >
        {externalLabel || "Join the newsletter"} <ArrowUpRight className="size-4" />
      </a>
    );
  }

  return <NewsletterForm />;
}

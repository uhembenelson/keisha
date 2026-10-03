import Image from "next/image";
import type { ReactNode } from "react";

export function PageHero({ eyebrow, title, children, image, imageAlt = "" }: { eyebrow: string; title: string; children?: ReactNode; image?: string; imageAlt?: string }) {
  return (
    <section className="relative isolate overflow-hidden bg-charcoal px-5 pb-20 pt-36 text-cream sm:px-8 sm:pt-40 lg:px-12 lg:pb-24">
      {image && <><Image src={image} alt={imageAlt} fill unoptimized={image.startsWith("/api/uploads/")} sizes="100vw" className="object-cover opacity-40" /><div className="absolute inset-0 bg-gradient-to-r from-charcoal via-charcoal/85 to-charcoal/55" /></>}
      <div className="relative z-10 mx-auto max-w-[82rem]">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">{eyebrow}</p>
        <h1 className="mt-5 max-w-5xl font-display text-[clamp(3.6rem,7vw,7rem)] font-medium leading-[0.9] tracking-[-0.035em]">{title}</h1>
        {children ? <div className="mt-7 max-w-2xl text-base leading-8 text-cream/75 sm:text-lg">{children}</div> : null}
      </div>
    </section>
  );
}

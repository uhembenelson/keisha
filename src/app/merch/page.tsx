import type { Metadata } from "next";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";

import { AddToCartButton } from "@/components/add-to-cart-button";
import { Navbar } from "@/components/navbar";
import { SiteFooter } from "@/components/site-footer";
import { getCmsContent } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Merch",
  description: "Book-inspired merchandise and branded pieces from Kreative Kreations Publishing.",
  alternates: { canonical: "/merch" },
};

export const dynamic = "force-dynamic";

export default async function MerchPage() {
  const cms = await getCmsContent();
  const products = cms.merch.filter((product) => product.published);
  const { settings } = cms;

  return (
    <main className="min-h-screen bg-[#fffaf1] text-charcoal">
      <Navbar />
      <section className="border-b border-charcoal/10 bg-burgundy px-5 pb-20 pt-36 text-cream sm:px-8 sm:pb-24 lg:px-12 lg:pb-28">
        <div className="mx-auto max-w-[82rem]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">{settings.merchEyebrow}</p>
          <h1 className="mt-6 max-w-4xl font-display text-[clamp(3.4rem,7vw,7rem)] font-medium leading-[0.92] tracking-[-0.035em]">{settings.merchTitle}</h1>
          <p className="mt-8 max-w-2xl text-base leading-8 text-cream/75 sm:text-lg">{settings.merchDescription}</p>
          {products.length === 0 && <div className="mt-10 inline-flex items-center gap-3 border-b border-gold pb-2 text-sm font-semibold uppercase tracking-[0.16em] text-gold"><ShoppingBag className="size-4" />{settings.merchComingSoonLabel}</div>}
        </div>
      </section>

      {products.length > 0 && <section className="px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-[82rem]">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><p className="section-kicker">Shop the collection</p><h2 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">Stories you can carry with you.</h2></div>
            <p className="text-sm font-semibold text-charcoal/45">{products.length} {products.length === 1 ? "product" : "products"}</p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => <article key={product.id} className="flex flex-col overflow-hidden border border-charcoal/10 bg-cream">
              <div className="relative aspect-square bg-dusty-rose/15">
                {product.image ? <Image src={product.image} alt={product.name} fill unoptimized={product.image.startsWith("/api/uploads/")} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" /> : <div className="grid h-full place-items-center text-burgundy/35"><ShoppingBag className="size-14" /></div>}
              </div>
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-start justify-between gap-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-burgundy">{product.category}</p>{product.price && <p className="shrink-0 text-sm font-bold text-charcoal">{product.price}</p>}</div>
                <h2 className="mt-4 font-display text-3xl leading-tight">{product.name}</h2>
                <p className="mt-4 text-sm leading-6 text-charcoal/70">{product.shortDescription}</p>
                <AddToCartButton productId={product.id} label={product.buttonText || "Add to cart"} className="mt-7 inline-flex w-fit items-center gap-2 bg-burgundy px-5 py-3 text-sm font-semibold text-cream transition-colors hover:bg-charcoal" />
              </div>
            </article>)}
          </div>
        </div>
      </section>}
      <SiteFooter />
    </main>
  );
}

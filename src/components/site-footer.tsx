import Image from "next/image";
import Link from "next/link";

import { FacebookIcon, InstagramIcon } from "@/components/navbar";

const footerLinks = [
  { label: "About", href: "/about" },
  { label: "Books", href: "/books" },
  { label: "News", href: "/news" },
  { label: "Events", href: "/events" },
  { label: "Media + Press", href: "/media-press" },
  { label: "Contact", href: "/contact" },
];

export function SiteFooter() {
  return (
    <footer className="bg-charcoal px-5 pb-8 pt-16 text-cream sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[82rem]">
        <div className="grid gap-12 border-b border-cream/12 pb-14 lg:grid-cols-[1.3fr_0.7fr_0.7fr]">
          <div>
            <Link href="/" aria-label="Kreative Kreations Publishing home">
              <Image src="/images/logo.png" alt="Kreative Kreations Publishing, LLC." width={2560} height={1488} className="h-24 w-auto object-contain" />
            </Link>
            <p className="mt-4 max-w-md text-sm leading-7 text-cream/70 sm:text-base">Writer, author, publisher, creative entrepreneur — and a believer in stories beyond the expected.</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Explore</p>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-cream/75 lg:grid-cols-1">
              {footerLinks.map((item) => <Link key={item.href} href={item.href} className="transition-colors hover:text-gold">{item.label}</Link>)}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Follow along</p>
            <div className="mt-5 flex gap-3">
              <a href="https://www.instagram.com/kreative_kreations_publishing?stkn=NWFna2UxN2ZzYnpr&utm_source=qr" target="_blank" rel="noreferrer" className="grid size-10 place-items-center rounded-full border border-cream/15 transition-colors hover:border-gold hover:text-gold" aria-label="Instagram"><InstagramIcon className="size-4" /></a>
              <a href="https://www.facebook.com/share/1J6w7TJbXT/?mibextid=wwXIfr" target="_blank" rel="noreferrer" className="grid size-10 place-items-center rounded-full border border-cream/15 transition-colors hover:border-gold hover:text-gold" aria-label="Facebook"><FacebookIcon className="size-4" /></a>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 pt-7 text-xs uppercase tracking-[0.14em] text-cream/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Kreative Kreations Publishing, LLC.</p>
          <p>Stories beyond the expected.</p>
        </div>
      </div>
    </footer>
  );
}

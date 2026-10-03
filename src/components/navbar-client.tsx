"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X } from "lucide-react";

import { SocialIcon } from "@/components/social-icon";
import { CartLink } from "@/components/cart-link";
import type { CmsSocialLink } from "@/lib/cms-types";

const navItems = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Books", href: "/books" },
  { label: "Merch", href: "/merch" },
  { label: "News", href: "/news" },
  { label: "Events", href: "/events" },
];

const mobileNavItems = [...navItems, { label: "Media + Press", href: "/media-press" }];

export function NavbarClient({ socialLinks }: { socialLinks: CmsSocialLink[] }) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileOpen]);

  function closeMobileMenu() {
    setMobileOpen(false);
    window.requestAnimationFrame(() => menuButtonRef.current?.focus());
  }

  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);
  const socialButtons = socialLinks.map((social) => (
    <a key={social.id} href={social.url} target="_blank" rel="noreferrer" aria-label={`Follow Keisha on ${social.platform}`} className="grid size-9 place-items-center rounded-full border border-burgundy/20 text-burgundy transition-colors hover:border-burgundy hover:bg-burgundy hover:text-cream">
      <SocialIcon platform={social.platform} className="size-4" />
    </a>
  ));

  return (
    <header className={`sticky top-0 z-50 w-full -mb-20 border-b bg-[#FFF3DF] transition-all duration-300 sm:-mb-24 ${isScrolled ? "border-burgundy/20 shadow-lg shadow-charcoal/10" : "border-burgundy/10"}`}>
      <div className="mx-auto flex h-20 max-w-[90rem] items-center justify-between px-5 sm:h-24 sm:px-8 lg:px-12">
        <Link href="/" className="block shrink-0" aria-label="Kreative Kreations Publishing home"><Image src="/images/logo.png" alt="Kreative Kreations Publishing, LLC." width={2560} height={1488} priority className="h-14 w-auto object-contain sm:h-20" /></Link>
        <div className="hidden items-center gap-3 lg:flex">
          <nav className="flex items-center gap-1" aria-label="Primary navigation">
            {navItems.map((item) => <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? "page" : undefined} className={`px-3 py-2 text-xs font-semibold transition-colors xl:px-4 ${isActive(item.href) ? "bg-burgundy text-cream" : "text-charcoal/75 hover:bg-burgundy/8 hover:text-burgundy"}`}>{item.label}</Link>)}
            <Link href="/media-press" className={`px-3 py-2 text-xs font-semibold transition-colors xl:px-4 ${isActive("/media-press") ? "bg-burgundy text-cream" : "text-charcoal/75 hover:bg-burgundy/8 hover:text-burgundy"}`}>Media + Press</Link>
            <Link href="/contact" className="ml-2 bg-charcoal px-4 py-2 text-xs font-semibold text-cream transition-colors hover:bg-burgundy">Contact</Link>
          </nav>
          {socialLinks.length > 0 && <div className="flex items-center gap-2 border-l border-burgundy/15 pl-3">{socialButtons}</div>}
          <CartLink />
        </div>
        <button ref={menuButtonRef} type="button" onClick={() => setMobileOpen(true)} aria-expanded={mobileOpen} aria-controls="mobile-navigation" className="grid size-11 place-items-center bg-burgundy text-cream lg:hidden"><Menu className="size-5" /><span className="sr-only">Open navigation</span></button>
      </div>

      {mobileOpen && <div id="mobile-navigation" role="dialog" aria-modal="true" aria-label="Site navigation" className="fixed inset-0 z-[100] flex h-[100dvh] flex-col overflow-hidden bg-[#FFF3DF] text-charcoal lg:hidden">
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-burgundy/15 px-5 sm:h-24 sm:px-8">
          <Link href="/" onClick={closeMobileMenu} aria-label="Kreative Kreations Publishing home"><Image src="/images/logo.png" alt="Kreative Kreations Publishing, LLC." width={2560} height={1488} className="h-14 w-auto object-contain sm:h-20" /></Link>
          <button ref={closeButtonRef} type="button" onClick={closeMobileMenu} className="grid size-11 place-items-center border border-burgundy/20 text-burgundy transition-colors hover:bg-burgundy hover:text-cream" aria-label="Close navigation"><X className="size-5" /></button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-7 pt-8 sm:px-8 sm:pb-10 sm:pt-10">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-burgundy">Explore the site</p>
          <nav className="mt-5 border-t border-charcoal/15" aria-label="Mobile navigation">
            {mobileNavItems.map((item, index) => <Link key={item.href} href={item.href} onClick={closeMobileMenu} aria-current={isActive(item.href) ? "page" : undefined} className={`group grid grid-cols-[2rem_1fr_auto] items-center gap-3 border-b border-charcoal/15 py-4 transition-colors sm:py-5 ${isActive(item.href) ? "text-burgundy" : "text-charcoal hover:text-burgundy"}`}><span className="text-xs font-semibold text-gold">{String(index + 1).padStart(2, "0")}</span><span className="font-display text-[clamp(2rem,10vw,3.25rem)] leading-none tracking-[-0.025em]">{item.label}</span><ArrowUpRight className="size-5 opacity-35 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:opacity-100" /></Link>)}
          </nav>

          <Link href="/contact" onClick={closeMobileMenu} className="mt-6 flex items-center justify-between bg-burgundy px-5 py-5 text-cream"><span><span className="block text-xs font-semibold uppercase tracking-[0.18em] text-gold">Start a conversation</span><span className="mt-1 block font-display text-2xl">Contact Keisha</span></span><ArrowUpRight className="size-5" /></Link>
          <div onClick={closeMobileMenu}><CartLink mobile /></div>

          {socialLinks.length > 0 && <div className="mt-auto border-t border-charcoal/15 pt-6"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-charcoal/45">Follow along</p><div className="mt-4 flex flex-wrap gap-3">{socialLinks.map((social) => <a key={social.id} href={social.url} target="_blank" rel="noreferrer" aria-label={`Follow Keisha on ${social.platform}`} className="flex items-center gap-2 rounded-full border border-burgundy/20 px-4 py-2.5 text-sm font-semibold text-burgundy"><SocialIcon platform={social.platform} className="size-4" />{social.platform}</a>)}</div></div>}
        </div>
      </div>}
    </header>
  );
}

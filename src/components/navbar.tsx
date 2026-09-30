"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu } from "lucide-react";

export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

const navItems = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Books", href: "/books" },
  { label: "News", href: "/news" },
  { label: "Events", href: "/events" },
];

const socialLinks = [
  {
    label: "Follow Keisha on Instagram",
    href: "https://www.instagram.com/kreative_kreations_publishing?stkn=NWFna2UxN2ZzYnpr&utm_source=qr",
    icon: InstagramIcon,
  },
  {
    label: "Follow Keisha on Facebook",
    href: "https://www.facebook.com/share/1J6w7TJbXT/?mibextid=wwXIfr",
    icon: FacebookIcon,
  },
];

export function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className={`sticky top-0 z-50 w-full -mb-20 border-b bg-[#FFF3DF] transition-all duration-300 sm:-mb-24 ${isScrolled ? "border-burgundy/20 shadow-lg shadow-charcoal/10" : "border-burgundy/10"}`}>
      <div className="mx-auto flex h-20 max-w-[90rem] items-center justify-between px-5 sm:h-24 sm:px-8 lg:px-12">
        <Link href="/" className="block shrink-0" aria-label="Kreative Kreations Publishing home">
          <Image src="/images/logo.png" alt="Kreative Kreations Publishing, LLC." width={2560} height={1488} priority className="h-14 w-auto object-contain sm:h-20" />
        </Link>

        <div className="hidden items-center gap-3 lg:flex">
          <nav className="flex items-center gap-1" aria-label="Primary navigation">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? "page" : undefined} className={`px-3 py-2 text-xs font-semibold transition-colors xl:px-4 ${isActive(item.href) ? "bg-burgundy text-cream" : "text-charcoal/75 hover:bg-burgundy/8 hover:text-burgundy"}`}>
                {item.label}
              </Link>
            ))}
            <Link href="/media-press" className={`px-3 py-2 text-xs font-semibold transition-colors xl:px-4 ${isActive("/media-press") ? "bg-burgundy text-cream" : "text-charcoal/75 hover:bg-burgundy/8 hover:text-burgundy"}`}>
              Media + Press
            </Link>
            <Link href="/contact" className="ml-2 bg-charcoal px-4 py-2 text-xs font-semibold text-cream transition-colors hover:bg-burgundy">
              Contact
            </Link>
          </nav>

          <div className="flex items-center gap-2 border-l border-burgundy/15 pl-3">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a key={social.label} href={social.href} target="_blank" rel="noreferrer" aria-label={social.label} className="grid size-9 place-items-center rounded-full border border-burgundy/20 text-burgundy transition-colors hover:border-burgundy hover:bg-burgundy hover:text-cream">
                  <Icon className="size-4" />
                </a>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          {socialLinks.map((social) => {
            const Icon = social.icon;
            return (
              <a key={social.label} href={social.href} target="_blank" rel="noreferrer" aria-label={social.label} className="grid size-9 place-items-center rounded-full border border-burgundy/20 text-burgundy transition-colors hover:border-burgundy hover:bg-burgundy hover:text-cream">
                <Icon className="size-4" />
              </a>
            );
          })}

          <details className="group relative ml-1">
            <summary className="grid size-9 cursor-pointer list-none place-items-center border border-burgundy bg-burgundy text-cream [&::-webkit-details-marker]:hidden">
              <Menu className="size-5" />
              <span className="sr-only">Open navigation</span>
            </summary>
            <nav className="absolute right-0 top-12 w-64 border border-burgundy/15 bg-[#FFF3DF] p-3 shadow-xl shadow-charcoal/15" aria-label="Mobile navigation">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className={`block border-b border-burgundy/10 px-3 py-3 text-sm font-medium ${isActive(item.href) ? "bg-burgundy text-cream" : "text-charcoal hover:bg-burgundy/8 hover:text-burgundy"}`}>
                  {item.label}
                </Link>
              ))}
              <Link href="/media-press" className={`block border-b border-burgundy/10 px-3 py-3 text-sm font-medium ${isActive("/media-press") ? "bg-burgundy text-cream" : "text-charcoal hover:bg-burgundy/8 hover:text-burgundy"}`}>Media + Press</Link>
              <Link href="/contact" className="mt-2 flex items-center justify-between bg-charcoal px-3 py-3 text-sm font-semibold text-cream hover:bg-burgundy">
                Contact Keisha <ArrowUpRight className="size-4" />
              </Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

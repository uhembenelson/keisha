import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";

import { AdminLoginForm } from "@/components/admin-login-form";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main className="grid min-h-screen bg-[#f7f1e8] lg:grid-cols-[0.92fr_1.08fr]">
      <section className="flex items-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-burgundy"><ArrowLeft className="size-4" />Back to website</Link>
          <Image src="/images/logo.png" alt="Keisha WriteNow Allen" width={190} height={72} className="mt-12 h-auto w-44 object-contain object-left" priority />
          <p className="mt-10 text-xs font-semibold uppercase tracking-[0.2em] text-burgundy">Private content studio</p>
          <h1 className="mt-3 font-display text-5xl leading-[0.95] text-charcoal sm:text-6xl">Welcome back.</h1>
          <p className="mt-5 max-w-sm text-sm leading-7 text-charcoal/60">Sign in to manage books, news, events, media, press, and the website’s global content.</p>
          <Suspense fallback={<div className="mt-10 h-72 animate-pulse rounded-2xl bg-white/60" />}><AdminLoginForm /></Suspense>
        </div>
      </section>
      <section className="relative hidden min-h-screen overflow-hidden bg-charcoal lg:block">
        <Image src="/images/pic.jpeg" alt="Keisha WriteNow Allen" fill sizes="55vw" className="object-cover object-top opacity-80" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/20 to-transparent" />
        <div className="absolute bottom-16 left-14 max-w-xl text-cream xl:bottom-20 xl:left-20"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">WriteNow CMS</p><p className="mt-4 font-display text-5xl leading-tight">Every story, appearance, and update—all in one place.</p></div>
      </section>
    </main>
  );
}

"use client";

import Link from "next/link";
import { Check, Download, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { writeMerchCart } from "@/lib/merch-cart";

export function CheckoutSuccess() {
  const [digitalOrder, setDigitalOrder] = useState<{ sessionId: string; state: "checking" | "ready" | "waiting" | "scheduled"; releaseDate?: string } | null>(null);
  useEffect(() => {
    writeMerchCart([]);
    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    if (!sessionId) return;
    let active = true;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = async () => {
      try {
        const response = await fetch(`/api/checkout/book/download?check=1&session_id=${encodeURIComponent(sessionId)}`, { cache: "no-store" });
        const result = await response.json().catch(() => ({})) as { kind?: string; ready?: boolean; releasePending?: boolean; releaseDate?: string };
        if (!active) return;
        if (result.kind !== "digital") {
          setDigitalOrder(null);
          return;
        }
        if (result.ready) {
          setDigitalOrder({ sessionId, state: "ready" });
          return;
        }
        if (result.releasePending) {
          setDigitalOrder({ sessionId, state: "scheduled", releaseDate: result.releaseDate });
          return;
        }
        attempts += 1;
        if (attempts >= 30) {
          setDigitalOrder({ sessionId, state: "waiting" });
          return;
        }
        setDigitalOrder({ sessionId, state: "checking" });
        timer = setTimeout(check, 2000);
      } catch {
        if (!active) return;
        attempts += 1;
        if (attempts >= 30) setDigitalOrder({ sessionId, state: "waiting" });
        else timer = setTimeout(check, 2000);
      }
    };
    setDigitalOrder({ sessionId, state: "checking" });
    void check();
    return () => { active = false; if (timer) clearTimeout(timer); };
  }, []);

  const isDigital = digitalOrder !== null;
  return <div className="mx-auto max-w-2xl border border-charcoal/10 bg-cream p-8 text-center sm:p-12"><span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-700 text-white">{isDigital && digitalOrder.state === "checking" ? <LoaderCircle className="size-6 animate-spin" /> : <Check className="size-6" />}</span><h1 className="mt-6 font-display text-5xl">{isDigital ? "Your digital book" : "Thank you for your order."}</h1><p className="mt-4 text-base leading-7 text-charcoal/65">{!isDigital ? "Your payment was submitted securely through Stripe. A receipt and order confirmation will be sent to the email used during checkout." : digitalOrder.state === "ready" ? "Your payment is confirmed. Your book is ready to download." : digitalOrder.state === "scheduled" ? `Your preorder is paid. We’ll email your download when the book releases${digitalOrder.releaseDate ? ` on ${new Date(`${digitalOrder.releaseDate}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}` : ""}.` : digitalOrder.state === "waiting" ? "Your payment is still being confirmed. Refresh this page in a moment and your download will appear here." : "We’re confirming your payment with Stripe. Your download will appear here as soon as it is confirmed."}</p>{isDigital && digitalOrder.state === "ready" ? <a href={`/api/checkout/book/download?session_id=${encodeURIComponent(digitalOrder.sessionId)}`} className="mt-8 inline-flex items-center gap-2 bg-burgundy px-6 py-3 text-sm font-semibold text-cream"><Download className="size-4" />Download your book</a> : <Link href={isDigital ? "/books" : "/merch"} className="mt-8 inline-flex bg-burgundy px-6 py-3 text-sm font-semibold text-cream">{isDigital ? "Browse books" : "Continue shopping"}</Link>}</div>;
}

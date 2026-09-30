"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ArrowUpRight, Download, Store, X } from "lucide-react";

import type { CmsBook, CmsBookRetailer } from "@/lib/cms-types";

export function BookAction({ book, tone = "burgundy" }: { book: CmsBook; tone?: "burgundy" | "gold" }) {
  const [open, setOpen] = useState(false);
  const availability = book.availability ?? (book.price ? "paid" : "coming-soon");
  const retailers = (book.retailers ?? []).filter((retailer) => retailer.name.trim() && /^https?:\/\//i.test(retailer.url));
  const fallbackRetailers: CmsBookRetailer[] = retailers.length ? retailers : book.purchaseUrl ? [{ id: "primary-store", name: "Buy from retailer", url: book.purchaseUrl }] : [];
  const className = `inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold transition ${tone === "gold" ? "bg-gold text-charcoal hover:bg-cream" : "bg-burgundy text-cream hover:bg-charcoal"}`;

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function closeOnEscape(event: KeyboardEvent) { if (event.key === "Escape") setOpen(false); }
    window.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", closeOnEscape); };
  }, [open]);

  if (availability === "free" && book.downloadUrl) {
    return <a href={book.downloadUrl} download className={className}>Download free book <Download className="size-4" /></a>;
  }

  if (availability === "paid" && fallbackRetailers.length) {
    return <><button type="button" onClick={() => setOpen(true)} className={className}>Choose a store{book.price ? ` · ${book.price}` : ""} <Store className="size-4" /></button>{open && typeof document !== "undefined" && createPortal(<StorePicker book={book} retailers={fallbackRetailers} onClose={() => setOpen(false)} />, document.body)}</>;
  }

  return <span className="inline-flex items-center border border-charcoal/15 px-5 py-3 text-sm font-semibold text-charcoal/50">{availability === "free" ? "Free download coming soon" : availability === "paid" ? "Retail links coming soon" : "Coming soon"}</span>;
}

function StorePicker({ book, retailers, onClose }: { book: CmsBook; retailers: CmsBookRetailer[]; onClose: () => void }) {
  return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-charcoal/70 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby={`store-picker-${book.id}`}><button type="button" className="absolute inset-0" onClick={onClose} aria-label="Close store picker" /><div className="relative z-10 max-h-[90svh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-[#fffaf1] p-6 shadow-2xl sm:rounded-3xl sm:p-9"><div className="flex items-start justify-between gap-5 border-b border-charcoal/10 pb-6"><div className="flex items-center gap-4">{book.cover && <div className="relative h-20 w-14 shrink-0 overflow-hidden bg-dusty-rose/20"><Image src={book.cover} alt="" fill unoptimized={book.cover.startsWith("/api/uploads/")} className="object-contain" /></div>}<div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-burgundy">Available from {retailers.length} {retailers.length === 1 ? "retailer" : "retailers"}</p><h2 id={`store-picker-${book.id}`} className="mt-2 font-display text-3xl leading-tight text-charcoal sm:text-4xl">Choose where to buy {book.title}</h2></div></div><button type="button" onClick={onClose} className="rounded-full border border-charcoal/10 p-2.5 text-charcoal/50 hover:bg-white hover:text-charcoal" aria-label="Close"><X className="size-5" /></button></div><div className="mt-6 grid gap-3 sm:grid-cols-2">{retailers.map((retailer) => <a key={retailer.id} href={retailer.url} target="_blank" rel="noreferrer" onClick={onClose} className="group flex min-h-20 items-center justify-between gap-4 rounded-2xl border border-charcoal/10 bg-white px-5 py-4 transition hover:-translate-y-0.5 hover:border-burgundy/35 hover:shadow-md"><RetailerWordmark name={retailer.name} /><ArrowUpRight className="size-4 shrink-0 text-charcoal/30 transition group-hover:text-burgundy" /></a>)}</div><p className="mt-6 text-center text-xs leading-5 text-charcoal/45">You’ll continue to the selected retailer to complete your purchase. Pricing and availability may vary by store.</p></div></div>;
}

function RetailerWordmark({ name }: { name: string }) {
  const normalized = name.toLowerCase();
  const color = normalized.includes("barnes") ? "text-[#38664a]" : normalized.includes("target") ? "text-[#cc0000]" : normalized.includes("walmart") ? "text-[#1769aa]" : normalized.includes("amazon") ? "text-[#111111]" : normalized.includes("thrift") ? "text-[#238070]" : normalized.includes("bookshop") ? "text-[#56368a]" : "text-burgundy";
  return <span className={`font-display text-2xl font-semibold ${color}`}>{name}</span>;
}

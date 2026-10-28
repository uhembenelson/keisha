"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ArrowLeft, ArrowUpRight, CreditCard, Download, LoaderCircle, Store, Truck, X } from "lucide-react";

import type { CmsBook, CmsBookRetailer } from "@/lib/cms-types";
import { US_STATES } from "@/lib/us-states";

export function BookAction({ book, tone = "burgundy" }: { book: CmsBook; tone?: "burgundy" | "gold" }) {
  const [open, setOpen] = useState(false);
  const availability = book.availability ?? (book.price ? "paid" : "coming-soon");
  const presaleOpen = book.presaleEnabled && (!book.presaleEndDate || book.presaleEndDate >= new Date().toISOString().slice(0, 10));
  const directCheckoutOpen = !book.presaleEnabled || presaleOpen;
  const retailers = book.physicalEnabled ? (book.retailers ?? []).filter((retailer) => retailer.name.trim() && /^https?:\/\//i.test(retailer.url)) : [];
  const fallbackRetailers: CmsBookRetailer[] = retailers.length ? retailers : book.physicalEnabled && book.purchaseUrl ? [{ id: "primary-store", name: "Buy from retailer", url: book.purchaseUrl }] : [];
  const canBuyPhysicalDirect = directCheckoutOpen && book.physicalEnabled && book.stripeEnabled;
  const canBuyDigital = directCheckoutOpen && book.digitalEnabled;
  const availablePrices = [canBuyPhysicalDirect || book.physicalEnabled ? book.price : "", canBuyDigital ? book.digitalPrice : ""]
    .map((price) => Number(price.replace(/[^0-9.]/g, "")))
    .filter((price) => Number.isFinite(price) && price > 0);
  const startingPrice = availablePrices.length ? Math.min(...availablePrices).toLocaleString("en-US", { style: "currency", currency: "USD" }) : "";
  const buyLabel = presaleOpen
    ? `Pre-order now${startingPrice ? ` · from ${startingPrice}` : ""}`
    : canBuyDigital && !book.physicalEnabled
    ? `Buy digital copy${book.digitalPrice ? ` · ${book.digitalPrice}` : ""}`
    : canBuyDigital && book.physicalEnabled
      ? `Choose a format${startingPrice ? ` · from ${startingPrice}` : ""}`
      : `Buy this book${book.price ? ` · ${book.price}` : ""}`;
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

  if (book.presaleEnabled && !presaleOpen && fallbackRetailers.length === 0) {
    return <span className="inline-flex items-center border border-charcoal/15 px-5 py-3 text-sm font-semibold text-charcoal/50">Preorders closed</span>;
  }

  if (availability === "paid" && (fallbackRetailers.length || canBuyPhysicalDirect || canBuyDigital)) {
    return <><button type="button" onClick={() => setOpen(true)} className={className}>{buyLabel} <Store className="size-4" /></button>{open && typeof document !== "undefined" && createPortal(<StorePicker book={book} retailers={fallbackRetailers} onClose={() => setOpen(false)} />, document.body)}</>;
  }

  return <span className="inline-flex items-center border border-charcoal/15 px-5 py-3 text-sm font-semibold text-charcoal/50">{availability === "free" ? "Free download coming soon" : availability === "paid" ? "Retail links coming soon" : "Coming soon"}</span>;
}

function StorePicker({ book, retailers, onClose }: { book: CmsBook; retailers: CmsBookRetailer[]; onClose: () => void }) {
  const [shippingOpen, setShippingOpen] = useState(false);
  const [digitalLoading, setDigitalLoading] = useState(false);
  const [digitalError, setDigitalError] = useState("");
  const configuredStripeLabel = (book.stripeButtonText || "Buy securely").trim();
  const stripeLabel = /stripe/i.test(configuredStripeLabel) ? configuredStripeLabel : `${configuredStripeLabel} with Stripe`;
  const presaleOpen = book.presaleEnabled && (!book.presaleEndDate || book.presaleEndDate >= new Date().toISOString().slice(0, 10));
  const canBuyPhysicalDirect = (!book.presaleEnabled || presaleOpen) && book.physicalEnabled && book.stripeEnabled;
  const canBuyDigital = (!book.presaleEnabled || presaleOpen) && book.digitalEnabled;
  const optionCount = retailers.length + (canBuyPhysicalDirect ? 1 : 0) + (canBuyDigital ? 1 : 0);
  async function checkoutDigital() {
    setDigitalLoading(true); setDigitalError("");
    try {
      const response = await fetch("/api/checkout/book", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ bookId: book.id, format: "digital" }) });
      const result = await response.json().catch(() => ({})) as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || "Secure checkout could not be started.");
      window.location.assign(result.url);
    } catch (error) {
      setDigitalError(error instanceof Error ? error.message : "Secure checkout could not be started.");
      setDigitalLoading(false);
    }
  }
  const releaseDate = book.presaleReleaseDate ? new Date(`${book.presaleReleaseDate}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "the announced release date";
  const footer = book.presaleEnabled && presaleOpen
    ? `Preorder payment is collected now. Stripe adds any applicable tax. Physical shipping is charged at checkout; labels are purchased when the book is ready. Digital downloads are emailed on ${releaseDate}.`
    : book.digitalEnabled
    ? "Digital copies are available as a secure download after payment. Physical direct orders include calculated shipping."
    : canBuyPhysicalDirect
      ? "Direct orders include live carrier shipping. Retailer pricing and availability may vary."
      : "Retailer pricing and availability may vary.";
  return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-charcoal/70 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby={`store-picker-${book.id}`}><button type="button" className="absolute inset-0" onClick={onClose} aria-label="Close store picker" /><div className="relative z-10 max-h-[92svh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-[#fffaf1] p-6 shadow-2xl sm:rounded-3xl sm:p-9">{shippingOpen ? <ShippingCheckout book={book} onBack={() => setShippingOpen(false)} onClose={onClose} /> : <><div className="flex items-start justify-between gap-5 border-b border-charcoal/10 pb-6"><div className="flex items-center gap-4">{book.cover && <div className="relative h-20 w-14 shrink-0 overflow-hidden bg-dusty-rose/20"><Image src={book.cover} alt="" fill unoptimized={book.cover.startsWith("/api/uploads/")} className="object-contain" /></div>}<div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-burgundy">{book.presaleEnabled && presaleOpen ? "Pre-order options" : `${optionCount} purchase ${optionCount === 1 ? "option" : "options"}`}</p><h2 id={`store-picker-${book.id}`} className="mt-2 font-display text-3xl leading-tight text-charcoal sm:text-4xl">{book.presaleEnabled && presaleOpen ? `Pre-order ${book.title}` : `Choose how to buy ${book.title}`}</h2>{book.presaleEnabled && presaleOpen && <p className="mt-2 text-sm text-charcoal/55">Expected ship / release: {releaseDate}</p>}</div></div><button type="button" onClick={onClose} className="rounded-full border border-charcoal/10 p-2.5 text-charcoal/50 hover:bg-white hover:text-charcoal" aria-label="Close"><X className="size-5" /></button></div><div className="mt-6 grid gap-3 sm:grid-cols-2">{canBuyPhysicalDirect && <button type="button" onClick={() => setShippingOpen(true)} className="group flex min-h-20 items-center justify-between gap-4 rounded-2xl border-2 border-burgundy bg-burgundy px-5 py-4 text-left text-cream transition hover:bg-charcoal"><span><span className="block text-xs font-semibold uppercase tracking-[0.14em] text-gold">{book.presaleEnabled ? "Physical preorder · ships later" : "Physical copy · ships to you"}</span><span className="mt-1 block font-display text-2xl font-semibold">{stripeLabel}</span><span className="mt-1 block text-xs text-cream/65">{book.price} + calculated shipping charged now</span></span><Truck className="size-5" /></button>}{canBuyDigital && <button type="button" onClick={() => void checkoutDigital()} disabled={digitalLoading} className="group flex min-h-20 items-center justify-between gap-4 rounded-2xl border-2 border-emerald-800 bg-emerald-800 px-5 py-4 text-left text-white transition hover:bg-charcoal disabled:cursor-wait disabled:opacity-70"><span><span className="block text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100">{book.presaleEnabled ? "Digital preorder · no shipping" : "Digital copy · no shipping"}</span><span className="mt-1 block font-display text-2xl font-semibold">{digitalLoading ? "Opening secure checkout…" : `${book.presaleEnabled ? "Pre-order digital" : "Buy digital"} · ${book.digitalPrice}`}</span><span className="mt-1 block text-xs text-white/70">{book.presaleEnabled ? `Download emailed on ${releaseDate}` : "Download available after payment"}</span></span>{digitalLoading ? <LoaderCircle className="size-5 animate-spin" /> : <Download className="size-5" />}</button>}{retailers.map((retailer) => <a key={retailer.id} href={retailer.url} target="_blank" rel="noreferrer" onClick={onClose} className="group flex min-h-20 items-center justify-between gap-4 rounded-2xl border border-charcoal/10 bg-white px-5 py-4 transition hover:-translate-y-0.5 hover:border-burgundy/35 hover:shadow-md"><RetailerWordmark name={retailer.name} /><ArrowUpRight className="size-4 shrink-0 text-charcoal/30 transition group-hover:text-burgundy" /></a>)}</div>{digitalError && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{digitalError}</p>}<p className="mt-6 text-center text-xs leading-5 text-charcoal/45">{footer}</p></>}</div></div>;
}

type CheckoutAddress = { name: string; email: string; phone: string; street1: string; street2: string; city: string; state: string; zip: string; country: "US" };
type CheckoutRate = { id: string; provider: string; service: string; amount: number; currency: string; estimatedDays: number | null; durationTerms: string };

function ShippingCheckout({ book, onBack, onClose }: { book: CmsBook; onBack: () => void; onClose: () => void }) {
  const [address, setAddress] = useState<CheckoutAddress>({ name: "", email: "", phone: "", street1: "", street2: "", city: "", state: "", zip: "", country: "US" });
  const [quoteId, setQuoteId] = useState("");
  const [rates, setRates] = useState<CheckoutRate[]>([]);
  const [selectedRateId, setSelectedRateId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputClassName = "mt-1.5 w-full rounded-xl border border-charcoal/15 bg-white px-4 py-3 text-sm text-charcoal outline-none focus:border-burgundy focus:ring-2 focus:ring-burgundy/10";
  const update = (key: keyof CheckoutAddress, value: string) => setAddress((current) => ({ ...current, [key]: value }));

  async function calculateRates(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/shipping/rates", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ bookId: book.id, quantity: 1, address }) });
      const result = await response.json().catch(() => ({})) as { quoteId?: string; rates?: CheckoutRate[]; error?: string };
      if (!response.ok || !result.quoteId || !result.rates?.length) throw new Error(result.error || "Shipping rates could not be calculated.");
      setQuoteId(result.quoteId); setRates(result.rates); setSelectedRateId(result.rates[0].id);
    } catch (rateError) { setError(rateError instanceof Error ? rateError.message : "Shipping rates could not be calculated."); }
    finally { setLoading(false); }
  }

  async function checkout() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/checkout/book", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ bookId: book.id, format: "physical", quantity: 1, quoteId, rateId: selectedRateId }) });
      const result = await response.json().catch(() => ({})) as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || "Secure checkout could not be started.");
      window.location.assign(result.url);
    } catch (checkoutError) { setError(checkoutError instanceof Error ? checkoutError.message : "Secure checkout could not be started."); setLoading(false); }
  }

  return <><div className="flex items-start justify-between gap-4 border-b border-charcoal/10 pb-5"><div><button type="button" onClick={rates.length ? () => { setRates([]); setQuoteId(""); } : onBack} className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-burgundy"><ArrowLeft className="size-4" />Back</button><h2 className="mt-3 font-display text-3xl text-charcoal sm:text-4xl">{rates.length ? "Choose your shipping" : book.presaleEnabled ? "Where should we send your preorder?" : "Where should we send it?"}</h2><p className="mt-2 text-sm leading-6 text-charcoal/55">{book.title} · {book.price}{rates.length ? " · Live rates from Shippo" : ""}</p></div><button type="button" onClick={onClose} className="rounded-full border border-charcoal/10 p-2.5 text-charcoal/50 hover:bg-white" aria-label="Close"><X className="size-5" /></button></div>{rates.length === 0 ? <form onSubmit={calculateRates} className="mt-6 grid gap-4 sm:grid-cols-2"><CheckoutField label="Full name" value={address.name} onChange={(value) => update("name", value)} className={inputClassName} /><CheckoutField label="Email" type="email" value={address.email} onChange={(value) => update("email", value)} className={inputClassName} /><CheckoutField label="Phone" type="tel" value={address.phone} onChange={(value) => update("phone", value)} className={inputClassName} /><CheckoutField label="Street address" value={address.street1} onChange={(value) => update("street1", value)} className={inputClassName} /><CheckoutField label="Apartment, suite, etc. (optional)" value={address.street2} onChange={(value) => update("street2", value)} className={inputClassName} required={false} /><CheckoutField label="City" value={address.city} onChange={(value) => update("city", value)} className={inputClassName} /><label className="text-xs font-semibold uppercase tracking-[0.1em] text-charcoal/55">State<select required value={address.state} onChange={(event) => update("state", event.target.value)} className={inputClassName}><option value="">Choose a state</option>{US_STATES.map(([code, name]) => <option key={code} value={code}>{name} ({code})</option>)}</select></label><CheckoutField label="ZIP code" value={address.zip} onChange={(value) => update("zip", value)} className={inputClassName} /><div className="sm:col-span-2 rounded-xl border border-charcoal/10 bg-white px-4 py-3 text-sm text-charcoal/65">Country: <strong>United States</strong></div>{error && <p className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}<button type="submit" disabled={loading} className="sm:col-span-2 inline-flex items-center justify-center gap-2 bg-burgundy px-6 py-3.5 text-sm font-semibold text-cream disabled:opacity-60">{loading ? <LoaderCircle className="size-4 animate-spin" /> : <Truck className="size-4" />}{loading ? "Calculating…" : "Calculate shipping"}</button></form> : <div className="mt-6"><div className="space-y-3">{rates.map((rate) => <label key={rate.id} className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition ${selectedRateId === rate.id ? "border-burgundy bg-burgundy/5" : "border-charcoal/10 bg-white"}`}><input type="radio" name="shipping-rate" checked={selectedRateId === rate.id} onChange={() => setSelectedRateId(rate.id)} className="size-4 accent-burgundy" /><Truck className="size-5 text-burgundy" /><span className="min-w-0 flex-1"><strong className="block text-sm text-charcoal">{rate.provider} · {rate.service}</strong><span className="mt-1 block text-xs text-charcoal/50">{rate.estimatedDays ? `${rate.estimatedDays} business day${rate.estimatedDays === 1 ? "" : "s"}` : rate.durationTerms || "Carrier estimate"}</span></span><strong className="text-sm text-charcoal">{new Intl.NumberFormat("en-US", { style: "currency", currency: rate.currency.toUpperCase() }).format(rate.amount / 100)}</strong></label>)}</div>{error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}<div className="mt-6 flex items-center justify-between gap-5 border-t border-charcoal/10 pt-5"><p className="text-xs leading-5 text-charcoal/45">{book.presaleEnabled ? "Book and shipping are charged now; Stripe adds any applicable tax. The label is purchased when the preorder is released, and any price change is covered by the business." : "Stripe will add any applicable sales tax and show the full book and shipping total before payment."}</p><button type="button" onClick={() => void checkout()} disabled={loading || !selectedRateId} className="inline-flex shrink-0 items-center gap-2 bg-burgundy px-6 py-3.5 text-sm font-semibold text-cream disabled:opacity-60">{loading ? <LoaderCircle className="size-4 animate-spin" /> : <CreditCard className="size-4" />}Continue to Stripe</button></div></div>}</>;
}

function CheckoutField({ label, value, onChange, className, type = "text", required = true, placeholder }: { label: string; value: string; onChange: (value: string) => void; className: string; type?: string; required?: boolean; placeholder?: string }) {
  return <label className="text-xs font-semibold uppercase tracking-[0.1em] text-charcoal/55">{label}<input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={className} /></label>;
}

function RetailerWordmark({ name }: { name: string }) {
  const normalized = name.toLowerCase();
  const color = normalized.includes("barnes") ? "text-[#38664a]" : normalized.includes("target") ? "text-[#cc0000]" : normalized.includes("walmart") ? "text-[#1769aa]" : normalized.includes("amazon") ? "text-[#111111]" : normalized.includes("thrift") ? "text-[#238070]" : normalized.includes("bookshop") ? "text-[#56368a]" : "text-burgundy";
  return <span className={`font-display text-2xl font-semibold ${color}`}>{name}</span>;
}

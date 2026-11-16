"use client";

import Image from "next/image";
import Link from "next/link";
import { LoaderCircle, Minus, Plus, ShoppingBag, Trash2, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { bookUnitAmount, isBookBagEligible } from "@/lib/book-order";
import { clampBookQuantity, readBookBag, writeBookBag, type BookBagItem } from "@/lib/book-bag";
import type { CmsBook } from "@/lib/cms-types";
import { US_STATES } from "@/lib/us-states";

type DeliveryAddress = { name: string; email: string; phone: string; street1: string; street2: string; city: string; state: string; zip: string; country: "US" };
type CheckoutRate = { id: string; provider: string; service: string; amount: number; currency: string; estimatedDays: number | null; durationTerms: string };

const fieldClass = "mt-1.5 w-full rounded-xl border border-charcoal/15 bg-white px-4 py-3 text-sm text-charcoal outline-none focus:border-burgundy focus:ring-2 focus:ring-burgundy/10";

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function emptyAddress(): DeliveryAddress {
  return { name: "", email: "", phone: "", street1: "", street2: "", city: "", state: "", zip: "", country: "US" };
}

export function BookBagClient({ books }: { books: CmsBook[] }) {
  const [items, setItems] = useState<BookBagItem[]>([]);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [address, setAddress] = useState<DeliveryAddress>(emptyAddress);
  const [quoteId, setQuoteId] = useState("");
  const [rates, setRates] = useState<CheckoutRate[]>([]);
  const [selectedRateId, setSelectedRateId] = useState("");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const stored = readBookBag();
      const valid = stored.filter((item) => isBookBagEligible(books.find((book) => book.id === item.bookId)));
      if (valid.length !== stored.length) writeBookBag(valid);
      setItems(valid);
      setReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [books]);

  const rows = useMemo(
    () => items.map((item) => ({ ...item, book: books.find((book) => book.id === item.bookId) })).filter((row): row is BookBagItem & { book: CmsBook } => Boolean(row.book)),
    [items, books],
  );
  const subtotal = rows.reduce((sum, row) => sum + bookUnitAmount(row.book, row.signedCopy) * row.quantity, 0);
  const selectedRate = rates.find((rate) => rate.id === selectedRateId);
  const total = subtotal + (selectedRate?.amount || 0);

  function resetQuote() {
    setRates([]);
    setQuoteId("");
    setSelectedRateId("");
  }

  function update(bookId: string, signedCopy: boolean, quantity: number) {
    const matches = (item: BookBagItem) => item.bookId === bookId && item.signedCopy === signedCopy;
    const next = quantity <= 0 ? items.filter((item) => !matches(item)) : items.map((item) => matches(item) ? { ...item, quantity: clampBookQuantity(quantity) } : item);
    setItems(next);
    writeBookBag(next);
    resetQuote();
    setError("");
  }

  async function calculateRates(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/shipping/rates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items: rows.map(({ bookId, signedCopy, quantity }) => ({ bookId, signedCopy, quantity })), address }),
      });
      const result = await response.json().catch(() => ({})) as { quoteId?: string; rates?: CheckoutRate[]; error?: string };
      if (!response.ok || !result.quoteId || !result.rates?.length) throw new Error(result.error || "Shipping rates could not be calculated.");
      setQuoteId(result.quoteId);
      setRates(result.rates);
      setSelectedRateId(result.rates[0].id);
    } catch (rateError) {
      setError(rateError instanceof Error ? rateError.message : "Shipping rates could not be calculated.");
    } finally {
      setLoading(false);
    }
  }

  async function checkout() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/checkout/books", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items: rows.map(({ bookId, signedCopy, quantity }) => ({ bookId, signedCopy, quantity })), quoteId, rateId: selectedRateId }),
      });
      const result = await response.json().catch(() => ({})) as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || "Secure checkout could not be started.");
      window.location.assign(result.url);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Secure checkout could not be started.");
      setLoading(false);
    }
  }

  if (!ready) return <div className="grid min-h-64 place-items-center"><LoaderCircle className="size-7 animate-spin text-burgundy" /></div>;

  if (rows.length === 0) {
    return (
      <div className="border border-charcoal/10 bg-cream p-10 text-center">
        <ShoppingBag className="mx-auto size-10 text-burgundy/40" />
        <h2 className="mt-5 font-display text-4xl">Your book bag is empty.</h2>
        <p className="mt-3 text-sm text-charcoal/60">Add as many titles as you like and pay for them together in one order.</p>
        <Link href="/books" className="mt-7 inline-flex bg-burgundy px-6 py-3 text-sm font-semibold text-cream">Browse the books</Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
      <div className="space-y-4">
        {rows.map(({ book, signedCopy, quantity }) => (
          <article key={`${book.id}:${signedCopy ? "signed" : "standard"}`} className="grid grid-cols-[6rem_1fr] gap-5 border border-charcoal/10 bg-cream p-4 sm:grid-cols-[8rem_1fr_auto] sm:items-center">
            <div className="relative aspect-square bg-dusty-rose/15">
              {book.cover ? <Image src={book.cover} alt={book.title} fill unoptimized={book.cover.startsWith("/api/uploads/") || /^https?:\/\//.test(book.cover)} className="object-contain p-2" /> : <ShoppingBag className="absolute inset-0 m-auto size-8 text-burgundy/35" />}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-burgundy">{book.category}</p>
              <h2 className="mt-2 font-display text-2xl">{book.title}</h2>
              {signedCopy && <p className="mt-1 text-xs font-semibold text-charcoal/50">Signed copy</p>}
              <p className="mt-2 text-sm font-semibold">{money(bookUnitAmount(book, signedCopy))}</p>
              <div className="mt-4 inline-flex items-center border border-charcoal/15">
                <button type="button" onClick={() => update(book.id, signedCopy, quantity - 1)} className="grid size-9 place-items-center" aria-label={`Reduce ${book.title} quantity`}><Minus className="size-3.5" /></button>
                <span className="grid min-w-9 place-items-center text-sm font-semibold">{quantity}</span>
                <button type="button" onClick={() => update(book.id, signedCopy, quantity + 1)} className="grid size-9 place-items-center" aria-label={`Increase ${book.title} quantity`}><Plus className="size-3.5" /></button>
              </div>
            </div>
            <button type="button" onClick={() => update(book.id, signedCopy, 0)} className="col-span-2 inline-flex items-center gap-2 text-xs font-semibold text-red-700 sm:col-span-1"><Trash2 className="size-4" />Remove</button>
          </article>
        ))}

        {rates.length === 0 ? (
          <form onSubmit={calculateRates} className="grid gap-5 border border-charcoal/10 bg-cream p-5 sm:grid-cols-2 sm:p-7">
            <div className="sm:col-span-2 flex items-start gap-3 border-b border-charcoal/10 pb-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-burgundy/10 text-burgundy"><Truck className="size-5" /></span>
              <div><h2 className="font-display text-2xl">Delivery details</h2><p className="mt-1 text-sm leading-6 text-charcoal/60">All {rows.reduce((sum, row) => sum + row.quantity, 0)} copies ship together. Stripe will calculate any applicable tax before payment.</p></div>
            </div>
            <label className="text-xs font-semibold uppercase tracking-[0.1em] text-charcoal/55">Full name<input autoComplete="name" required value={address.name} onChange={(event) => setAddress((current) => ({ ...current, name: event.target.value }))} className={fieldClass} /></label>
            <label className="text-xs font-semibold uppercase tracking-[0.1em] text-charcoal/55">Email<input autoComplete="email" required type="email" value={address.email} onChange={(event) => setAddress((current) => ({ ...current, email: event.target.value }))} className={fieldClass} /></label>
            <label className="text-xs font-semibold uppercase tracking-[0.1em] text-charcoal/55">Phone<input autoComplete="tel" required type="tel" value={address.phone} onChange={(event) => setAddress((current) => ({ ...current, phone: event.target.value }))} className={fieldClass} /></label>
            <label className="text-xs font-semibold uppercase tracking-[0.1em] text-charcoal/55 sm:col-span-2">Street address<input autoComplete="address-line1" required value={address.street1} onChange={(event) => setAddress((current) => ({ ...current, street1: event.target.value }))} className={fieldClass} /></label>
            <label className="text-xs font-semibold uppercase tracking-[0.1em] text-charcoal/55 sm:col-span-2">Apartment, suite, etc. (optional)<input autoComplete="address-line2" value={address.street2} onChange={(event) => setAddress((current) => ({ ...current, street2: event.target.value }))} className={fieldClass} /></label>
            <label className="text-xs font-semibold uppercase tracking-[0.1em] text-charcoal/55">City<input autoComplete="address-level2" required value={address.city} onChange={(event) => setAddress((current) => ({ ...current, city: event.target.value }))} className={fieldClass} /></label>
            <label className="text-xs font-semibold uppercase tracking-[0.1em] text-charcoal/55">State<select autoComplete="address-level1" required value={address.state} onChange={(event) => setAddress((current) => ({ ...current, state: event.target.value }))} className={fieldClass}><option value="">Choose a state</option>{US_STATES.map(([code, name]) => <option key={code} value={code}>{name} ({code})</option>)}</select></label>
            <label className="text-xs font-semibold uppercase tracking-[0.1em] text-charcoal/55">ZIP code<input autoComplete="postal-code" required placeholder="10001" pattern="[0-9]{5}(-[0-9]{4})?" inputMode="numeric" maxLength={10} value={address.zip} onChange={(event) => setAddress((current) => ({ ...current, zip: event.target.value }))} className={fieldClass} /></label>
            <div className="rounded-xl border border-charcoal/10 bg-white px-4 py-3 text-sm text-charcoal/65">Country: <strong>United States</strong></div>
            {error && <p role="alert" className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
            <button type="submit" disabled={loading} className="sm:col-span-2 inline-flex items-center justify-center gap-2 bg-burgundy px-6 py-3.5 text-sm font-semibold text-cream disabled:opacity-60">
              {loading ? <LoaderCircle className="size-4 animate-spin" /> : <Truck className="size-4" />}{loading ? "Calculating…" : "Calculate shipping"}
            </button>
          </form>
        ) : (
          <div className="border border-charcoal/10 bg-cream p-5 sm:p-7">
            <h2 className="font-display text-2xl">Choose your shipping</h2>
            <p className="mt-1 text-sm text-charcoal/55">Rates are live from the carrier for {rows.reduce((sum, row) => sum + row.quantity, 0)} copies.</p>
            <div className="mt-5 space-y-3">
              {rates.map((rate) => (
                <label key={rate.id} className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition ${selectedRateId === rate.id ? "border-burgundy bg-burgundy/5" : "border-charcoal/10 bg-white"}`}>
                  <input type="radio" name="bag-shipping-rate" checked={selectedRateId === rate.id} onChange={() => setSelectedRateId(rate.id)} className="size-4 accent-burgundy" />
                  <Truck className="size-5 text-burgundy" />
                  <span className="min-w-0 flex-1"><strong className="block text-sm text-charcoal">{rate.provider} · {rate.service}</strong><span className="mt-1 block text-xs text-charcoal/50">{rate.estimatedDays ? `${rate.estimatedDays} business day${rate.estimatedDays === 1 ? "" : "s"}` : rate.durationTerms || "Carrier estimate"}</span></span>
                  <strong className="text-sm text-charcoal">{money(rate.amount)}</strong>
                </label>
              ))}
            </div>
            {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-charcoal/10 pt-5">
              <button type="button" onClick={resetQuote} className="text-xs font-semibold text-burgundy underline underline-offset-4">Change address or quantity</button>
              <button type="button" onClick={() => void checkout()} disabled={loading || !selectedRateId} className="inline-flex items-center gap-2 bg-burgundy px-6 py-3.5 text-sm font-semibold text-cream disabled:opacity-60">
                {loading ? <LoaderCircle className="size-4 animate-spin" /> : <Truck className="size-4" />}{loading ? "Opening secure payment…" : "Continue to Stripe"}
              </button>
            </div>
          </div>
        )}
      </div>

      <aside className="border border-charcoal/10 bg-charcoal p-6 text-cream lg:sticky lg:top-28">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Order summary</p>
        <div className="mt-6 space-y-3 border-b border-cream/15 pb-5 text-sm">
          {rows.map(({ book, signedCopy, quantity }) => <div key={`${book.id}:${signedCopy ? "signed" : "standard"}`} className="flex items-start justify-between gap-4"><span className="min-w-0 text-cream/75">{quantity} × {book.title}{signedCopy ? " (signed)" : ""}</span><strong className="shrink-0">{money(bookUnitAmount(book, signedCopy) * quantity)}</strong></div>)}
        </div>
        <div className="mt-4 flex items-center justify-between"><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
        <div className="mt-3 flex items-center justify-between text-sm"><span>Shipping</span><strong className="text-gold">{selectedRate ? money(selectedRate.amount) : "Calculated next"}</strong></div>
        <div className="mt-4 flex items-center justify-between border-t border-cream/15 pt-4 text-lg"><span>Total</span><strong>{selectedRate ? money(total) : money(subtotal)}</strong></div>
        <p className="mt-4 text-xs leading-5 text-cream/55">Applicable taxes are calculated by Stripe at checkout.</p>
        <Link href="/books" className="mt-5 block text-center text-xs font-semibold text-cream/55 underline underline-offset-4 hover:text-cream">Keep browsing</Link>
      </aside>
    </div>
  );
}

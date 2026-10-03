"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpenText,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  CreditCard,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  GripVertical,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  MessageSquare,
  Menu,
  Newspaper,
  PackageCheck,
  Pencil,
  Plus,
  Save,
  Settings,
  ShoppingBag,
  Trash2,
  UserRoundCheck,
  X,
} from "lucide-react";

import type {
  CmsBook,
  CmsBookRetailer,
  CmsContent,
  CmsEvent,
  CmsHomepageSectionId,
  CmsMediaCategory,
  CmsMediaItem,
  CmsMerchCategory,
  CmsMerchProduct,
  CmsNewsItem,
  CmsSettings,
  CmsSocialLink,
  CmsSubmissions,
} from "@/lib/cms-types";
import { CMS_MEDIA_CATEGORIES, CMS_MERCH_CATEGORIES, HERO_NEWSLETTER_LIMITS, HOMEPAGE_STAT_LIMITS, homepageStatsFitLayout } from "@/lib/cms-types";
import { AdminImageUploader } from "@/components/admin-image-uploader";
import { AdminBookFileUploader } from "@/components/admin-book-file-uploader";
import { SocialIcon } from "@/components/social-icon";

type Tab = "overview" | "books" | "merch" | "news" | "events" | "media" | "orders" | "inquiries" | "subscribers" | "payments" | "settings";
type CollectionKey = "books" | "merch" | "news" | "events" | "media";

const navItems: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "books", label: "Books", icon: BookOpenText },
  { id: "merch", label: "Merch", icon: ShoppingBag },
  { id: "news", label: "News", icon: Newspaper },
  { id: "events", label: "Events", icon: CalendarDays },
  { id: "media", label: "Media + Press", icon: FileText },
  { id: "orders", label: "Merch orders", icon: PackageCheck },
  { id: "inquiries", label: "Contact inquiries", icon: MessageSquare },
  { id: "subscribers", label: "Newsletter", icon: UserRoundCheck },
  { id: "payments", label: "Payment settings", icon: CreditCard },
  { id: "settings", label: "Site settings", icon: Settings },
];

const homepageSectionLabels: Record<CmsHomepageSectionId, string> = {
  hero: "Hero",
  about: "About & statistics",
  books: "Books",
  creative: "Creative roles",
  "featured-book": "Featured book",
  merch: "Merch",
  connect: "Connect & contact",
  newsletter: "Newsletter",
};

const mediaCategoryActionLabels: Record<CmsMediaCategory, string> = {
  Interviews: "Watch interview",
  Features: "Read feature",
  Appearances: "View appearance",
  Videos: "Watch video",
  "Podcast / vlogcast": "Listen or watch",
  "Press release": "Read press release",
  "Press kit": "Open press kit",
};

type MerchOrder = { id: string; status: string; customerEmail?: string; customerName?: string; amountTotal: number; currency: string; createdAt: string; items: { name: string; quantity: number }[] };

const inputClass =
  "mt-2 w-full rounded-xl border border-charcoal/15 bg-white px-4 py-3 text-sm text-charcoal outline-none transition focus:border-burgundy focus:ring-2 focus:ring-burgundy/10";
const labelClass = "text-xs font-semibold uppercase tracking-[0.12em] text-charcoal/55";

function newId(prefix: string) {
  return `${prefix}-${Date.now()}`;
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <label className={labelClass}>
      <span className="flex items-center justify-between gap-3"><span>{label}</span>{maxLength ? <span className="shrink-0 normal-case tracking-normal text-charcoal/40">{value.length}/{maxLength}</span> : null}</span>
      <input
        className={inputClass}
        type={type}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <label className={labelClass}>
      <span className="flex items-center justify-between gap-3"><span>{label}</span>{maxLength ? <span className="shrink-0 normal-case tracking-normal text-charcoal/40">{value.length}/{maxLength}</span> : null}</span>
      <textarea
        className={`${inputClass} resize-y leading-6`}
        rows={rows}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SettingsEditorCard({
  id,
  number,
  title,
  description,
  children,
  defaultOpen = false,
}: {
  id: string;
  number?: number;
  title: string;
  description: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details id={id} open={defaultOpen} className="group scroll-mt-28 rounded-2xl border border-charcoal/10 bg-white shadow-sm">
      <summary className="flex cursor-pointer list-none items-center gap-4 p-5 marker:hidden sm:p-6 [&::-webkit-details-marker]:hidden">
        {number ? <span className="grid size-9 shrink-0 place-items-center rounded-full bg-burgundy text-sm font-bold text-cream">{number}</span> : null}
        <span className="min-w-0 flex-1">
          <span className="block font-display text-2xl text-charcoal">{title}</span>
          <span className="mt-1 block text-sm font-normal normal-case leading-6 tracking-normal text-charcoal/55">{description}</span>
        </span>
        <ChevronDown className="size-5 shrink-0 text-charcoal/45 transition group-open:rotate-180" />
      </summary>
      <div className="border-t border-charcoal/10 p-5 sm:p-6">{children}</div>
    </details>
  );
}

function PublishedToggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-3 text-sm font-semibold text-charcoal">
      <input
        className="size-4 accent-burgundy"
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      Published on the website
    </label>
  );
}

function EditorCard({
  title,
  subtitle,
  onDelete,
  onClose,
  onSave,
  saving,
  children,
}: {
  title: string;
  subtitle: string;
  onDelete: () => void;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-charcoal/10 bg-[#fffdf9] p-5 shadow-sm sm:p-7">
      <div className="flex items-start justify-between gap-5 border-b border-charcoal/10 pb-5">
        <div>
          <h3 className="font-display text-2xl text-charcoal">{title || "Untitled entry"}</h3>
          <p className="mt-1 text-xs uppercase tracking-[0.12em] text-charcoal/45">{subtitle}</p>
        </div>
        <div className="flex items-center gap-1"><button type="button" onClick={onDelete} className="rounded-full p-2 text-charcoal/45 transition hover:bg-red-50 hover:text-red-700" aria-label={`Delete ${title}`}><Trash2 className="size-4" /></button><button type="button" onClick={onClose} className="rounded-full p-2 text-charcoal/45 transition hover:bg-charcoal/5 hover:text-charcoal" aria-label="Close editor"><X className="size-4" /></button></div>
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">{children}</div>
      <div className="mt-7 flex flex-wrap justify-end gap-3 border-t border-charcoal/10 pt-5"><button type="button" onClick={onClose} className="rounded-full border border-charcoal/15 px-5 py-2.5 text-sm font-semibold text-charcoal">Back to list</button><button type="button" onClick={onSave} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-burgundy px-5 py-2.5 text-sm font-semibold text-cream disabled:opacity-60">{saving ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}Save and close</button></div>
    </article>
  );
}

export function AdminDashboard() {
  const router = useRouter();
  const [content, setContent] = useState<CmsContent | null>(null);
  const [submissions, setSubmissions] = useState<CmsSubmissions | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [editing, setEditing] = useState<Record<CollectionKey, number | null>>({ books: null, merch: null, news: null, events: null, media: null });
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null);
  const [selectedSubscriberId, setSelectedSubscriberId] = useState<string | null>(null);
  const [draggedHomepageSection, setDraggedHomepageSection] = useState<CmsHomepageSectionId | null>(null);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [paymentSettings, setPaymentSettings] = useState({ publishableKey: "", secretKey: "", webhookSecret: "", secretKeyConfigured: false, webhookSecretConfigured: false, ready: false });
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [orders, setOrders] = useState<MerchOrder[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/content", { cache: "no-store" }),
      fetch("/api/admin/submissions", { cache: "no-store" }),
      fetch("/api/admin/payment-settings", { cache: "no-store" }),
      fetch("/api/admin/orders", { cache: "no-store" }),
    ])
      .then(async ([contentResponse, submissionsResponse, paymentResponse, ordersResponse]) => {
        if (!contentResponse.ok || !submissionsResponse.ok || !paymentResponse.ok || !ordersResponse.ok) throw new Error("Could not load the CMS data.");
        return Promise.all([contentResponse.json() as Promise<CmsContent>, submissionsResponse.json() as Promise<CmsSubmissions>, paymentResponse.json() as Promise<{ publishableKey: string; secretKeyConfigured: boolean; webhookSecretConfigured: boolean; ready: boolean }>, ordersResponse.json() as Promise<{ orders: MerchOrder[] }>]);
      })
      .then(([contentData, submissionsData, paymentData, orderData]) => {
        setContent(contentData);
        setSubmissions(submissionsData);
        setPaymentSettings((current) => ({ ...current, ...paymentData }));
        setOrders(orderData.orders);
      })
      .catch((error: Error) => setNotice({ kind: "error", message: error.message }));
  }, []);

  async function savePaymentConfiguration() {
    setPaymentSaving(true);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/payment-settings", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ publishableKey: paymentSettings.publishableKey, secretKey: paymentSettings.secretKey, webhookSecret: paymentSettings.webhookSecret }) });
      const result = await response.json() as { error?: string; publishableKey?: string; secretKeyConfigured?: boolean; webhookSecretConfigured?: boolean; ready?: boolean };
      if (!response.ok) throw new Error(result.error || "Payment settings could not be saved.");
      setPaymentSettings((current) => ({ ...current, publishableKey: result.publishableKey || "", secretKey: "", webhookSecret: "", secretKeyConfigured: Boolean(result.secretKeyConfigured), webhookSecretConfigured: Boolean(result.webhookSecretConfigured), ready: Boolean(result.ready) }));
      setNotice({ kind: "success", message: result.ready ? "Stripe checkout is configured and ready." : "Payment settings saved. Add the remaining Stripe keys to activate checkout." });
    } catch (error) {
      setNotice({ kind: "error", message: error instanceof Error ? error.message : "Payment settings could not be saved." });
    } finally {
      setPaymentSaving(false);
    }
  }

  async function updateOrderStatus(id: string, status: string) {
    const previous = orders;
    setOrders((current) => current.map((order) => order.id === id ? { ...order, status } : order));
    const response = await fetch("/api/admin/orders", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, status }) });
    if (!response.ok) {
      setOrders(previous);
      const result = await response.json().catch(() => ({})) as { error?: string };
      setNotice({ kind: "error", message: result.error || "Order status could not be updated." });
    }
  }

  useEffect(() => {
    function warnBeforeLeaving(event: BeforeUnloadEvent) {
      if (!dirty) return;
      event.preventDefault();
    }
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [dirty]);

  const counts = useMemo(() => {
    if (!content || !submissions) return [];
    return [
      { label: "Books", value: content.books.length, tab: "books" as Tab, icon: BookOpenText },
      { label: "Merch products", value: content.merch.length, tab: "merch" as Tab, icon: ShoppingBag },
      { label: "News posts", value: content.news.length, tab: "news" as Tab, icon: Newspaper },
      { label: "Events", value: content.events.length, tab: "events" as Tab, icon: CalendarDays },
      { label: "Media items", value: content.media.length, tab: "media" as Tab, icon: FileText },
      { label: "Merch orders", value: orders.length, tab: "orders" as Tab, icon: PackageCheck },
      { label: "New inquiries", value: submissions.inquiries.filter((item) => item.status === "new").length, tab: "inquiries" as Tab, icon: MessageSquare },
      { label: "Subscribers", value: submissions.subscribers.filter((item) => item.status === "active").length, tab: "subscribers" as Tab, icon: UserRoundCheck },
    ];
  }, [content, submissions, orders.length]);

  function updateSettings<K extends keyof CmsSettings>(key: K, value: CmsSettings[K]) {
    setDirty(true);
    setContent((current) => current && { ...current, settings: { ...current.settings, [key]: value } });
  }

  function toggleHomepageSection(id: CmsHomepageSectionId) {
    if (!content) return;
    updateSettings("homepageSections", content.settings.homepageSections.map((section) =>
      section.id === id ? { ...section, enabled: !section.enabled } : section,
    ));
  }

  function moveHomepageSection(id: CmsHomepageSectionId, targetIndex: number) {
    if (!content) return;
    const sections = [...content.settings.homepageSections];
    const currentIndex = sections.findIndex((section) => section.id === id);
    if (currentIndex < 0) return;
    const boundedTarget = Math.max(0, Math.min(targetIndex, sections.length - 1));
    if (currentIndex === boundedTarget) return;
    const [moved] = sections.splice(currentIndex, 1);
    sections.splice(boundedTarget, 0, moved);
    updateSettings("homepageSections", sections);
  }

  function dropHomepageSection(targetId: CmsHomepageSectionId) {
    if (!content || !draggedHomepageSection || draggedHomepageSection === targetId) return;
    const targetIndex = content.settings.homepageSections.findIndex((section) => section.id === targetId);
    moveHomepageSection(draggedHomepageSection, targetIndex);
    setDraggedHomepageSection(null);
  }

  function updateItem<K extends CollectionKey>(collection: K, index: number, patch: Partial<CmsContent[K][number]>) {
    setDirty(true);
    setContent((current) => {
      if (!current) return current;
      const items = [...current[collection]] as CmsContent[K];
      items[index] = { ...items[index], ...patch } as CmsContent[K][number];
      return { ...current, [collection]: items };
    });
  }

  function removeItem(collection: CollectionKey, index: number) {
    if (!window.confirm("Delete this item? Save changes to make the deletion permanent.")) return;
    setContent((current) => current && { ...current, [collection]: current[collection].filter((_, itemIndex) => itemIndex !== index) });
    setEditing((current) => ({ ...current, [collection]: null }));
    setNotice({ kind: "success", message: "Item removed. Save changes to publish the deletion." });
    setDirty(true);
  }

  function addItem(collection: CollectionKey, mediaCategory: CmsMediaCategory = "Interviews") {
    const nextIndex = content?.[collection].length ?? 0;
    setContent((current) => {
      if (!current) return current;
      const entry = {
        books: { id: newId("book"), slug: "new-book", title: "New book", category: "", price: "", availability: "coming-soon", purchaseUrl: "", retailers: [], downloadUrl: "", cover: "", gallery: [], shortDescription: "", description: "", published: false } satisfies CmsBook,
        merch: { id: newId("merch"), name: "New product", category: "Other", shortDescription: "", price: "", buyUrl: "", buttonText: "Shop Now", image: "", published: false } satisfies CmsMerchProduct,
        news: { id: newId("news"), slug: "new-update", title: "New update", date: new Date().toISOString().slice(0, 10), excerpt: "", body: "", image: "", gallery: [], published: false } satisfies CmsNewsItem,
        events: { id: newId("event"), title: "New event", date: "", location: "", description: "", image: "", gallery: [], published: false } satisfies CmsEvent,
        media: { id: newId("media"), title: `New ${mediaCategory.toLowerCase()} item`, type: mediaCategory, outlet: "", date: "", summary: "", mediaUrl: "", mediaCtaLabel: mediaCategoryActionLabels[mediaCategory], image: "", gallery: [], published: false } satisfies CmsMediaItem,
      }[collection];
      return { ...current, [collection]: [...current[collection], entry] } as CmsContent;
    });
    setEditing((current) => ({ ...current, [collection]: nextIndex }));
    setDirty(true);
  }

  async function save() {
    if (!content) return false;
    if (!homepageStatsFitLayout(content.settings)) {
      setNotice({ kind: "error", message: "A homepage statistic exceeds its layout-safe character limit." });
      return false;
    }
    if (
      content.settings.heroNewsletterTitle.length > HERO_NEWSLETTER_LIMITS.heroNewsletterTitle ||
      content.settings.heroNewsletterCopy.length > HERO_NEWSLETTER_LIMITS.heroNewsletterCopy ||
      content.settings.heroNewsletterCtaLabel.length > HERO_NEWSLETTER_LIMITS.heroNewsletterCtaLabel
    ) {
      setNotice({ kind: "error", message: "The hero newsletter card exceeds its layout-safe character limit." });
      return false;
    }
    const invalidExternalUrl = [
      content.settings.newsletterExternalUrl,
      ...content.settings.socialLinks.map((link) => link.url),
      ...content.media.map((item) => item.mediaUrl),
      ...content.merch.map((product) => product.buyUrl),
    ].find((url) => url.trim() && !/^https?:\/\//i.test(url));
    if (invalidExternalUrl) {
      setNotice({ kind: "error", message: "External newsletter, social, media, and merch links must begin with http:// or https://." });
      return false;
    }
    const featuredBook = content.books.find((book) => book.id === content.settings.heroFeatureBookId);
    if (content.settings.heroPromotionType === "book" && (!featuredBook || !featuredBook.published)) {
      setNotice({ kind: "error", message: "Choose a published book for the homepage hero promotion, or select another card type." });
      return false;
    }
    const featuredSectionEnabled = content.settings.homepageSections.find((section) => section.id === "featured-book")?.enabled;
    const homepageFeaturedBook = content.books.find((book) => book.id === content.settings.homepageFeaturedBookId);
    if (featuredSectionEnabled && (!homepageFeaturedBook || !homepageFeaturedBook.published)) {
      setNotice({ kind: "error", message: "Choose a published book for the homepage featured-book section, or hide that section." });
      return false;
    }
    const incompleteBook = content.books.find((book) => book.published && ((book.availability === "paid" && !(book.retailers ?? []).some((retailer) => retailer.name.trim() && /^https?:\/\//i.test(retailer.url))) || (book.availability === "free" && !book.downloadUrl.trim())));
    if (incompleteBook) {
      setNotice({ kind: "error", message: `${incompleteBook.title} cannot be published until its ${incompleteBook.availability === "free" ? "download file or URL" : "retailer name and valid purchase URL"} is provided.` });
      return false;
    }
    setSaving(true);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(content),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Content could not be saved.");
      setNotice({ kind: "success", message: "All changes are live on the website." });
      setDirty(false);
      return true;
    } catch (error) {
      setNotice({ kind: "error", message: error instanceof Error ? error.message : "Content could not be saved." });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveAndClose(collection: CollectionKey) {
    if (await save()) setEditing((current) => ({ ...current, [collection]: null }));
  }

  async function logout() {
    if (dirty && !window.confirm("You have unsaved content changes. Sign out and discard them?")) return;
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  function updateInquiry(id: string, changes: Partial<CmsSubmissions["inquiries"][number]>) {
    setSubmissions((current) => current && { ...current, inquiries: current.inquiries.map((item) => item.id === id ? { ...item, ...changes } : item) });
  }

  function updateSubscriber(id: string, changes: Partial<CmsSubmissions["subscribers"][number]>) {
    setSubmissions((current) => current && { ...current, subscribers: current.subscribers.map((item) => item.id === id ? { ...item, ...changes } : item) });
  }

  async function persistSubmission(collection: keyof CmsSubmissions, id: string, changes: { status?: string; note?: string }) {
    const response = await fetch("/api/admin/submissions", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ collection, id, ...changes }) });
    const result = (await response.json()) as { error?: string };
    setNotice(response.ok ? { kind: "success", message: "Inbox entry updated." } : { kind: "error", message: result.error || "The entry could not be updated." });
  }

  async function removeSubmission(collection: keyof CmsSubmissions, id: string) {
    if (!window.confirm("Permanently delete this entry?")) return;
    const response = await fetch("/api/admin/submissions", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ collection, id }) });
    if (!response.ok) return setNotice({ kind: "error", message: "The entry could not be deleted." });
    setSubmissions((current) => current && { ...current, [collection]: current[collection].filter((item) => item.id !== id) });
    setNotice({ kind: "success", message: "Inbox entry deleted." });
  }

  function selectTab(nextTab: Tab) {
    setTab(nextTab);
    setMobileOpen(false);
    setNotice(null);
  }

  const selectedInquiry = submissions?.inquiries.find((item) => item.id === selectedInquiryId) ?? null;
  const selectedSubscriber = submissions?.subscribers.find((item) => item.id === selectedSubscriberId) ?? null;

  if (!content || !submissions) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f7f1e8] text-burgundy"><LoaderCircle className="size-8 animate-spin" /><span className="ml-3 font-semibold">Loading CMS…</span></div>;
  }

  const sidebar = (
    <>
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-6">
        <div><p className="font-display text-xl text-cream">WriteNow CMS</p><p className="mt-1 text-[0.65rem] uppercase tracking-[0.18em] text-gold">Content studio</p></div>
        <button type="button" onClick={() => setMobileOpen(false)} className="p-2 text-cream lg:hidden"><X className="size-5" /></button>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return <button key={item.id} type="button" onClick={() => selectTab(item.id)} className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${tab === item.id ? "bg-cream text-burgundy" : "text-cream/70 hover:bg-white/8 hover:text-cream"}`}><Icon className="size-4" />{item.label}</button>;
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
        <Link href="/" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-cream/70 transition hover:bg-white/8 hover:text-cream"><ExternalLink className="size-4" />View website</Link>
        <button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-cream/70 transition hover:bg-white/8 hover:text-cream"><LogOut className="size-4" />Sign out</button>
      </div>
    </>
  );

  return (
    <main className="min-h-screen bg-[#f7f1e8] text-charcoal">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-charcoal lg:flex">{sidebar}</aside>
      {mobileOpen && <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-charcoal shadow-2xl lg:hidden">{sidebar}</aside>}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex min-h-20 items-center justify-between border-b border-charcoal/10 bg-[#f7f1e8]/95 px-5 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3"><button type="button" onClick={() => setMobileOpen(true)} className="rounded-full border border-charcoal/15 p-2 lg:hidden"><Menu className="size-5" /></button><div><div className="flex items-center gap-2"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-burgundy">Keisha WriteNow Allen</p>{dirty && <span className="rounded-full bg-gold/25 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-burgundy">Unsaved</span>}</div><h1 className="font-display text-2xl capitalize sm:text-3xl">{navItems.find((item) => item.id === tab)?.label}</h1></div></div>
          {tab !== "inquiries" && tab !== "subscribers" && tab !== "orders" && tab !== "payments" && <button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-burgundy px-5 py-2.5 text-sm font-semibold text-cream transition hover:bg-charcoal disabled:opacity-60">{saving ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}<span className="hidden sm:inline">Save changes</span></button>}
        </header>

        <div className="mx-auto max-w-6xl p-5 sm:p-8 lg:p-10">
          {notice && <div className={`mb-6 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold ${notice.kind === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>{notice.kind === "success" ? <Check className="size-4" /> : <X className="size-4" />}{notice.message}</div>}

          {tab === "overview" && <section>
            <div className="rounded-3xl bg-burgundy p-7 text-cream sm:p-10"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Content at a glance</p><h2 className="mt-4 max-w-2xl font-display text-4xl leading-tight sm:text-5xl">Manage the stories, books, appearances, and details readers see.</h2><p className="mt-5 max-w-2xl text-sm leading-7 text-cream/70">Choose a content area, make your changes, then use Save changes. Draft entries stay hidden until you mark them published.</p></div>
            <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{counts.map((item) => { const Icon = item.icon; return <button key={item.label} type="button" onClick={() => selectTab(item.tab)} className="rounded-2xl border border-charcoal/10 bg-[#fffdf9] p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-burgundy/30"><Icon className="size-5 text-burgundy" /><span className="mt-8 block font-display text-5xl">{item.value}</span><span className="mt-1 block text-sm font-semibold text-charcoal/55">{item.label}</span></button>; })}</div>
          </section>}

          {tab === "books" && <section><CollectionHeader title="Books" copy="Manage book covers, descriptions, categories, prices, and publishing status." onAdd={() => addItem("books")} />
            <AdminTable headers={["Book", "Category", "Access", "Price", "Status", "Actions"]} empty="No books have been added yet." rows={content.books.map((book, index) => ({ id: book.id, cells: [<TableIdentity key="book" image={book.cover} title={book.title} detail={`/${book.slug}`} />, book.category || "—", <BookAccessBadge key="access" availability={book.availability ?? "coming-soon"} storeCount={book.retailers?.length ?? 0} />, book.availability === "free" ? "Free" : book.price || "—", <StatusBadge key="status" published={book.published} />, <TableActions key="actions" onEdit={() => setEditing((current) => ({ ...current, books: index }))} onDelete={() => removeItem("books", index)} />] }))} />
            {editing.books !== null && content.books[editing.books] && <div className="mt-7"><EditorCard title={content.books[editing.books].title} subtitle={content.books[editing.books].published ? "Published" : "Draft"} onDelete={() => removeItem("books", editing.books as number)} onClose={() => setEditing((current) => ({ ...current, books: null }))} onSave={() => void saveAndClose("books")} saving={saving}>
              <Field label="Title" value={content.books[editing.books].title} onChange={(value) => updateItem("books", editing.books as number, { title: value })} /><Field label="URL slug" value={content.books[editing.books].slug} onChange={(value) => updateItem("books", editing.books as number, { slug: value })} />
              <Field label="Category" value={content.books[editing.books].category} onChange={(value) => updateItem("books", editing.books as number, { category: value })} /><Field label="Price" value={content.books[editing.books].price} onChange={(value) => updateItem("books", editing.books as number, { price: value })} />
              <label className={labelClass}>How readers get this book<select className={inputClass} value={content.books[editing.books].availability ?? "coming-soon"} onChange={(event) => updateItem("books", editing.books as number, { availability: event.target.value as CmsBook["availability"] })}><option value="paid">Paid — show Buy button</option><option value="free">Free — show Download button</option><option value="coming-soon">Coming soon — no transaction yet</option></select></label><div />
              {content.books[editing.books].availability === "paid" && <div className="sm:col-span-2"><RetailerEditor retailers={content.books[editing.books].retailers ?? []} onChange={(retailers) => updateItem("books", editing.books as number, { retailers, purchaseUrl: retailers[0]?.url ?? "" })} /></div>}
              {content.books[editing.books].availability === "free" && <><div className="sm:col-span-2"><AdminBookFileUploader value={content.books[editing.books].downloadUrl ?? ""} onChange={(downloadUrl) => updateItem("books", editing.books as number, { downloadUrl })} /></div><div className="sm:col-span-2"><Field label="Or use an existing download URL" type="url" placeholder="https://… or /downloads/…" value={content.books[editing.books].downloadUrl ?? ""} onChange={(value) => updateItem("books", editing.books as number, { downloadUrl: value })} /></div></>}
              <div className="sm:col-span-2"><AdminImageUploader label="Book cover" images={content.books[editing.books].cover ? [content.books[editing.books].cover] : []} onChange={(images) => updateItem("books", editing.books as number, { cover: images[0] ?? "" })} /></div><div className="sm:col-span-2"><AdminImageUploader label="Book gallery" multiple images={content.books[editing.books].gallery ?? []} onChange={(gallery) => updateItem("books", editing.books as number, { gallery })} /></div>
              <div className="sm:col-span-2"><TextareaField label="Card description" value={content.books[editing.books].shortDescription} onChange={(value) => updateItem("books", editing.books as number, { shortDescription: value })} /></div><div className="sm:col-span-2"><TextareaField label="Full description" rows={7} value={content.books[editing.books].description} onChange={(value) => updateItem("books", editing.books as number, { description: value })} /></div><div className="sm:col-span-2"><PublishedToggle checked={content.books[editing.books].published} onChange={(published) => updateItem("books", editing.books as number, { published })} /></div>
            </EditorCard></div>}
          </section>}

          {tab === "merch" && <section>
            <CollectionHeader title="Merch" copy="Manage the coming-soon message now, then add, update, publish, or remove products whenever the shop is ready." onAdd={() => addItem("merch")} />
            <div className="mt-7 rounded-2xl border border-gold/35 bg-[#fff8e9] p-5 sm:p-6">
              <div><p className="font-display text-2xl">Merch page introduction</p><p className="mt-1 text-sm leading-6 text-charcoal/55">This message is shown above products. When no products are published, it becomes the complete Coming Soon page.</p></div>
              <div className="mt-6 grid gap-5 border-t border-charcoal/10 pt-6 sm:grid-cols-2">
                <Field label="Small heading" maxLength={30} value={content.settings.merchEyebrow} onChange={(value) => updateSettings("merchEyebrow", value)} />
                <Field label="Coming-soon label" maxLength={30} value={content.settings.merchComingSoonLabel} onChange={(value) => updateSettings("merchComingSoonLabel", value)} />
                <div className="sm:col-span-2"><Field label="Main heading" maxLength={90} value={content.settings.merchTitle} onChange={(value) => updateSettings("merchTitle", value)} /></div>
                <div className="sm:col-span-2"><TextareaField label="Introduction" rows={5} maxLength={300} value={content.settings.merchDescription} onChange={(value) => updateSettings("merchDescription", value)} /></div>
              </div>
            </div>
            <AdminTable headers={["Product", "Category", "Price", "Shop link", "Status", "Actions"]} empty="No products yet. The public Merch page is showing the Coming Soon message." rows={content.merch.map((product, index) => ({ id: product.id, cells: [<TableIdentity key="merch" image={product.image} title={product.name} detail={product.shortDescription || "No description"} />, product.category, product.price || "—", <span key="link" className={`text-xs font-semibold ${product.buyUrl ? "text-emerald-700" : "text-charcoal/40"}`}>{product.buyUrl ? "Link added" : "No link"}</span>, <StatusBadge key="status" published={product.published} />, <TableActions key="actions" onEdit={() => setEditing((current) => ({ ...current, merch: index }))} onDelete={() => removeItem("merch", index)} />] }))} />
            {editing.merch !== null && content.merch[editing.merch] && <div className="mt-7"><EditorCard title={content.merch[editing.merch].name} subtitle={content.merch[editing.merch].published ? "Published product" : "Draft product"} onDelete={() => removeItem("merch", editing.merch as number)} onClose={() => setEditing((current) => ({ ...current, merch: null }))} onSave={() => void saveAndClose("merch")} saving={saving}>
              <Field label="Product name" value={content.merch[editing.merch].name} onChange={(value) => updateItem("merch", editing.merch as number, { name: value })} />
              <label className={labelClass}>Product type<select className={inputClass} value={content.merch[editing.merch].category} onChange={(event) => updateItem("merch", editing.merch as number, { category: event.target.value as CmsMerchCategory })}>{CMS_MERCH_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
              <Field label="Price" placeholder="$24.99" value={content.merch[editing.merch].price} onChange={(value) => updateItem("merch", editing.merch as number, { price: value })} />
              <Field label="Button text" placeholder="Shop Now" maxLength={30} value={content.merch[editing.merch].buttonText} onChange={(value) => updateItem("merch", editing.merch as number, { buttonText: value })} />
              <div className="sm:col-span-2"><TextareaField label="Short description" rows={4} maxLength={220} value={content.merch[editing.merch].shortDescription} onChange={(value) => updateItem("merch", editing.merch as number, { shortDescription: value })} /></div>
              <div className="sm:col-span-2 rounded-xl border-2 border-gold/35 bg-[#fff8e9] p-5"><Field label="Shop or buy link" type="url" placeholder="https://…" value={content.merch[editing.merch].buyUrl} onChange={(value) => updateItem("merch", editing.merch as number, { buyUrl: value })} /><p className="mt-2 text-xs normal-case leading-5 tracking-normal text-charcoal/50">Paste the full product checkout or shop link. It must begin with http:// or https://.</p></div>
              <div className="sm:col-span-2"><AdminImageUploader label="Product image" images={content.merch[editing.merch].image ? [content.merch[editing.merch].image] : []} onChange={(images) => updateItem("merch", editing.merch as number, { image: images[0] ?? "" })} /></div>
              <div className="sm:col-span-2"><PublishedToggle checked={content.merch[editing.merch].published} onChange={(published) => updateItem("merch", editing.merch as number, { published })} /></div>
            </EditorCard></div>}
          </section>}

          {tab === "news" && <section><CollectionHeader title="News" copy="Publish announcements, journal entries, book updates, and writing reflections." onAdd={() => addItem("news")} /><AdminTable headers={["Article", "Date", "Status", "Actions"]} empty="No news posts have been added yet." rows={content.news.map((item, index) => ({ id: item.id, cells: [<TableIdentity key="news" image={item.image} title={item.title} detail={`/${item.slug}`} />, item.date || "—", <StatusBadge key="status" published={item.published} />, <TableActions key="actions" onEdit={() => setEditing((current) => ({ ...current, news: index }))} onDelete={() => removeItem("news", index)} />] }))} />
            {editing.news !== null && content.news[editing.news] && <div className="mt-7"><EditorCard title={content.news[editing.news].title} subtitle={content.news[editing.news].published ? "Published" : "Draft"} onDelete={() => removeItem("news", editing.news as number)} onClose={() => setEditing((current) => ({ ...current, news: null }))} onSave={() => void saveAndClose("news")} saving={saving}>
              <Field label="Title" value={content.news[editing.news].title} onChange={(value) => updateItem("news", editing.news as number, { title: value })} /><Field label="URL slug" value={content.news[editing.news].slug} onChange={(value) => updateItem("news", editing.news as number, { slug: value })} /><Field label="Date" type="date" value={content.news[editing.news].date} onChange={(value) => updateItem("news", editing.news as number, { date: value })} /><div />
              <div className="sm:col-span-2"><TextareaField label="Excerpt" value={content.news[editing.news].excerpt} onChange={(value) => updateItem("news", editing.news as number, { excerpt: value })} /></div><div className="sm:col-span-2"><TextareaField label="Article body" rows={9} value={content.news[editing.news].body} onChange={(value) => updateItem("news", editing.news as number, { body: value })} /></div><div className="sm:col-span-2"><AdminImageUploader label="Featured image" images={content.news[editing.news].image ? [content.news[editing.news].image] : []} onChange={(images) => updateItem("news", editing.news as number, { image: images[0] ?? "" })} /></div><div className="sm:col-span-2"><AdminImageUploader label="Article gallery" multiple images={content.news[editing.news].gallery ?? []} onChange={(gallery) => updateItem("news", editing.news as number, { gallery })} /></div><div className="sm:col-span-2"><PublishedToggle checked={content.news[editing.news].published} onChange={(published) => updateItem("news", editing.news as number, { published })} /></div>
            </EditorCard></div>}
          </section>}

          {tab === "events" && <section><CollectionHeader title="Events" copy="Manage appearances, readings, book clubs, and speaking engagements." onAdd={() => addItem("events")} /><AdminTable headers={["Event", "Date", "Location", "Status", "Actions"]} empty="No events have been added yet." rows={content.events.map((item, index) => ({ id: item.id, cells: [<TableIdentity key="event" image={item.image} title={item.title} detail={item.description.slice(0, 60)} />, item.date ? new Date(item.date).toLocaleDateString() : "TBA", item.location || "—", <StatusBadge key="status" published={item.published} />, <TableActions key="actions" onEdit={() => setEditing((current) => ({ ...current, events: index }))} onDelete={() => removeItem("events", index)} />] }))} />
            {editing.events !== null && content.events[editing.events] && <div className="mt-7"><EditorCard title={content.events[editing.events].title} subtitle={content.events[editing.events].published ? "Published" : "Draft"} onDelete={() => removeItem("events", editing.events as number)} onClose={() => setEditing((current) => ({ ...current, events: null }))} onSave={() => void saveAndClose("events")} saving={saving}>
              <Field label="Event title" value={content.events[editing.events].title} onChange={(value) => updateItem("events", editing.events as number, { title: value })} /><Field label="Date and time" type="datetime-local" value={content.events[editing.events].date} onChange={(value) => updateItem("events", editing.events as number, { date: value })} /><div className="sm:col-span-2"><Field label="Location" value={content.events[editing.events].location} onChange={(value) => updateItem("events", editing.events as number, { location: value })} /></div><div className="sm:col-span-2"><TextareaField label="Description" rows={6} value={content.events[editing.events].description} onChange={(value) => updateItem("events", editing.events as number, { description: value })} /></div><div className="sm:col-span-2"><AdminImageUploader label="Event image" images={content.events[editing.events].image ? [content.events[editing.events].image] : []} onChange={(images) => updateItem("events", editing.events as number, { image: images[0] ?? "" })} /></div><div className="sm:col-span-2"><AdminImageUploader label="Event gallery" multiple images={content.events[editing.events].gallery ?? []} onChange={(gallery) => updateItem("events", editing.events as number, { gallery })} /></div><div className="sm:col-span-2"><PublishedToggle checked={content.events[editing.events].published} onChange={(published) => updateItem("events", editing.events as number, { published })} /></div>
            </EditorCard></div>}
          </section>}

          {tab === "media" && <section><CollectionHeader title="Media + Press" copy="Add and edit interviews, features, appearances, videos, podcasts, press releases, and press kits." onAdd={() => addItem("media")} />
            <div className="mt-7 rounded-2xl border border-gold/35 bg-[#fff8e9] p-5 sm:p-6">
              <div><p className="font-display text-2xl">What would you like to add?</p><p className="mt-1 text-sm leading-6 text-charcoal/55">Choose a category. A new draft will open with the correct public button text already filled in.</p></div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {CMS_MEDIA_CATEGORIES.map((category) => <button key={category} type="button" onClick={() => addItem("media", category)} className="flex items-center justify-between gap-3 rounded-xl border border-charcoal/10 bg-white px-4 py-3 text-left text-sm font-semibold text-charcoal transition hover:border-burgundy/35 hover:text-burgundy"><span>{category}</span><span className="inline-flex items-center gap-1 text-xs text-charcoal/40"><Plus className="size-3.5" />{content.media.filter((item) => item.type === category).length}</span></button>)}
              </div>
            </div>
            <AdminTable headers={["Media item", "Category", "Outlet", "Public link", "Status", "Actions"]} empty="No media or press items have been added yet." rows={content.media.map((item, index) => ({ id: item.id, cells: [<TableIdentity key="media" image={item.image} title={item.title} detail={item.date || "No date"} />, item.type || "—", item.outlet || "—", <span key="link" className={`text-xs font-semibold ${item.mediaUrl ? "text-emerald-700" : "text-charcoal/40"}`}>{item.mediaUrl ? "Link added" : "No link"}</span>, <StatusBadge key="status" published={item.published} />, <TableActions key="actions" onEdit={() => setEditing((current) => ({ ...current, media: index }))} onDelete={() => removeItem("media", index)} />] }))} />
            {editing.media !== null && content.media[editing.media] && <div className="mt-7"><EditorCard title={content.media[editing.media].title} subtitle={content.media[editing.media].published ? "Published" : "Draft"} onDelete={() => removeItem("media", editing.media as number)} onClose={() => setEditing((current) => ({ ...current, media: null }))} onSave={() => void saveAndClose("media")} saving={saving}>
              <Field label="Public title" value={content.media[editing.media].title} onChange={(value) => updateItem("media", editing.media as number, { title: value })} />
              <label className={labelClass}>Category<select className={inputClass} value={content.media[editing.media].type} onChange={(event) => { const type = event.target.value as CmsMediaCategory; updateItem("media", editing.media as number, { type, mediaCtaLabel: mediaCategoryActionLabels[type] }); }}>{CMS_MEDIA_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
              <Field label="Outlet, show, or publication name" value={content.media[editing.media].outlet} onChange={(value) => updateItem("media", editing.media as number, { outlet: value })} />
              <Field label="Published or appearance date" type="date" value={content.media[editing.media].date} onChange={(value) => updateItem("media", editing.media as number, { date: value })} />
              <div className="sm:col-span-2 grid gap-5 rounded-xl border-2 border-gold/35 bg-[#fff8e9] p-5 sm:grid-cols-2"><div className="sm:col-span-2"><p className="font-display text-xl text-charcoal">Public watch, listen, read, or download link</p><p className="mt-1 text-xs normal-case leading-5 tracking-normal text-charcoal/55">Paste the full link readers should open. This can be YouTube, a podcast platform, an article, a press release, or a press-kit download.</p></div><Field label="Public link" type="url" placeholder="https://…" value={content.media[editing.media].mediaUrl ?? ""} onChange={(value) => updateItem("media", editing.media as number, { mediaUrl: value })} /><Field label="Button text" placeholder={mediaCategoryActionLabels[content.media[editing.media].type]} value={content.media[editing.media].mediaCtaLabel ?? ""} onChange={(value) => updateItem("media", editing.media as number, { mediaCtaLabel: value })} /></div>
              <div className="sm:col-span-2"><TextareaField label="Public description" rows={6} value={content.media[editing.media].summary} onChange={(value) => updateItem("media", editing.media as number, { summary: value })} /></div>
              <div className="sm:col-span-2"><AdminImageUploader label="Main image" images={content.media[editing.media].image ? [content.media[editing.media].image] : []} onChange={(images) => updateItem("media", editing.media as number, { image: images[0] ?? "" })} /></div>
              <div className="sm:col-span-2"><AdminImageUploader label="Additional images" multiple images={content.media[editing.media].gallery ?? []} onChange={(gallery) => updateItem("media", editing.media as number, { gallery })} /></div>
              <div className="sm:col-span-2"><PublishedToggle checked={content.media[editing.media].published} onChange={(published) => updateItem("media", editing.media as number, { published })} /></div>
            </EditorCard></div>}
          </section>}

          {tab === "orders" && <section>
            <InboxHeader title="Merch orders" copy="Orders created by Stripe Checkout appear here. Payment status is updated by the Stripe webhook." count={orders.length} />
            <AdminTable headers={["Order", "Customer", "Total", "Received", "Status"]} empty="No merchandise orders have been created yet." rows={orders.map((order) => ({ id: order.id, cells: [<div key="order"><p className="font-semibold">{order.items.map((item) => `${item.quantity}× ${item.name}`).join(", ") || "Merch order"}</p><p className="mt-1 text-xs text-charcoal/40">{order.id.slice(0, 8).toUpperCase()}</p></div>, <div key="customer"><p className="font-semibold">{order.customerName || "Awaiting payment"}</p><p className="mt-1 text-xs text-charcoal/45">{order.customerEmail || "—"}</p></div>, new Intl.NumberFormat("en-US", { style: "currency", currency: (order.currency || "usd").toUpperCase() }).format((order.amountTotal || 0) / 100), new Date(order.createdAt).toLocaleString(), <label key="status" className={labelClass}><span className="sr-only">Order status</span><select className={`${inputClass} mt-0 min-w-36`} value={order.status} onChange={(event) => void updateOrderStatus(order.id, event.target.value)}>{["pending", "paid", "processing", "fulfilled", "cancelled", "refunded", "payment-failed"].map((status) => <option key={status} value={status}>{status.replace("-", " ")}</option>)}</select></label>] }))} />
          </section>}

          {tab === "inquiries" && <section><InboxHeader title="Contact inquiries" copy="Messages submitted through the public contact forms appear here." count={submissions.inquiries.length} /><AdminTable headers={["Sender", "Subject", "Received", "Status", "Actions"]} empty="No contact inquiries have arrived yet." rows={submissions.inquiries.map((item) => ({ id: item.id, cells: [<div key="sender"><p className="font-semibold">{item.name}</p><p className="text-xs text-charcoal/45">{item.email}</p></div>, item.subject, new Date(item.createdAt).toLocaleDateString(), <InboxStatus key="status" status={item.status} />, <TableActions key="actions" editLabel="Open" onEdit={() => setSelectedInquiryId(item.id)} onDelete={() => void removeSubmission("inquiries", item.id)} />] }))} />
            {selectedInquiry && <article className="mt-7 rounded-2xl border border-charcoal/10 bg-[#fffdf9] p-6 shadow-sm sm:p-8"><div className="flex items-start justify-between gap-5 border-b border-charcoal/10 pb-5"><div><div className="flex flex-wrap items-center gap-3"><h3 className="font-display text-3xl">{selectedInquiry.subject}</h3><InboxStatus status={selectedInquiry.status} /></div><p className="mt-2 text-sm font-semibold text-burgundy">{selectedInquiry.name} · {selectedInquiry.email}</p><p className="mt-1 text-xs text-charcoal/45">{new Date(selectedInquiry.createdAt).toLocaleString()} · {selectedInquiry.source}</p></div><button type="button" onClick={() => setSelectedInquiryId(null)} className="rounded-full p-2 text-charcoal/45"><X className="size-4" /></button></div><p className="mt-6 whitespace-pre-wrap text-sm leading-7 text-charcoal/75">{selectedInquiry.message}</p><div className="mt-7 grid gap-5 border-t border-charcoal/10 pt-6 sm:grid-cols-[13rem_1fr_auto] sm:items-end"><label className={labelClass}>Status<select className={inputClass} value={selectedInquiry.status} onChange={(event) => { const status = event.target.value as typeof selectedInquiry.status; updateInquiry(selectedInquiry.id, { status }); void persistSubmission("inquiries", selectedInquiry.id, { status }); }}><option value="new">New</option><option value="in-progress">In progress</option><option value="resolved">Resolved</option><option value="archived">Archived</option></select></label><label className={labelClass}>Private note<input className={inputClass} value={selectedInquiry.note} onChange={(event) => updateInquiry(selectedInquiry.id, { note: event.target.value })} placeholder="Add follow-up notes…" /></label><button type="button" onClick={() => persistSubmission("inquiries", selectedInquiry.id, { note: selectedInquiry.note })} className="h-11 rounded-xl bg-charcoal px-5 text-sm font-semibold text-cream">Save note</button></div></article>}
          </section>}

          {tab === "subscribers" && <section><InboxHeader title="Newsletter subscribers" copy="Manage every email collected through the WriteNow Letter forms." count={submissions.subscribers.length} /><AdminTable headers={["Email", "Joined", "Source", "Status", "Actions"]} empty="No newsletter subscribers have joined yet." rows={submissions.subscribers.map((item) => ({ id: item.id, cells: [<p key="email" className="font-semibold">{item.email}</p>, new Date(item.createdAt).toLocaleDateString(), item.source, <InboxStatus key="status" status={item.status} />, <TableActions key="actions" onEdit={() => setSelectedSubscriberId(item.id)} onDelete={() => void removeSubmission("subscribers", item.id)} />] }))} />
            {selectedSubscriber && <article className="mt-7 rounded-2xl border border-charcoal/10 bg-[#fffdf9] p-6 shadow-sm sm:p-8"><div className="flex items-start justify-between gap-5 border-b border-charcoal/10 pb-5"><div><h3 className="break-all font-display text-3xl">{selectedSubscriber.email}</h3><p className="mt-2 text-xs text-charcoal/45">Joined {new Date(selectedSubscriber.createdAt).toLocaleString()} · {selectedSubscriber.source}</p></div><button type="button" onClick={() => setSelectedSubscriberId(null)} className="rounded-full p-2 text-charcoal/45"><X className="size-4" /></button></div><div className="mt-6 grid gap-5 sm:grid-cols-[13rem_1fr_auto] sm:items-end"><label className={labelClass}>Status<select className={inputClass} value={selectedSubscriber.status} onChange={(event) => { const status = event.target.value as typeof selectedSubscriber.status; updateSubscriber(selectedSubscriber.id, { status }); void persistSubmission("subscribers", selectedSubscriber.id, { status }); }}><option value="active">Active</option><option value="unsubscribed">Unsubscribed</option></select></label><label className={labelClass}>Private note<input className={inputClass} value={selectedSubscriber.note} onChange={(event) => updateSubscriber(selectedSubscriber.id, { note: event.target.value })} placeholder="Add a note…" /></label><button type="button" onClick={() => persistSubmission("subscribers", selectedSubscriber.id, { note: selectedSubscriber.note })} className="h-11 rounded-xl bg-charcoal px-5 text-sm font-semibold text-cream">Save note</button></div></article>}
          </section>}

          {tab === "payments" && <section>
            <div><p className="section-kicker">Secure checkout</p><h2 className="mt-3 font-display text-4xl">Payment settings</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-charcoal/60">Connect Stripe once. The Merch cart will then send customers to Stripe’s secure checkout for card payment and shipping details.</p></div>
            <div className={`mt-7 flex items-center gap-3 rounded-2xl border p-5 ${paymentSettings.ready ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-gold/40 bg-[#fff8e9] text-charcoal"}`}><span className={`grid size-10 place-items-center rounded-full ${paymentSettings.ready ? "bg-emerald-700 text-white" : "bg-gold text-charcoal"}`}>{paymentSettings.ready ? <Check className="size-5" /> : <CreditCard className="size-5" />}</span><div><p className="font-semibold">{paymentSettings.ready ? "Stripe checkout is active" : "Stripe checkout is not active yet"}</p><p className="mt-1 text-xs opacity-70">{paymentSettings.ready ? "Customers can complete real payments." : "Enter all three Stripe values below to activate payments."}</p></div></div>
            <div className="mt-5 rounded-2xl border border-charcoal/10 bg-[#fffdf9] p-6 shadow-sm sm:p-8">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2"><Field label="Stripe publishable key" type="password" placeholder="pk_test_… or pk_live_…" value={paymentSettings.publishableKey} onChange={(publishableKey) => setPaymentSettings((current) => ({ ...current, publishableKey }))} /></div>
                <Field label={paymentSettings.secretKeyConfigured ? "Stripe secret key (saved — enter only to replace)" : "Stripe secret key"} type="password" placeholder={paymentSettings.secretKeyConfigured ? "Saved securely" : "sk_test_… or sk_live_…"} value={paymentSettings.secretKey} onChange={(secretKey) => setPaymentSettings((current) => ({ ...current, secretKey }))} />
                <Field label={paymentSettings.webhookSecretConfigured ? "Webhook secret (saved — enter only to replace)" : "Webhook signing secret"} type="password" placeholder={paymentSettings.webhookSecretConfigured ? "Saved securely" : "whsec_…"} value={paymentSettings.webhookSecret} onChange={(webhookSecret) => setPaymentSettings((current) => ({ ...current, webhookSecret }))} />
                <div className="sm:col-span-2 rounded-xl border border-charcoal/10 bg-white p-5"><p className="text-xs font-bold uppercase tracking-[0.12em] text-charcoal/55">Stripe webhook endpoint</p><code className="mt-3 block overflow-x-auto bg-charcoal px-4 py-3 text-sm text-cream">/api/stripe/webhook</code><p className="mt-3 text-sm leading-6 text-charcoal/60">In Stripe, create a webhook using your website domain followed by this path. Listen for <strong>checkout.session.completed</strong> and copy its signing secret here.</p></div>
              </div>
              <div className="mt-7 flex justify-end border-t border-charcoal/10 pt-5"><button type="button" onClick={() => void savePaymentConfiguration()} disabled={paymentSaving} className="inline-flex items-center gap-2 rounded-full bg-burgundy px-6 py-3 text-sm font-semibold text-cream disabled:opacity-60">{paymentSaving ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}Save payment settings</button></div>
            </div>
            <div className="mt-5 rounded-2xl border border-charcoal/10 bg-white p-5 text-sm leading-6 text-charcoal/60"><strong className="text-charcoal">Security:</strong> secret and webhook keys are encrypted before database storage and are never returned to this browser after saving. Stripe—not this website—collects card details.</div>
          </section>}

          {tab === "settings" && <section><div><p className="section-kicker">Website editor</p><h2 className="mt-3 font-display text-4xl">Website content</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-charcoal/60">Choose the part of the website you want to change, update the words or images, then click <strong>Save changes</strong>.</p></div>
          <div className="mt-7 rounded-2xl border border-gold/40 bg-[#fff8e9] p-5 sm:p-6">
            <p className="text-sm font-bold text-burgundy">How to update the homepage</p>
            <ol className="mt-3 grid gap-3 text-sm leading-6 text-charcoal/65 sm:grid-cols-3">
              <li><strong className="text-charcoal">1. Choose a section</strong><br />Use the links below or scroll down.</li>
              <li><strong className="text-charcoal">2. Edit its content</strong><br />Open a card and change only what you need.</li>
              <li><strong className="text-charcoal">3. Save your work</strong><br />Use Save changes at the top of the screen.</li>
            </ol>
          </div>
          <nav aria-label="Jump to homepage editor section" className="mt-5 flex flex-wrap gap-2">
            {[
              ["#homepage-arrangement", "Order & visibility"],
              ["#homepage-hero", "Hero"],
              ["#homepage-about", "About & numbers"],
              ["#homepage-books", "Books"],
              ["#homepage-creative", "Creative roles"],
              ["#homepage-featured-book", "Featured book"],
              ["#homepage-merch", "Merch"],
              ["#homepage-connect", "Connect & contact"],
              ["#homepage-newsletter", "Newsletter"],
              ["#media-press-page", "Media + press page"],
              ["#website-basics", "Website & social links"],
              ["#about-page", "About page"],
            ].map(([href, label]) => <a key={href} href={href} className="rounded-full border border-charcoal/15 bg-white px-4 py-2 text-xs font-semibold text-charcoal transition hover:border-burgundy hover:text-burgundy">{label}</a>)}
          </nav>
          <div className="mt-7 grid gap-5">
            <SettingsEditorCard id="homepage-arrangement" title="Homepage order and visibility" description="Move whole sections up or down, or hide a section without deleting its content." defaultOpen>
              <div className="space-y-2">
                {content.settings.homepageSections.map((section, index) => (
                  <div key={section.id} onDragOver={(event) => event.preventDefault()} onDrop={() => dropHomepageSection(section.id)} className={`flex items-center gap-3 rounded-xl border px-3 py-3 transition ${draggedHomepageSection === section.id ? "border-burgundy/40 bg-dusty-rose/15 opacity-60" : "border-charcoal/10 bg-[#fffdf9]"}`}>
                    <button type="button" draggable onDragStart={() => setDraggedHomepageSection(section.id)} onDragEnd={() => setDraggedHomepageSection(null)} className="cursor-grab rounded-lg p-2 text-charcoal/35 hover:bg-charcoal/5 hover:text-charcoal active:cursor-grabbing" aria-label={`Drag ${homepageSectionLabels[section.id]}`}><GripVertical className="size-5" /></button>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold normal-case tracking-normal text-charcoal">{homepageSectionLabels[section.id]}</p><p className="mt-0.5 text-xs normal-case tracking-normal text-charcoal/45">Position {index + 1}</p></div>
                    <div className="flex items-center gap-1">
                      <button type="button" disabled={index === 0} onClick={() => moveHomepageSection(section.id, index - 1)} className="rounded-lg p-2 text-charcoal/45 hover:bg-charcoal/5 disabled:opacity-25" aria-label={`Move ${homepageSectionLabels[section.id]} up`}><ChevronUp className="size-4" /></button>
                      <button type="button" disabled={index === content.settings.homepageSections.length - 1} onClick={() => moveHomepageSection(section.id, index + 1)} className="rounded-lg p-2 text-charcoal/45 hover:bg-charcoal/5 disabled:opacity-25" aria-label={`Move ${homepageSectionLabels[section.id]} down`}><ChevronDown className="size-4" /></button>
                      <button type="button" onClick={() => toggleHomepageSection(section.id)} className={`ml-1 inline-flex min-w-24 items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-semibold normal-case tracking-normal ${section.enabled ? "bg-emerald-50 text-emerald-700" : "bg-charcoal/5 text-charcoal/50"}`}>{section.enabled ? <Eye className="size-4" /> : <EyeOff className="size-4" />}{section.enabled ? "Visible" : "Hidden"}</button>
                    </div>
                  </div>
                ))}
              </div>
            </SettingsEditorCard>
            <SettingsEditorCard id="homepage-hero" number={1} title="Hero — top of the homepage" description="Edit the first words, main background image, and the book or newsletter card visitors see first." defaultOpen>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Small text above the heading" value={content.settings.heroEyebrow} onChange={(value) => updateSettings("heroEyebrow", value)} />
                <Field label="Main heading" value={content.settings.heroTitle} onChange={(value) => updateSettings("heroTitle", value)} />
                <Field label="Italic line in the heading" value={content.settings.heroAccent} onChange={(value) => updateSettings("heroAccent", value)} />
                <Field label="About button text" maxLength={30} value={content.settings.heroAboutCtaLabel} onChange={(value) => updateSettings("heroAboutCtaLabel", value)} />
                <div className="sm:col-span-2"><TextareaField label="Short introduction on the right" rows={5} value={content.settings.heroBio} onChange={(value) => updateSettings("heroBio", value)} /></div>
                <div className="sm:col-span-2"><AdminImageUploader label="Hero background image" images={content.settings.heroImage ? [content.settings.heroImage] : []} onChange={(images) => updateSettings("heroImage", images[0] ?? "")} /></div>
                <div className="sm:col-span-2 rounded-xl border border-charcoal/10 bg-[#fffaf1] p-5">
                  <p className="font-semibold text-charcoal">Card shown inside the hero</p>
                  <p className="mt-1 text-xs normal-case leading-5 tracking-normal text-charcoal/50">Choose a signed-book card, a newsletter signup card, or hide the card completely.</p>
                  <label className={`${labelClass} mt-5 block`}>Card type<select className={inputClass} value={content.settings.heroPromotionType} onChange={(event) => updateSettings("heroPromotionType", event.target.value as CmsSettings["heroPromotionType"])}><option value="book">Signed book</option><option value="newsletter">Newsletter signup</option><option value="none">No card</option></select></label>
                  {content.settings.heroPromotionType === "book" && <div className="mt-5 grid gap-5 sm:grid-cols-2"><label className={labelClass}>Book to feature<select className={inputClass} value={content.settings.heroFeatureBookId} onChange={(event) => updateSettings("heroFeatureBookId", event.target.value)}><option value="">Choose a published book</option>{content.books.filter((book) => book.published).map((book) => <option key={book.id} value={book.id}>{book.title}</option>)}</select></label><Field label="Small text above book title" value={content.settings.heroFeatureEyebrow} onChange={(value) => updateSettings("heroFeatureEyebrow", value)} /><div className="sm:col-span-2"><Field label="Button text" value={content.settings.heroFeatureCtaLabel} onChange={(value) => updateSettings("heroFeatureCtaLabel", value)} /></div></div>}
                  {content.settings.heroPromotionType === "newsletter" && <div className="mt-5 grid gap-5 sm:grid-cols-2"><div className="sm:col-span-2"><Field label="Newsletter heading" maxLength={HERO_NEWSLETTER_LIMITS.heroNewsletterTitle} value={content.settings.heroNewsletterTitle} onChange={(value) => updateSettings("heroNewsletterTitle", value)} /></div><div className="sm:col-span-2"><TextareaField label="Newsletter description" rows={4} maxLength={HERO_NEWSLETTER_LIMITS.heroNewsletterCopy} value={content.settings.heroNewsletterCopy} onChange={(value) => updateSettings("heroNewsletterCopy", value)} /></div><div className="sm:col-span-2"><Field label="Signup button text" maxLength={HERO_NEWSLETTER_LIMITS.heroNewsletterCtaLabel} value={content.settings.heroNewsletterCtaLabel} onChange={(value) => updateSettings("heroNewsletterCtaLabel", value)} /></div></div>}
                </div>
              </div>
            </SettingsEditorCard>
            <SettingsEditorCard id="homepage-about" number={2} title="About and experience numbers" description="Edit the introduction, portrait images, quote, and the two experience figures shown below the hero.">
              <div className="grid gap-5 sm:grid-cols-2">
                <p className="sm:col-span-2 text-xs font-bold uppercase tracking-[0.12em] text-burgundy">Experience numbers</p>
                <Field label="First statistic number" maxLength={HOMEPAGE_STAT_LIMITS.homepageStatOneValue} value={content.settings.homepageStatOneValue} onChange={(value) => updateSettings("homepageStatOneValue", value)} />
                <Field label="First statistic heading" maxLength={HOMEPAGE_STAT_LIMITS.homepageStatOneTitle} value={content.settings.homepageStatOneTitle} onChange={(value) => updateSettings("homepageStatOneTitle", value)} />
                <div className="sm:col-span-2"><TextareaField label="First statistic description" rows={3} maxLength={HOMEPAGE_STAT_LIMITS.homepageStatOneDescription} value={content.settings.homepageStatOneDescription} onChange={(value) => updateSettings("homepageStatOneDescription", value)} /></div>
                <div className="sm:col-span-2 my-1 border-t border-charcoal/10" />
                <Field label="Second statistic number" maxLength={HOMEPAGE_STAT_LIMITS.homepageStatTwoValue} value={content.settings.homepageStatTwoValue} onChange={(value) => updateSettings("homepageStatTwoValue", value)} />
                <Field label="Second statistic heading" maxLength={HOMEPAGE_STAT_LIMITS.homepageStatTwoTitle} value={content.settings.homepageStatTwoTitle} onChange={(value) => updateSettings("homepageStatTwoTitle", value)} />
                <div className="sm:col-span-2"><TextareaField label="Second statistic description" rows={3} maxLength={HOMEPAGE_STAT_LIMITS.homepageStatTwoDescription} value={content.settings.homepageStatTwoDescription} onChange={(value) => updateSettings("homepageStatTwoDescription", value)} /></div>
                <div className="sm:col-span-2 my-1 border-t border-charcoal/10" />
                <p className="sm:col-span-2 text-xs font-bold uppercase tracking-[0.12em] text-burgundy">About text and images</p>
                <Field label="Small text above the heading" maxLength={40} value={content.settings.homepageAboutKicker} onChange={(value) => updateSettings("homepageAboutKicker", value)} />
                <Field label="Read my story button text" maxLength={30} value={content.settings.homepageAboutCtaLabel} onChange={(value) => updateSettings("homepageAboutCtaLabel", value)} />
                <div className="sm:col-span-2"><TextareaField label="Main heading" rows={4} maxLength={100} value={content.settings.aboutHeading} onChange={(value) => updateSettings("aboutHeading", value)} /></div>
                <div className="sm:col-span-2"><TextareaField label="Short introduction" rows={4} maxLength={220} value={content.settings.aboutIntro} onChange={(value) => updateSettings("aboutIntro", value)} /></div>
                <div className="sm:col-span-2"><Field label="Quote shown over the second image" maxLength={90} value={content.settings.homepageAboutQuote} onChange={(value) => updateSettings("homepageAboutQuote", value)} /></div>
                <div className="sm:col-span-2"><AdminImageUploader label="Primary portrait" images={content.settings.aboutImage ? [content.settings.aboutImage] : []} onChange={(images) => updateSettings("aboutImage", images[0] ?? "")} /></div>
                <div className="sm:col-span-2"><AdminImageUploader label="Secondary quote image" images={content.settings.homepageAboutSecondaryImage ? [content.settings.homepageAboutSecondaryImage] : []} onChange={(images) => updateSettings("homepageAboutSecondaryImage", images[0] ?? "")} /></div>
              </div>
            </SettingsEditorCard>
            <SettingsEditorCard id="homepage-books" number={3} title="Books showcase" description="Edit the heading above the book cards. The books themselves are managed from Books in the left menu.">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Small text above the heading" maxLength={40} value={content.settings.homepageBooksKicker} onChange={(value) => updateSettings("homepageBooksKicker", value)} />
                <Field label="View book button text" maxLength={30} value={content.settings.homepageBooksDetailCtaLabel} onChange={(value) => updateSettings("homepageBooksDetailCtaLabel", value)} />
                <div className="sm:col-span-2"><Field label="Main heading" maxLength={80} value={content.settings.homepageBooksHeading} onChange={(value) => updateSettings("homepageBooksHeading", value)} /></div>
                <div className="sm:col-span-2"><TextareaField label="Short introduction" rows={4} maxLength={180} value={content.settings.homepageBooksIntro} onChange={(value) => updateSettings("homepageBooksIntro", value)} /></div>
              </div>
            </SettingsEditorCard>
            <SettingsEditorCard id="homepage-creative" number={4} title="Creative roles" description="Edit the four role cards. Their order and icons stay fixed so the design remains balanced.">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Small text above the heading" maxLength={40} value={content.settings.homepageCreativeKicker} onChange={(value) => updateSettings("homepageCreativeKicker", value)} />
                <Field label="Main heading" maxLength={80} value={content.settings.homepageCreativeHeading} onChange={(value) => updateSettings("homepageCreativeHeading", value)} />
                <div className="sm:col-span-2"><TextareaField label="Short introduction" rows={4} maxLength={180} value={content.settings.homepageCreativeIntro} onChange={(value) => updateSettings("homepageCreativeIntro", value)} /></div>
                {content.settings.homepageCreativeRoles.map((role) => <div key={role.id} className="grid gap-4 rounded-xl border border-charcoal/10 bg-[#fffaf9] p-4"><Field label={`${role.title || "Role"} card title`} maxLength={24} value={role.title} onChange={(value) => updateSettings("homepageCreativeRoles", content.settings.homepageCreativeRoles.map((item) => item.id === role.id ? { ...item, title: value } : item))} /><TextareaField label="Card description" rows={3} maxLength={120} value={role.copy} onChange={(value) => updateSettings("homepageCreativeRoles", content.settings.homepageCreativeRoles.map((item) => item.id === role.id ? { ...item, copy: value } : item))} /></div>)}
              </div>
            </SettingsEditorCard>
            <SettingsEditorCard id="homepage-featured-book" number={5} title="Large featured book" description="Choose which published book this banner opens, then edit the banner’s words and image.">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className={labelClass}>Book this banner opens<select className={inputClass} value={content.settings.homepageFeaturedBookId} onChange={(event) => updateSettings("homepageFeaturedBookId", event.target.value)}><option value="">Choose a published book</option>{content.books.filter((book) => book.published).map((book) => <option key={book.id} value={book.id}>{book.title}</option>)}</select></label>
                <Field label="Small text above the heading" maxLength={32} value={content.settings.homepageFeaturedBookEyebrow} onChange={(value) => updateSettings("homepageFeaturedBookEyebrow", value)} />
                <div className="sm:col-span-2"><Field label="Main heading" maxLength={90} value={content.settings.homepageFeaturedBookHeading} onChange={(value) => updateSettings("homepageFeaturedBookHeading", value)} /></div>
                <div className="sm:col-span-2"><TextareaField label="Short description" rows={5} maxLength={260} value={content.settings.homepageFeaturedBookCopy} onChange={(value) => updateSettings("homepageFeaturedBookCopy", value)} /></div>
                <Field label="Buy button text" maxLength={30} value={content.settings.homepageFeaturedBookPrimaryCtaLabel} onChange={(value) => updateSettings("homepageFeaturedBookPrimaryCtaLabel", value)} />
                <Field label="Learn more button text" maxLength={30} value={content.settings.homepageFeaturedBookSecondaryCtaLabel} onChange={(value) => updateSettings("homepageFeaturedBookSecondaryCtaLabel", value)} />
                <div className="sm:col-span-2"><Field label="Image description for screen readers" maxLength={100} value={content.settings.homepageFeaturedBookImageAlt} onChange={(value) => updateSettings("homepageFeaturedBookImageAlt", value)} /></div>
                <div className="sm:col-span-2"><AdminImageUploader label="Featured book image" images={content.settings.homepageFeaturedBookImage ? [content.settings.homepageFeaturedBookImage] : []} onChange={(images) => updateSettings("homepageFeaturedBookImage", images[0] ?? "")} /></div>
              </div>
            </SettingsEditorCard>
            <SettingsEditorCard id="homepage-merch" number={6} title="Merch section" description="Edit the homepage merch message. Product cards come from the Merch area in the left menu.">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Small text above the heading" maxLength={30} value={content.settings.merchEyebrow} onChange={(value) => updateSettings("merchEyebrow", value)} />
                <Field label="Coming-soon link text" maxLength={30} value={content.settings.merchComingSoonLabel} onChange={(value) => updateSettings("merchComingSoonLabel", value)} />
                <div className="sm:col-span-2"><Field label="Main heading" maxLength={90} value={content.settings.merchTitle} onChange={(value) => updateSettings("merchTitle", value)} /></div>
                <div className="sm:col-span-2"><TextareaField label="Short introduction" rows={5} maxLength={300} value={content.settings.merchDescription} onChange={(value) => updateSettings("merchDescription", value)} /></div>
                <div className="sm:col-span-2 rounded-xl bg-[#fffaf1] p-4 text-sm leading-6 text-charcoal/60">To add or edit products, open <strong className="text-charcoal">Merch</strong> from the left menu. The homepage automatically previews up to three published products.</div>
              </div>
            </SettingsEditorCard>
            <SettingsEditorCard id="homepage-connect" number={7} title="Connect and contact" description="Edit the three link cards and the introduction above the contact form.">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Small text above the heading" maxLength={40} value={content.settings.homepageConnectKicker} onChange={(value) => updateSettings("homepageConnectKicker", value)} />
                <Field label="Main heading" maxLength={90} value={content.settings.homepageConnectHeading} onChange={(value) => updateSettings("homepageConnectHeading", value)} />
                <div className="sm:col-span-2"><TextareaField label="Short introduction" rows={4} maxLength={200} value={content.settings.homepageConnectIntro} onChange={(value) => updateSettings("homepageConnectIntro", value)} /></div>
                <p className="sm:col-span-2 text-xs font-bold uppercase tracking-[0.12em] text-burgundy">Link cards</p>
                <Field label="Media card title" maxLength={30} value={content.settings.homepageConnectMediaTitle} onChange={(value) => updateSettings("homepageConnectMediaTitle", value)} />
                <Field label="Events card title" maxLength={30} value={content.settings.homepageConnectEventsTitle} onChange={(value) => updateSettings("homepageConnectEventsTitle", value)} />
                <div><TextareaField label="Media card description" rows={3} maxLength={120} value={content.settings.homepageConnectMediaCopy} onChange={(value) => updateSettings("homepageConnectMediaCopy", value)} /></div>
                <div><TextareaField label="Events card description" rows={3} maxLength={120} value={content.settings.homepageConnectEventsCopy} onChange={(value) => updateSettings("homepageConnectEventsCopy", value)} /></div>
                <Field label="Contact card title" maxLength={30} value={content.settings.homepageConnectContactTitle} onChange={(value) => updateSettings("homepageConnectContactTitle", value)} />
                <div><TextareaField label="Contact card description" rows={3} maxLength={120} value={content.settings.homepageConnectContactCopy} onChange={(value) => updateSettings("homepageConnectContactCopy", value)} /></div>
                <div className="sm:col-span-2 my-1 border-t border-charcoal/10" />
                <p className="sm:col-span-2 text-xs font-bold uppercase tracking-[0.12em] text-burgundy">Contact form</p>
                <Field label="Small text above the form heading" maxLength={40} value={content.settings.homepageContactKicker} onChange={(value) => updateSettings("homepageContactKicker", value)} />
                <Field label="Contact page button text" maxLength={30} value={content.settings.homepageContactCtaLabel} onChange={(value) => updateSettings("homepageContactCtaLabel", value)} />
                <div className="sm:col-span-2"><Field label="Form heading" maxLength={100} value={content.settings.homepageContactHeading} onChange={(value) => updateSettings("homepageContactHeading", value)} /></div>
                <div className="sm:col-span-2"><TextareaField label="Text above the form" rows={4} maxLength={220} value={content.settings.homepageContactCopy} onChange={(value) => updateSettings("homepageContactCopy", value)} /></div>
              </div>
            </SettingsEditorCard>
            <SettingsEditorCard id="homepage-newsletter" number={8} title="Newsletter section" description="Edit the newsletter invitation and choose whether signups stay in this admin or go to another mailing platform.">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Small text above the heading" maxLength={40} value={content.settings.homepageNewsletterKicker} onChange={(value) => updateSettings("homepageNewsletterKicker", value)} />
                <Field label="Main heading" maxLength={100} value={content.settings.newsletterTitle} onChange={(value) => updateSettings("newsletterTitle", value)} />
                <div className="sm:col-span-2"><TextareaField label="Short description" rows={4} maxLength={220} value={content.settings.newsletterCopy} onChange={(value) => updateSettings("newsletterCopy", value)} /></div>
                <div className="sm:col-span-2 my-1 border-t border-charcoal/10" />
                <div className="sm:col-span-2 rounded-xl bg-[#fffaf1] p-4 text-sm leading-6 text-charcoal/60"><strong className="text-charcoal">Where should new subscribers go?</strong><br />Leave the website link empty to save subscribers in the Newsletter area of this admin. Add a Mailchimp, Substack, ConvertKit, or similar link to send them there instead.</div>
                <Field label="External newsletter signup link (optional)" type="url" placeholder="https://…" value={content.settings.newsletterExternalUrl} onChange={(value) => updateSettings("newsletterExternalUrl", value)} />
                <Field label="External signup button text" value={content.settings.newsletterExternalLabel} onChange={(value) => updateSettings("newsletterExternalLabel", value)} />
              </div>
            </SettingsEditorCard>
            <SettingsEditorCard id="media-press-page" title="Media + press page" description="Edit the page introduction, press resources text, portrait, and button labels. Individual interviews, features, videos, podcasts, and press items are managed from Media + Press in the left menu.">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Page eyebrow" maxLength={40} value={content.settings.mediaPageEyebrow} onChange={(value) => updateSettings("mediaPageEyebrow", value)} />
                <Field label="Inquiry button text" maxLength={40} value={content.settings.mediaPageInquiryLabel} onChange={(value) => updateSettings("mediaPageInquiryLabel", value)} />
                <div className="sm:col-span-2"><Field label="Page heading" maxLength={120} value={content.settings.mediaPageTitle} onChange={(value) => updateSettings("mediaPageTitle", value)} /></div>
                <div className="sm:col-span-2"><TextareaField label="Introduction below the heading" rows={4} maxLength={260} value={content.settings.mediaPageIntro} onChange={(value) => updateSettings("mediaPageIntro", value)} /></div>
                <div className="sm:col-span-2"><AdminImageUploader label="Page hero image" images={content.settings.mediaPageHeroImage ? [content.settings.mediaPageHeroImage] : []} onChange={(images) => updateSettings("mediaPageHeroImage", images[0] ?? "")} /></div>
                <div className="sm:col-span-2"><Field label="Hero image description for screen readers" maxLength={120} value={content.settings.mediaPageHeroImageAlt} onChange={(value) => updateSettings("mediaPageHeroImageAlt", value)} /></div>
                <div className="sm:col-span-2"><AdminImageUploader label="Press resources portrait" images={content.settings.mediaPageImage ? [content.settings.mediaPageImage] : []} onChange={(images) => updateSettings("mediaPageImage", images[0] ?? "")} /></div>
                <div className="sm:col-span-2"><Field label="Portrait description for screen readers" maxLength={120} value={content.settings.mediaPageImageAlt} onChange={(value) => updateSettings("mediaPageImageAlt", value)} /></div>
                <div className="sm:col-span-2 my-1 border-t border-charcoal/10" />
                <Field label="Resources eyebrow" maxLength={40} value={content.settings.mediaPageResourcesKicker} onChange={(value) => updateSettings("mediaPageResourcesKicker", value)} />
                <Field label="Card details link text" maxLength={30} value={content.settings.mediaPageDetailLabel} onChange={(value) => updateSettings("mediaPageDetailLabel", value)} />
                <div className="sm:col-span-2"><Field label="Resources heading" maxLength={100} value={content.settings.mediaPageResourcesTitle} onChange={(value) => updateSettings("mediaPageResourcesTitle", value)} /></div>
                <div className="sm:col-span-2"><TextareaField label="Resources description" rows={5} maxLength={300} value={content.settings.mediaPageResourcesCopy} onChange={(value) => updateSettings("mediaPageResourcesCopy", value)} /></div>
                <Field label="Fallback link button text" maxLength={30} value={content.settings.mediaPageOpenLinkFallback} onChange={(value) => updateSettings("mediaPageOpenLinkFallback", value)} />
                <Field label="Back to page link text" maxLength={30} value={content.settings.mediaPageBackLabel} onChange={(value) => updateSettings("mediaPageBackLabel", value)} />
              </div>
            </SettingsEditorCard>
            <SettingsEditorCard id="website-basics" title="Website details and social media" description="Update the website name, public contact email, and social profiles shown in the navigation and footer.">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Website name" value={content.settings.siteName} onChange={(value) => updateSettings("siteName", value)} />
                <Field label="Public contact email" type="email" value={content.settings.contactEmail} onChange={(value) => updateSettings("contactEmail", value)} />
                <div className="sm:col-span-2 flex items-center justify-between gap-4 border-t border-charcoal/10 pt-5"><div><p className="font-semibold text-charcoal">Social media profiles</p><p className="mt-1 text-sm text-charcoal/55">These are the only links allowed to open outside the website.</p></div><button type="button" onClick={() => updateSettings("socialLinks", [...content.settings.socialLinks, { id: newId("social"), platform: "Instagram", url: "" } satisfies CmsSocialLink])} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-charcoal px-4 py-2 text-xs font-semibold text-cream"><Plus className="size-4" />Add profile</button></div>
                <div className="sm:col-span-2 space-y-4">
                  {content.settings.socialLinks.map((social, index) => (
                    <div key={social.id} className="grid gap-4 rounded-xl border border-charcoal/10 bg-[#fffdf9] p-4 sm:grid-cols-[3rem_11rem_1fr_auto] sm:items-end">
                      <div className="grid size-11 place-items-center rounded-xl bg-burgundy text-cream" title={`${social.platform} icon`}><SocialIcon platform={social.platform} className="size-5" /></div>
                      <label className={labelClass}>Social network<select className={inputClass} value={social.platform} onChange={(event) => updateSettings("socialLinks", content.settings.socialLinks.map((item, itemIndex) => itemIndex === index ? { ...item, platform: event.target.value as CmsSocialLink["platform"] } : item))}>{["Instagram", "Facebook", "YouTube", "TikTok", "LinkedIn", "X", "Other"].map((platform) => <option key={platform}>{platform}</option>)}</select></label>
                      <Field label="Profile link" type="url" placeholder="https://…" value={social.url} onChange={(value) => updateSettings("socialLinks", content.settings.socialLinks.map((item, itemIndex) => itemIndex === index ? { ...item, url: value } : item))} />
                      <button type="button" onClick={() => updateSettings("socialLinks", content.settings.socialLinks.filter((_, itemIndex) => itemIndex !== index))} className="mb-0.5 grid size-11 place-items-center rounded-xl border border-red-200 text-red-700 hover:bg-red-50" aria-label={`Remove ${social.platform}`}><Trash2 className="size-4" /></button>
                    </div>
                  ))}
                  {content.settings.socialLinks.length === 0 && <p className="rounded-xl border border-dashed border-charcoal/15 px-5 py-8 text-center text-sm text-charcoal/45">No social profiles are shown.</p>}
                </div>
              </div>
            </SettingsEditorCard>
          </div>

          <div id="about-page" className="mt-7 scroll-mt-28 rounded-2xl border border-charcoal/10 bg-[#fffdf9] p-6 shadow-sm sm:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="section-kicker">Separate website page</p>
                <h3 className="mt-3 font-display text-3xl">About page</h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-charcoal/60">Edit the full About page here. This is different from the shorter About section on the homepage.</p>
              </div>
              <label className="inline-flex shrink-0 cursor-pointer items-center gap-3 text-sm font-semibold text-charcoal"><input className="size-4 accent-burgundy" type="checkbox" checked={content.settings.aboutPageEnabled} onChange={(event) => updateSettings("aboutPageEnabled", event.target.checked)} />Published</label>
            </div>

            <div className="mt-6 grid gap-5 border-t border-charcoal/10 pt-6 sm:grid-cols-2">
              <div className="sm:col-span-2"><Field label="Small text above the page heading" value={content.settings.aboutPageEyebrow} onChange={(value) => updateSettings("aboutPageEyebrow", value)} /></div>
              <div className="sm:col-span-2"><Field label="Main page heading" value={content.settings.aboutPageTitle} onChange={(value) => updateSettings("aboutPageTitle", value)} /></div>
              <div className="sm:col-span-2"><TextareaField label="Introduction below the page heading" rows={4} value={content.settings.aboutPageIntro} onChange={(value) => updateSettings("aboutPageIntro", value)} /></div>
              <div className="sm:col-span-2"><Field label="Small text above the story section" value={content.settings.aboutPageKicker} onChange={(value) => updateSettings("aboutPageKicker", value)} /></div>
              <div className="sm:col-span-2"><TextareaField label="Story section heading" rows={3} value={content.settings.aboutPageHeading} onChange={(value) => updateSettings("aboutPageHeading", value)} /></div>
              <div className="sm:col-span-2"><TextareaField label="Story paragraphs" rows={12} value={content.settings.aboutPageBody} onChange={(value) => updateSettings("aboutPageBody", value)} placeholder="Type one paragraph, leave a blank line, then type the next paragraph." /></div>
              <div className="sm:col-span-2"><Field label="Portrait description for screen readers" value={content.settings.aboutPageImageAlt} onChange={(value) => updateSettings("aboutPageImageAlt", value)} /></div>
              <div className="sm:col-span-2"><AdminImageUploader label="About page portrait" images={content.settings.aboutPageImage ? [content.settings.aboutPageImage] : []} onChange={(images) => updateSettings("aboutPageImage", images[0] ?? "")} /></div>
              <Field label="First button text" value={content.settings.aboutPagePrimaryCtaLabel} onChange={(value) => updateSettings("aboutPagePrimaryCtaLabel", value)} />
              <Field label="First button page" value={content.settings.aboutPagePrimaryCtaHref} onChange={(value) => updateSettings("aboutPagePrimaryCtaHref", value)} placeholder="/books" />
              <Field label="Second button text" value={content.settings.aboutPageSecondaryCtaLabel} onChange={(value) => updateSettings("aboutPageSecondaryCtaLabel", value)} />
              <Field label="Second button page" value={content.settings.aboutPageSecondaryCtaHref} onChange={(value) => updateSettings("aboutPageSecondaryCtaHref", value)} placeholder="/contact" />
            </div>
          </div>
        </section>}
        </div>
      </div>
    </main>
  );
}

function CollectionHeader({ title, copy, onAdd }: { title: string; copy: string; onAdd: () => void }) {
  return <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="section-kicker">Content library</p><h2 className="mt-3 font-display text-4xl">{title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-charcoal/60">{copy}</p></div><button type="button" onClick={onAdd} className="inline-flex w-fit items-center gap-2 rounded-full border border-burgundy px-5 py-2.5 text-sm font-semibold text-burgundy transition hover:bg-burgundy hover:text-cream"><Plus className="size-4" />Add new</button></div>;
}

function InboxHeader({ title, copy, count }: { title: string; copy: string; count: number }) {
  return <div><p className="section-kicker">Audience inbox · {count}</p><h2 className="mt-3 font-display text-4xl">{title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-charcoal/60">{copy}</p></div>;
}

function AdminTable({ headers, rows, empty }: { headers: string[]; rows: { id: string; cells: React.ReactNode[] }[]; empty: string }) {
  return <div className="mt-7 overflow-x-auto rounded-2xl border border-charcoal/10 bg-[#fffdf9] shadow-sm"><table className="w-full min-w-[46rem] border-collapse text-left"><thead><tr className="border-b border-charcoal/10 bg-charcoal/[0.025]">{headers.map((header) => <th key={header} className="px-5 py-4 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-charcoal/45">{header}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-b border-charcoal/8 last:border-b-0 hover:bg-gold/[0.04]">{row.cells.map((cell, index) => <td key={index} className="px-5 py-4 text-sm text-charcoal/70">{cell}</td>)}</tr>)}{rows.length === 0 && <tr><td colSpan={headers.length} className="px-6 py-14 text-center font-display text-2xl text-charcoal/45">{empty}</td></tr>}</tbody></table></div>;
}

function TableIdentity({ image, title, detail }: { image?: string; title: string; detail: string }) {
  return <div className="flex min-w-56 items-center gap-3">{image ? <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-dusty-rose/20"><Image src={image} alt="" fill unoptimized className="object-cover" /></div> : <div className="grid size-12 shrink-0 place-items-center rounded-lg bg-charcoal/5"><FileText className="size-4 text-charcoal/35" /></div>}<div><p className="font-semibold text-charcoal">{title || "Untitled"}</p><p className="mt-1 max-w-56 truncate text-xs text-charcoal/40">{detail}</p></div></div>;
}

function StatusBadge({ published }: { published: boolean }) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.1em] ${published ? "bg-emerald-100 text-emerald-800" : "bg-charcoal/8 text-charcoal/55"}`}>{published ? "Published" : "Draft"}</span>;
}

function BookAccessBadge({ availability, storeCount = 0 }: { availability: CmsBook["availability"]; storeCount?: number }) {
  const styles = availability === "free" ? "bg-emerald-100 text-emerald-800" : availability === "paid" ? "bg-gold/25 text-burgundy" : "bg-charcoal/8 text-charcoal/55";
  return <span className={`inline-flex rounded-full px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.1em] ${styles}`}>{availability === "free" ? "Free download" : availability === "paid" ? `${storeCount} ${storeCount === 1 ? "store" : "stores"}` : "Coming soon"}</span>;
}

function RetailerEditor({ retailers, onChange }: { retailers: CmsBookRetailer[]; onChange: (retailers: CmsBookRetailer[]) => void }) {
  function update(index: number, changes: Partial<CmsBookRetailer>) { onChange(retailers.map((retailer, retailerIndex) => retailerIndex === index ? { ...retailer, ...changes } : retailer)); }
  function add() { onChange([...retailers, { id: newId("retailer"), name: "", url: "" }]); }
  return <div className="rounded-2xl border border-charcoal/10 bg-white p-5 sm:p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="font-display text-2xl">Retail purchase links</p><p className="mt-1 text-sm leading-6 text-charcoal/55">Readers will choose from these stores after clicking Buy now.</p></div><button type="button" onClick={add} className="inline-flex w-fit items-center gap-2 rounded-full border border-burgundy px-4 py-2 text-xs font-semibold text-burgundy hover:bg-burgundy hover:text-cream"><Plus className="size-4" />Add retailer</button></div><div className="mt-5 space-y-3">{retailers.map((retailer, index) => <div key={retailer.id} className="grid gap-3 rounded-xl border border-charcoal/10 bg-[#fffdf9] p-4 sm:grid-cols-[0.65fr_1.35fr_auto] sm:items-end"><Field label="Store name" value={retailer.name} placeholder="Amazon, Target…" onChange={(name) => update(index, { name })} /><Field label="Purchase URL" type="url" value={retailer.url} placeholder="https://…" onChange={(url) => update(index, { url })} /><button type="button" onClick={() => onChange(retailers.filter((_, retailerIndex) => retailerIndex !== index))} className="mb-1 rounded-full p-3 text-charcoal/40 hover:bg-red-50 hover:text-red-700" aria-label={`Remove ${retailer.name || "retailer"}`}><Trash2 className="size-4" /></button></div>)}{retailers.length === 0 && <button type="button" onClick={add} className="flex min-h-24 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-charcoal/20 text-sm font-semibold text-charcoal/45"><Plus className="size-4" />Add the first retailer</button>}</div></div>;
}

function InboxStatus({ status }: { status: string }) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.1em] ${status === "new" || status === "active" ? "bg-gold/25 text-burgundy" : "bg-charcoal/8 text-charcoal/55"}`}>{status.replace("-", " ")}</span>;
}

function TableActions({ onEdit, onDelete, editLabel = "Edit" }: { onEdit: () => void; onDelete: () => void; editLabel?: string }) {
  return <div className="flex items-center gap-1"><button type="button" onClick={onEdit} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-burgundy transition hover:bg-burgundy/8"><Pencil className="size-3.5" />{editLabel}</button><button type="button" onClick={onDelete} className="rounded-full p-2 text-charcoal/35 transition hover:bg-red-50 hover:text-red-700" aria-label="Delete"><Trash2 className="size-3.5" /></button></div>;
}

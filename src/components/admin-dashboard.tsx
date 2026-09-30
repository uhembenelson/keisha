"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpenText,
  CalendarDays,
  Check,
  ExternalLink,
  FileText,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  MessageSquare,
  Menu,
  Newspaper,
  Pencil,
  Plus,
  Save,
  Settings,
  Trash2,
  UserRoundCheck,
  X,
} from "lucide-react";

import type {
  CmsBook,
  CmsBookRetailer,
  CmsContent,
  CmsEvent,
  CmsMediaItem,
  CmsNewsItem,
  CmsSettings,
  CmsSubmissions,
} from "@/lib/cms-types";
import { AdminImageUploader } from "@/components/admin-image-uploader";
import { AdminBookFileUploader } from "@/components/admin-book-file-uploader";

type Tab = "overview" | "books" | "news" | "events" | "media" | "inquiries" | "subscribers" | "settings";
type CollectionKey = "books" | "news" | "events" | "media";

const navItems: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "books", label: "Books", icon: BookOpenText },
  { id: "news", label: "News", icon: Newspaper },
  { id: "events", label: "Events", icon: CalendarDays },
  { id: "media", label: "Media + Press", icon: FileText },
  { id: "inquiries", label: "Contact inquiries", icon: MessageSquare },
  { id: "subscribers", label: "Newsletter", icon: UserRoundCheck },
  { id: "settings", label: "Site settings", icon: Settings },
];

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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className={labelClass}>
      {label}
      <input
        className={inputClass}
        type={type}
        value={value}
        placeholder={placeholder}
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className={labelClass}>
      {label}
      <textarea
        className={`${inputClass} resize-y leading-6`}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
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
  const [editing, setEditing] = useState<Record<CollectionKey, number | null>>({ books: null, news: null, events: null, media: null });
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null);
  const [selectedSubscriberId, setSelectedSubscriberId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/content", { cache: "no-store" }),
      fetch("/api/admin/submissions", { cache: "no-store" }),
    ])
      .then(async ([contentResponse, submissionsResponse]) => {
        if (!contentResponse.ok || !submissionsResponse.ok) throw new Error("Could not load the CMS data.");
        return Promise.all([contentResponse.json() as Promise<CmsContent>, submissionsResponse.json() as Promise<CmsSubmissions>]);
      })
      .then(([contentData, submissionsData]) => {
        setContent(contentData);
        setSubmissions(submissionsData);
      })
      .catch((error: Error) => setNotice({ kind: "error", message: error.message }));
  }, []);

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
      { label: "News posts", value: content.news.length, tab: "news" as Tab, icon: Newspaper },
      { label: "Events", value: content.events.length, tab: "events" as Tab, icon: CalendarDays },
      { label: "Media items", value: content.media.length, tab: "media" as Tab, icon: FileText },
      { label: "New inquiries", value: submissions.inquiries.filter((item) => item.status === "new").length, tab: "inquiries" as Tab, icon: MessageSquare },
      { label: "Subscribers", value: submissions.subscribers.filter((item) => item.status === "active").length, tab: "subscribers" as Tab, icon: UserRoundCheck },
    ];
  }, [content, submissions]);

  function updateSettings<K extends keyof CmsSettings>(key: K, value: CmsSettings[K]) {
    setDirty(true);
    setContent((current) => current && { ...current, settings: { ...current.settings, [key]: value } });
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

  function addItem(collection: CollectionKey) {
    const nextIndex = content?.[collection].length ?? 0;
    setContent((current) => {
      if (!current) return current;
      const entry = {
        books: { id: newId("book"), slug: "new-book", title: "New book", category: "", price: "", availability: "coming-soon", purchaseUrl: "", retailers: [], downloadUrl: "", cover: "", gallery: [], shortDescription: "", description: "", published: false } satisfies CmsBook,
        news: { id: newId("news"), slug: "new-update", title: "New update", date: new Date().toISOString().slice(0, 10), excerpt: "", body: "", image: "", gallery: [], published: false } satisfies CmsNewsItem,
        events: { id: newId("event"), title: "New event", date: "", location: "", description: "", image: "", gallery: [], published: false } satisfies CmsEvent,
        media: { id: newId("media"), title: "New media item", type: "Interview", outlet: "", date: "", summary: "", image: "", gallery: [], published: false } satisfies CmsMediaItem,
      }[collection];
      return { ...current, [collection]: [...current[collection], entry] } as CmsContent;
    });
    setEditing((current) => ({ ...current, [collection]: nextIndex }));
    setDirty(true);
  }

  async function save() {
    if (!content) return false;
    const featuredBook = content.books.find((book) => book.id === content.settings.heroFeatureBookId);
    if (content.settings.heroFeatureEnabled && (!featuredBook || !featuredBook.published)) {
      setNotice({ kind: "error", message: "Choose a published book for the homepage hero promotion, or disable the promotion." });
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
          {tab !== "inquiries" && tab !== "subscribers" && <button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-burgundy px-5 py-2.5 text-sm font-semibold text-cream transition hover:bg-charcoal disabled:opacity-60">{saving ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}<span className="hidden sm:inline">Save changes</span></button>}
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

          {tab === "media" && <section><CollectionHeader title="Media + Press" copy="Manage interviews, press features, podcast appearances, and speaking coverage." onAdd={() => addItem("media")} /><AdminTable headers={["Feature", "Type", "Outlet", "Status", "Actions"]} empty="No media or press items have been added yet." rows={content.media.map((item, index) => ({ id: item.id, cells: [<TableIdentity key="media" image={item.image} title={item.title} detail={item.date || "No date"} />, item.type || "—", item.outlet || "—", <StatusBadge key="status" published={item.published} />, <TableActions key="actions" onEdit={() => setEditing((current) => ({ ...current, media: index }))} onDelete={() => removeItem("media", index)} />] }))} />
            {editing.media !== null && content.media[editing.media] && <div className="mt-7"><EditorCard title={content.media[editing.media].title} subtitle={content.media[editing.media].published ? "Published" : "Draft"} onDelete={() => removeItem("media", editing.media as number)} onClose={() => setEditing((current) => ({ ...current, media: null }))} onSave={() => void saveAndClose("media")} saving={saving}>
              <Field label="Title" value={content.media[editing.media].title} onChange={(value) => updateItem("media", editing.media as number, { title: value })} /><Field label="Type" value={content.media[editing.media].type} onChange={(value) => updateItem("media", editing.media as number, { type: value })} /><Field label="Outlet" value={content.media[editing.media].outlet} onChange={(value) => updateItem("media", editing.media as number, { outlet: value })} /><Field label="Date" type="date" value={content.media[editing.media].date} onChange={(value) => updateItem("media", editing.media as number, { date: value })} /><div className="sm:col-span-2"><TextareaField label="Summary" rows={6} value={content.media[editing.media].summary} onChange={(value) => updateItem("media", editing.media as number, { summary: value })} /></div><div className="sm:col-span-2"><AdminImageUploader label="Media or press image" images={content.media[editing.media].image ? [content.media[editing.media].image] : []} onChange={(images) => updateItem("media", editing.media as number, { image: images[0] ?? "" })} /></div><div className="sm:col-span-2"><AdminImageUploader label="Media gallery" multiple images={content.media[editing.media].gallery ?? []} onChange={(gallery) => updateItem("media", editing.media as number, { gallery })} /></div><div className="sm:col-span-2"><PublishedToggle checked={content.media[editing.media].published} onChange={(published) => updateItem("media", editing.media as number, { published })} /></div>
            </EditorCard></div>}
          </section>}

          {tab === "inquiries" && <section><InboxHeader title="Contact inquiries" copy="Messages submitted through the public contact forms appear here." count={submissions.inquiries.length} /><AdminTable headers={["Sender", "Subject", "Received", "Status", "Actions"]} empty="No contact inquiries have arrived yet." rows={submissions.inquiries.map((item) => ({ id: item.id, cells: [<div key="sender"><p className="font-semibold">{item.name}</p><p className="text-xs text-charcoal/45">{item.email}</p></div>, item.subject, new Date(item.createdAt).toLocaleDateString(), <InboxStatus key="status" status={item.status} />, <TableActions key="actions" editLabel="Open" onEdit={() => setSelectedInquiryId(item.id)} onDelete={() => void removeSubmission("inquiries", item.id)} />] }))} />
            {selectedInquiry && <article className="mt-7 rounded-2xl border border-charcoal/10 bg-[#fffdf9] p-6 shadow-sm sm:p-8"><div className="flex items-start justify-between gap-5 border-b border-charcoal/10 pb-5"><div><div className="flex flex-wrap items-center gap-3"><h3 className="font-display text-3xl">{selectedInquiry.subject}</h3><InboxStatus status={selectedInquiry.status} /></div><p className="mt-2 text-sm font-semibold text-burgundy">{selectedInquiry.name} · {selectedInquiry.email}</p><p className="mt-1 text-xs text-charcoal/45">{new Date(selectedInquiry.createdAt).toLocaleString()} · {selectedInquiry.source}</p></div><button type="button" onClick={() => setSelectedInquiryId(null)} className="rounded-full p-2 text-charcoal/45"><X className="size-4" /></button></div><p className="mt-6 whitespace-pre-wrap text-sm leading-7 text-charcoal/75">{selectedInquiry.message}</p><div className="mt-7 grid gap-5 border-t border-charcoal/10 pt-6 sm:grid-cols-[13rem_1fr_auto] sm:items-end"><label className={labelClass}>Status<select className={inputClass} value={selectedInquiry.status} onChange={(event) => { const status = event.target.value as typeof selectedInquiry.status; updateInquiry(selectedInquiry.id, { status }); void persistSubmission("inquiries", selectedInquiry.id, { status }); }}><option value="new">New</option><option value="in-progress">In progress</option><option value="resolved">Resolved</option><option value="archived">Archived</option></select></label><label className={labelClass}>Private note<input className={inputClass} value={selectedInquiry.note} onChange={(event) => updateInquiry(selectedInquiry.id, { note: event.target.value })} placeholder="Add follow-up notes…" /></label><button type="button" onClick={() => persistSubmission("inquiries", selectedInquiry.id, { note: selectedInquiry.note })} className="h-11 rounded-xl bg-charcoal px-5 text-sm font-semibold text-cream">Save note</button></div></article>}
          </section>}

          {tab === "subscribers" && <section><InboxHeader title="Newsletter subscribers" copy="Manage every email collected through the WriteNow Letter forms." count={submissions.subscribers.length} /><AdminTable headers={["Email", "Joined", "Source", "Status", "Actions"]} empty="No newsletter subscribers have joined yet." rows={submissions.subscribers.map((item) => ({ id: item.id, cells: [<p key="email" className="font-semibold">{item.email}</p>, new Date(item.createdAt).toLocaleDateString(), item.source, <InboxStatus key="status" status={item.status} />, <TableActions key="actions" onEdit={() => setSelectedSubscriberId(item.id)} onDelete={() => void removeSubmission("subscribers", item.id)} />] }))} />
            {selectedSubscriber && <article className="mt-7 rounded-2xl border border-charcoal/10 bg-[#fffdf9] p-6 shadow-sm sm:p-8"><div className="flex items-start justify-between gap-5 border-b border-charcoal/10 pb-5"><div><h3 className="break-all font-display text-3xl">{selectedSubscriber.email}</h3><p className="mt-2 text-xs text-charcoal/45">Joined {new Date(selectedSubscriber.createdAt).toLocaleString()} · {selectedSubscriber.source}</p></div><button type="button" onClick={() => setSelectedSubscriberId(null)} className="rounded-full p-2 text-charcoal/45"><X className="size-4" /></button></div><div className="mt-6 grid gap-5 sm:grid-cols-[13rem_1fr_auto] sm:items-end"><label className={labelClass}>Status<select className={inputClass} value={selectedSubscriber.status} onChange={(event) => { const status = event.target.value as typeof selectedSubscriber.status; updateSubscriber(selectedSubscriber.id, { status }); void persistSubmission("subscribers", selectedSubscriber.id, { status }); }}><option value="active">Active</option><option value="unsubscribed">Unsubscribed</option></select></label><label className={labelClass}>Private note<input className={inputClass} value={selectedSubscriber.note} onChange={(event) => updateSubscriber(selectedSubscriber.id, { note: event.target.value })} placeholder="Add a note…" /></label><button type="button" onClick={() => persistSubmission("subscribers", selectedSubscriber.id, { note: selectedSubscriber.note })} className="h-11 rounded-xl bg-charcoal px-5 text-sm font-semibold text-cream">Save note</button></div></article>}
          </section>}

          {tab === "settings" && <section><div><p className="section-kicker">Global content</p><h2 className="mt-3 font-display text-4xl">Site settings</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-charcoal/60">Update the homepage voice, the About page, the newsletter invitation, and contact details.</p></div><div className="mt-7 grid gap-5 rounded-2xl border border-charcoal/10 bg-[#fffdf9] p-6 shadow-sm sm:grid-cols-2 sm:p-8">
            <div className="sm:col-span-2"><Field label="Site name" value={content.settings.siteName} onChange={(value) => updateSettings("siteName", value)} /></div>
            <Field label="Hero eyebrow" value={content.settings.heroEyebrow} onChange={(value) => updateSettings("heroEyebrow", value)} /><Field label="Hero headline" value={content.settings.heroTitle} onChange={(value) => updateSettings("heroTitle", value)} />
            <Field label="Hero accent line" value={content.settings.heroAccent} onChange={(value) => updateSettings("heroAccent", value)} /><Field label="Contact email" type="email" value={content.settings.contactEmail} onChange={(value) => updateSettings("contactEmail", value)} />
            <div className="sm:col-span-2"><TextareaField label="Hero biography" rows={6} value={content.settings.heroBio} onChange={(value) => updateSettings("heroBio", value)} /></div>
            <div className="sm:col-span-2"><TextareaField label="Homepage about headline" value={content.settings.aboutHeading} onChange={(value) => updateSettings("aboutHeading", value)} /></div>
            <div className="sm:col-span-2"><TextareaField label="Homepage about introduction" value={content.settings.aboutIntro} onChange={(value) => updateSettings("aboutIntro", value)} /></div>
            <div className="sm:col-span-2"><Field label="Newsletter headline" value={content.settings.newsletterTitle} onChange={(value) => updateSettings("newsletterTitle", value)} /></div>
            <div className="sm:col-span-2"><TextareaField label="Newsletter description" value={content.settings.newsletterCopy} onChange={(value) => updateSettings("newsletterCopy", value)} /></div>
            <div className="sm:col-span-2 rounded-2xl border border-charcoal/10 bg-white p-5 sm:p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="font-display text-2xl">Hero book promotion</p><p className="mt-1 text-sm leading-6 text-charcoal/55">Control the signed-copy card displayed at the bottom of the homepage hero.</p></div><label className="inline-flex cursor-pointer items-center gap-3 text-sm font-semibold text-charcoal"><input className="size-4 accent-burgundy" type="checkbox" checked={content.settings.heroFeatureEnabled} onChange={(event) => updateSettings("heroFeatureEnabled", event.target.checked)} />Enabled</label></div>
              {content.settings.heroFeatureEnabled && <div className="mt-6 grid gap-5 border-t border-charcoal/10 pt-6 sm:grid-cols-2"><label className={labelClass}>Featured book<select className={inputClass} value={content.settings.heroFeatureBookId} onChange={(event) => updateSettings("heroFeatureBookId", event.target.value)}><option value="">Choose a published book</option>{content.books.filter((book) => book.published).map((book) => <option key={book.id} value={book.id}>{book.title}</option>)}</select></label><Field label="Eyebrow text" value={content.settings.heroFeatureEyebrow} onChange={(value) => updateSettings("heroFeatureEyebrow", value)} /><div className="sm:col-span-2"><Field label="Button label" value={content.settings.heroFeatureCtaLabel} onChange={(value) => updateSettings("heroFeatureCtaLabel", value)} /></div></div>}
            </div>
            <div className="sm:col-span-2"><AdminImageUploader label="Homepage hero image" images={content.settings.heroImage ? [content.settings.heroImage] : []} onChange={(images) => updateSettings("heroImage", images[0] ?? "")} /></div>
            <div className="sm:col-span-2"><AdminImageUploader label="Homepage about image" images={content.settings.aboutImage ? [content.settings.aboutImage] : []} onChange={(images) => updateSettings("aboutImage", images[0] ?? "")} /></div>
          </div>

          <div className="mt-7 rounded-2xl border border-charcoal/10 bg-[#fffdf9] p-6 shadow-sm sm:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="section-kicker">Dedicated page</p>
                <h3 className="mt-3 font-display text-3xl">About page</h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-charcoal/60">Every word, image, and button on the /about page. Paragraphs are separated by a blank line.</p>
              </div>
              <label className="inline-flex shrink-0 cursor-pointer items-center gap-3 text-sm font-semibold text-charcoal"><input className="size-4 accent-burgundy" type="checkbox" checked={content.settings.aboutPageEnabled} onChange={(event) => updateSettings("aboutPageEnabled", event.target.checked)} />Published</label>
            </div>

            <div className="mt-6 grid gap-5 border-t border-charcoal/10 pt-6 sm:grid-cols-2">
              <div className="sm:col-span-2"><Field label="Page eyebrow" value={content.settings.aboutPageEyebrow} onChange={(value) => updateSettings("aboutPageEyebrow", value)} /></div>
              <div className="sm:col-span-2"><Field label="Page headline" value={content.settings.aboutPageTitle} onChange={(value) => updateSettings("aboutPageTitle", value)} /></div>
              <div className="sm:col-span-2"><TextareaField label="Hero introduction" rows={4} value={content.settings.aboutPageIntro} onChange={(value) => updateSettings("aboutPageIntro", value)} /></div>
              <div className="sm:col-span-2"><Field label="Section kicker" value={content.settings.aboutPageKicker} onChange={(value) => updateSettings("aboutPageKicker", value)} /></div>
              <div className="sm:col-span-2"><TextareaField label="Section headline" rows={3} value={content.settings.aboutPageHeading} onChange={(value) => updateSettings("aboutPageHeading", value)} /></div>
              <div className="sm:col-span-2"><TextareaField label="Body paragraphs" rows={12} value={content.settings.aboutPageBody} onChange={(value) => updateSettings("aboutPageBody", value)} placeholder="First paragraph.&#10;&#10;Second paragraph." /></div>
              <div className="sm:col-span-2"><Field label="Portrait image alt text" value={content.settings.aboutPageImageAlt} onChange={(value) => updateSettings("aboutPageImageAlt", value)} /></div>
              <div className="sm:col-span-2"><AdminImageUploader label="About page portrait" images={content.settings.aboutImage ? [content.settings.aboutImage] : []} onChange={(images) => updateSettings("aboutImage", images[0] ?? "")} /></div>
              <Field label="Primary button label" value={content.settings.aboutPagePrimaryCtaLabel} onChange={(value) => updateSettings("aboutPagePrimaryCtaLabel", value)} />
              <Field label="Primary button link" value={content.settings.aboutPagePrimaryCtaHref} onChange={(value) => updateSettings("aboutPagePrimaryCtaHref", value)} placeholder="/books" />
              <Field label="Secondary button label" value={content.settings.aboutPageSecondaryCtaLabel} onChange={(value) => updateSettings("aboutPageSecondaryCtaLabel", value)} />
              <Field label="Secondary button link" value={content.settings.aboutPageSecondaryCtaHref} onChange={(value) => updateSettings("aboutPageSecondaryCtaHref", value)} placeholder="/contact" />
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

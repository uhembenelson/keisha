"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, Copy, ImageIcon, LayoutTemplate, LoaderCircle, Mail, Minus, MousePointerClick, Palette, Plus, Save, Send, Settings, Share2, Sparkles, Space, Trash2, Type } from "lucide-react";

import { AdminImageUploader } from "@/components/admin-image-uploader";
import type { EmailBlock, EmailBlockType, EmailCampaign, EmailStudioData, EmailStudioSettings, EmailTemplate } from "@/lib/email-studio-types";

type StudioView = "templates" | "composer" | "campaigns" | "settings";

const inputClass = "mt-2 w-full rounded-xl border border-charcoal/15 bg-white px-4 py-3 text-sm text-charcoal outline-none transition focus:border-burgundy focus:ring-2 focus:ring-burgundy/10";
const labelClass = "text-xs font-semibold uppercase tracking-[0.12em] text-charcoal/55";

const blockOptions: Array<{ type: EmailBlockType; label: string; icon: typeof Type }> = [
  { type: "heading", label: "Heading", icon: Type },
  { type: "text", label: "Text", icon: Mail },
  { type: "image", label: "Image", icon: ImageIcon },
  { type: "button", label: "Button", icon: MousePointerClick },
  { type: "divider", label: "Divider", icon: Minus },
  { type: "spacer", label: "Space", icon: Space },
  { type: "social", label: "Social links", icon: Share2 },
  { type: "icon", label: "Icon / symbol", icon: Sparkles },
];

function id() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function newBlock(type: EmailBlockType): EmailBlock {
  return {
    id: id(), type,
    text: type === "heading" ? "Your heading goes here" : type === "text" ? "Write something meaningful for your readers." : type === "icon" ? "✦" : "",
    url: "", alt: "", label: type === "button" ? "Learn more" : "", align: "left",
    color: type === "button" ? "#fff3df" : "#29271f", backgroundColor: type === "button" ? "#7f2737" : "transparent",
    fontSize: type === "heading" ? 38 : type === "icon" ? 56 : 16, padding: 28, borderRadius: 0, height: 32,
    socialLinks: type === "social" ? [{ id: id(), label: "Instagram", url: "" }, { id: id(), label: "Facebook", url: "" }] : [],
  };
}

function cloneTemplate(template: EmailTemplate): EmailTemplate {
  return JSON.parse(JSON.stringify(template)) as EmailTemplate;
}

export function EmailStudio() {
  const [data, setData] = useState<EmailStudioData | null>(null);
  const [view, setView] = useState<StudioView>("templates");
  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [settingsDraft, setSettingsDraft] = useState({ apiKey: "", fromName: "", fromEmail: "", replyTo: "" });
  const [sendDraft, setSendDraft] = useState({ campaignName: "", audience: "newsletter" as "newsletter" | "single" | "custom", recipients: "" });

  async function load() {
    const response = await fetch("/api/admin/email-studio", { cache: "no-store" });
    const result = await response.json().catch(() => ({})) as EmailStudioData & { error?: string };
    if (!response.ok) throw new Error(result.error || "Email Studio could not be loaded.");
    setData(result);
    setSettingsDraft({ apiKey: "", fromName: result.settings.fromName, fromEmail: result.settings.fromEmail, replyTo: result.settings.replyTo });
  }

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void load().catch((error: Error) => setNotice({ kind: "error", message: error.message })), 0);
    return () => window.clearTimeout(initialLoad);
  }, []);

  const selectedBlock = useMemo(() => template?.blocks.find((block) => block.id === selectedBlockId) || null, [template, selectedBlockId]);
  const activeSubscribers = data?.subscribers.filter((subscriber) => subscriber.status === "active").length || 0;

  async function createTemplate() {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/email-studio", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "new-template" }) });
      const result = await response.json() as { template?: EmailTemplate; error?: string };
      if (!response.ok || !result.template) throw new Error(result.error || "A new template could not be created.");
      setTemplate(result.template);
      setSelectedBlockId(result.template.blocks[0]?.id || null);
      setSendDraft((current) => ({ ...current, campaignName: result.template?.name || "" }));
      setView("composer");
    } catch (error) { setNotice({ kind: "error", message: error instanceof Error ? error.message : "A new template could not be created." }); }
    finally { setBusy(false); }
  }

  function openTemplate(next: EmailTemplate) {
    const copy = cloneTemplate(next);
    setTemplate(copy);
    setSelectedBlockId(copy.blocks[0]?.id || null);
    setSendDraft((current) => ({ ...current, campaignName: copy.name }));
    setView("composer");
  }

  async function saveTemplate() {
    if (!template) return;
    if (!template.name.trim() || !template.subject.trim()) return setNotice({ kind: "error", message: "Every email needs a template name and subject line." });
    setBusy(true); setNotice(null);
    try {
      const response = await fetch("/api/admin/email-studio", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "save-template", template }) });
      const result = await response.json() as { template?: EmailTemplate; error?: string };
      if (!response.ok || !result.template) throw new Error(result.error || "The template could not be saved.");
      setTemplate(result.template);
      setData((current) => current && ({ ...current, templates: [result.template as EmailTemplate, ...current.templates.filter((item) => item.id !== result.template?.id)] }));
      setNotice({ kind: "success", message: "Template saved." });
    } catch (error) { setNotice({ kind: "error", message: error instanceof Error ? error.message : "The template could not be saved." }); }
    finally { setBusy(false); }
  }

  async function removeTemplate(templateId: string) {
    if (!window.confirm("Delete this email template? Campaign history will remain.")) return;
    const response = await fetch(`/api/admin/email-studio?id=${encodeURIComponent(templateId)}`, { method: "DELETE" });
    const result = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) return setNotice({ kind: "error", message: result.error || "Template could not be deleted." });
    setData((current) => current && ({ ...current, templates: current.templates.filter((item) => item.id !== templateId) }));
    setNotice({ kind: "success", message: "Template deleted." });
  }

  function updateTemplate(patch: Partial<EmailTemplate>) { setTemplate((current) => current && ({ ...current, ...patch })); }
  function updateTheme(patch: Partial<EmailTemplate["theme"]>) { setTemplate((current) => current && ({ ...current, theme: { ...current.theme, ...patch } })); }
  function updateBlock(patch: Partial<EmailBlock>) { setTemplate((current) => current && ({ ...current, blocks: current.blocks.map((block) => block.id === selectedBlockId ? { ...block, ...patch } : block) })); }
  function addBlock(type: EmailBlockType) { const block = newBlock(type); setTemplate((current) => current && ({ ...current, blocks: [...current.blocks, block] })); setSelectedBlockId(block.id); }
  function removeBlock(blockId: string) { setTemplate((current) => current && ({ ...current, blocks: current.blocks.filter((block) => block.id !== blockId) })); setSelectedBlockId(null); }
  function moveBlock(blockId: string, direction: -1 | 1) { setTemplate((current) => { if (!current) return current; const blocks = [...current.blocks]; const index = blocks.findIndex((block) => block.id === blockId); const target = index + direction; if (index < 0 || target < 0 || target >= blocks.length) return current; [blocks[index], blocks[target]] = [blocks[target], blocks[index]]; return { ...current, blocks }; }); }
  function duplicateBlock(block: EmailBlock) { const copy = { ...block, id: id(), socialLinks: block.socialLinks.map((link) => ({ ...link, id: id() })) }; setTemplate((current) => current && ({ ...current, blocks: [...current.blocks, copy] })); setSelectedBlockId(copy.id); }

  async function saveSettings() {
    setBusy(true); setNotice(null);
    try {
      const response = await fetch("/api/admin/email-studio", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(settingsDraft) });
      const result = await response.json() as { settings?: EmailStudioSettings; error?: string };
      if (!response.ok || !result.settings) throw new Error(result.error || "Email settings could not be saved.");
      setData((current) => current && ({ ...current, settings: result.settings as EmailStudioSettings }));
      setSettingsDraft((current) => ({ ...current, apiKey: "" }));
      setNotice({ kind: "success", message: result.settings.ready ? "Email delivery is configured and ready." : "Settings saved. Add the remaining Resend details before sending." });
    } catch (error) { setNotice({ kind: "error", message: error instanceof Error ? error.message : "Email settings could not be saved." }); }
    finally { setBusy(false); }
  }

  async function sendCampaign() {
    if (!template || !data?.settings.ready) return setNotice({ kind: "error", message: "Configure Resend in Delivery Settings before sending." });
    const recipients = sendDraft.recipients.split(/[\n,;]+/).map((email) => email.trim()).filter(Boolean);
    const count = sendDraft.audience === "newsletter" ? activeSubscribers : recipients.length;
    if (!count) return setNotice({ kind: "error", message: "This audience has no valid recipients." });
    if (!window.confirm(`Send “${template.subject}” to ${count} ${count === 1 ? "person" : "people"}? This action cannot be undone.`)) return;
    setBusy(true); setNotice(null);
    try {
      const response = await fetch("/api/admin/email-studio/send", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ template, audience: sendDraft.audience, recipients, campaignName: sendDraft.campaignName }) });
      const result = await response.json() as { campaign?: EmailCampaign; error?: string };
      if (!response.ok || !result.campaign) throw new Error(result.error || "The campaign could not be sent.");
      setData((current) => current && ({ ...current, campaigns: [result.campaign as EmailCampaign, ...current.campaigns] }));
      setNotice({ kind: "success", message: `Email sent to ${result.campaign.sentCount} recipients.` });
      setView("campaigns");
    } catch (error) { setNotice({ kind: "error", message: error instanceof Error ? error.message : "The campaign could not be sent." }); }
    finally { setBusy(false); }
  }

  if (!data) return <div className="grid min-h-72 place-items-center rounded-2xl border border-charcoal/10 bg-white"><LoaderCircle className="size-7 animate-spin text-burgundy" /></div>;

  return <section>
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="section-kicker">Audience communication</p><h2 className="mt-3 font-display text-4xl">Email Studio</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-charcoal/60">Design reusable emails, send newsletters or personal messages, and review every campaign.</p></div><button type="button" onClick={() => void createTemplate()} disabled={busy} className="inline-flex w-fit items-center gap-2 rounded-full bg-burgundy px-5 py-2.5 text-sm font-semibold text-cream"><Plus className="size-4" />Create email</button></div>
    {notice && <div className={`mt-5 rounded-xl border px-4 py-3 text-sm font-semibold ${notice.kind === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>{notice.message}</div>}
    <div className="mt-7 flex gap-1 overflow-x-auto rounded-xl border border-charcoal/10 bg-white p-1 shadow-sm">{(["templates", "composer", "campaigns", "settings"] as StudioView[]).map((item) => <button key={item} type="button" onClick={() => setView(item)} className={`min-w-fit flex-1 rounded-lg px-5 py-3 text-sm font-semibold capitalize transition ${view === item ? "bg-charcoal text-cream" : "text-charcoal/55 hover:bg-charcoal/5"}`}>{item === "settings" ? "Delivery settings" : item}</button>)}</div>

    {view === "templates" && <div className="mt-7 overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-sm"><div className="grid grid-cols-[1fr_auto] gap-4 border-b border-charcoal/10 px-5 py-4"><div><p className="font-display text-2xl">Saved templates</p><p className="mt-1 text-sm text-charcoal/50">Build once, reuse for newsletters and individual emails.</p></div><span className="self-center rounded-full bg-gold/20 px-3 py-1 text-xs font-bold text-burgundy">{data.templates.length}</span></div>{data.templates.map((item) => <div key={item.id} className="flex flex-col gap-4 border-b border-charcoal/10 p-5 last:border-0 sm:flex-row sm:items-center"><div className="grid size-12 shrink-0 place-items-center rounded-xl bg-burgundy/10 text-burgundy"><LayoutTemplate className="size-5" /></div><div className="min-w-0 flex-1"><p className="font-semibold text-charcoal">{item.name}</p><p className="mt-1 truncate text-sm text-charcoal/45">{item.subject}</p><p className="mt-1 text-xs text-charcoal/35">Updated {new Date(item.updatedAt).toLocaleString()}</p></div><div className="flex gap-2"><button type="button" onClick={() => openTemplate(item)} className="rounded-full border border-charcoal/15 px-4 py-2 text-xs font-semibold">Open editor</button><button type="button" onClick={() => void removeTemplate(item.id)} className="grid size-9 place-items-center rounded-full border border-red-200 text-red-700"><Trash2 className="size-4" /></button></div></div>)}{data.templates.length === 0 && <div className="px-6 py-16 text-center"><LayoutTemplate className="mx-auto size-9 text-charcoal/25" /><p className="mt-4 font-display text-2xl text-charcoal/55">No templates yet.</p><button type="button" onClick={() => void createTemplate()} className="mt-5 rounded-full bg-burgundy px-5 py-2.5 text-sm font-semibold text-cream">Create your first email</button></div>}</div>}

    {view === "composer" && !template && <div className="mt-7 rounded-2xl border border-dashed border-charcoal/15 bg-white px-6 py-20 text-center"><Palette className="mx-auto size-10 text-charcoal/25" /><p className="mt-4 font-display text-3xl">Choose a template to begin.</p><button type="button" onClick={() => setView("templates")} className="mt-5 rounded-full bg-charcoal px-5 py-2.5 text-sm font-semibold text-cream">Browse templates</button></div>}

    {view === "composer" && template && <div className="mt-7 space-y-6">
      <div className="grid gap-4 rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm sm:grid-cols-3"><label className={labelClass}>Template name<input className={inputClass} value={template.name} onChange={(event) => updateTemplate({ name: event.target.value })} /></label><label className={`${labelClass} sm:col-span-2`}>Subject line<input className={inputClass} value={template.subject} onChange={(event) => updateTemplate({ subject: event.target.value })} /></label><label className={`${labelClass} sm:col-span-3`}>Preview text<input className={inputClass} value={template.preheader} onChange={(event) => updateTemplate({ preheader: event.target.value })} /></label></div>
      <div className="grid gap-5 xl:grid-cols-[13rem_minmax(0,1fr)_20rem]">
        <aside className="h-fit rounded-2xl border border-charcoal/10 bg-white p-4 shadow-sm xl:sticky xl:top-24"><p className="text-xs font-bold uppercase tracking-[0.14em] text-charcoal/45">Add content</p><div className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-1">{blockOptions.map(({ type, label, icon: Icon }) => <button key={type} type="button" onClick={() => addBlock(type)} className="flex items-center gap-2 rounded-xl border border-charcoal/10 px-3 py-3 text-left text-xs font-semibold transition hover:border-burgundy hover:text-burgundy"><Icon className="size-4" />{label}</button>)}</div><div className="mt-6 border-t border-charcoal/10 pt-5"><p className="text-xs font-bold uppercase tracking-[0.14em] text-charcoal/45">Email colors</p><ColorField label="Outside" value={template.theme.emailBackground} onChange={(emailBackground) => updateTheme({ emailBackground })} /><ColorField label="Content" value={template.theme.contentBackground} onChange={(contentBackground) => updateTheme({ contentBackground })} /><ColorField label="Accent" value={template.theme.accentColor} onChange={(accentColor) => updateTheme({ accentColor })} /><label className={`${labelClass} mt-4 block`}>Font<select className={inputClass} value={template.theme.fontFamily} onChange={(event) => updateTheme({ fontFamily: event.target.value as EmailTemplate["theme"]["fontFamily"] })}>{["Arial", "Georgia", "Verdana", "Trebuchet MS"].map((font) => <option key={font}>{font}</option>)}</select></label></div></aside>
        <div className="min-w-0 rounded-2xl border border-charcoal/10 bg-[#e9e6df] p-3 shadow-inner sm:p-6"><p className="mb-4 text-center text-[0.65rem] font-bold uppercase tracking-[0.16em] text-charcoal/40">Live email preview</p><EmailPreview template={template} selectedBlockId={selectedBlockId} onSelect={setSelectedBlockId} /></div>
        <aside className="h-fit rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm xl:sticky xl:top-24">{selectedBlock ? <BlockEditor block={selectedBlock} onChange={updateBlock} onDelete={() => removeBlock(selectedBlock.id)} onDuplicate={() => duplicateBlock(selectedBlock)} onMoveUp={() => moveBlock(selectedBlock.id, -1)} onMoveDown={() => moveBlock(selectedBlock.id, 1)} /> : <ThemeEditor template={template} onChange={updateTheme} />}</aside>
      </div>
      <div className="flex flex-wrap justify-end gap-3"><button type="button" onClick={() => setSelectedBlockId(null)} className="rounded-full border border-charcoal/15 px-5 py-2.5 text-sm font-semibold">Edit brand settings</button><button type="button" onClick={() => void saveTemplate()} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-charcoal px-5 py-2.5 text-sm font-semibold text-cream">{busy ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}Save template</button></div>
      <div className="rounded-2xl border border-gold/40 bg-[#fff8e9] p-5 sm:p-7"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><p className="font-display text-2xl">Send this email</p><p className="mt-1 text-sm leading-6 text-charcoal/55">Send to the newsletter list, one person, or a custom group.</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${data.settings.ready ? "bg-emerald-100 text-emerald-800" : "bg-charcoal/8 text-charcoal/50"}`}>{data.settings.ready ? "Delivery ready" : "Setup required"}</span></div><div className="mt-5 grid gap-5 border-t border-charcoal/10 pt-5 sm:grid-cols-2"><label className={labelClass}>Campaign name<input className={inputClass} value={sendDraft.campaignName} onChange={(event) => setSendDraft((current) => ({ ...current, campaignName: event.target.value }))} /></label><label className={labelClass}>Audience<select className={inputClass} value={sendDraft.audience} onChange={(event) => setSendDraft((current) => ({ ...current, audience: event.target.value as typeof current.audience }))}><option value="newsletter">Newsletter list ({activeSubscribers})</option><option value="single">One person</option><option value="custom">Custom email list</option></select></label>{sendDraft.audience !== "newsletter" && <label className={`${labelClass} sm:col-span-2`}>{sendDraft.audience === "single" ? "Recipient email" : "Recipient emails — one per line or separated by commas"}<textarea className={`${inputClass} resize-y`} rows={sendDraft.audience === "single" ? 2 : 5} value={sendDraft.recipients} onChange={(event) => setSendDraft((current) => ({ ...current, recipients: event.target.value }))} /></label>}</div><div className="mt-5 flex flex-wrap items-center justify-between gap-4"><p className="text-xs text-charcoal/45">Every newsletter recipient receives an individual unsubscribe link.</p><button type="button" onClick={() => void sendCampaign()} disabled={busy || !data.settings.ready} className="inline-flex items-center gap-2 rounded-full bg-burgundy px-5 py-2.5 text-sm font-semibold text-cream disabled:opacity-40"><Send className="size-4" />Send email</button></div></div>
    </div>}

    {view === "campaigns" && <div className="mt-7 overflow-x-auto rounded-2xl border border-charcoal/10 bg-white shadow-sm"><table className="w-full min-w-[48rem] text-left"><thead><tr className="border-b border-charcoal/10 bg-charcoal/[0.025]">{["Campaign", "Audience", "Recipients", "Sent", "Status"].map((heading) => <th key={heading} className="px-5 py-4 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-charcoal/45">{heading}</th>)}</tr></thead><tbody>{data.campaigns.map((campaign) => <tr key={campaign.id} className="border-b border-charcoal/10 last:border-0"><td className="px-5 py-4"><p className="font-semibold">{campaign.name}</p><p className="mt-1 text-xs text-charcoal/45">{campaign.subject}</p></td><td className="px-5 py-4 text-sm capitalize">{campaign.audience}</td><td className="px-5 py-4 text-sm">{campaign.recipientCount}</td><td className="px-5 py-4 text-sm">{campaign.sentAt ? new Date(campaign.sentAt).toLocaleString() : "—"}</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${campaign.status === "sent" ? "bg-emerald-100 text-emerald-800" : campaign.status === "failed" ? "bg-red-100 text-red-800" : "bg-gold/20 text-burgundy"}`}>{campaign.status}</span>{campaign.error && <p className="mt-2 max-w-xs text-xs text-red-700">{campaign.error}</p>}</td></tr>)}{data.campaigns.length === 0 && <tr><td colSpan={5} className="px-6 py-16 text-center font-display text-2xl text-charcoal/45">No campaigns have been sent yet.</td></tr>}</tbody></table></div>}

    {view === "settings" && <div className="mt-7 max-w-3xl rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm sm:p-7"><div className="flex items-start justify-between gap-5"><div><p className="font-display text-3xl">Delivery settings</p><p className="mt-2 text-sm leading-6 text-charcoal/55">Connect Resend later. The API key is encrypted before it is stored and is never shown again.</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${data.settings.ready ? "bg-emerald-100 text-emerald-800" : "bg-charcoal/8 text-charcoal/50"}`}>{data.settings.ready ? "Ready" : "Not configured"}</span></div><div className="mt-6 grid gap-5 border-t border-charcoal/10 pt-6 sm:grid-cols-2"><label className={`${labelClass} sm:col-span-2`}>Resend API key<input type="password" autoComplete="new-password" className={inputClass} placeholder={data.settings.apiKeyConfigured ? "API key saved — enter a new one to replace it" : "re_…"} value={settingsDraft.apiKey} onChange={(event) => setSettingsDraft((current) => ({ ...current, apiKey: event.target.value }))} /></label><label className={labelClass}>Sender name<input className={inputClass} value={settingsDraft.fromName} onChange={(event) => setSettingsDraft((current) => ({ ...current, fromName: event.target.value }))} /></label><label className={labelClass}>Verified sender email<input type="email" className={inputClass} placeholder="hello@yourdomain.com" value={settingsDraft.fromEmail} onChange={(event) => setSettingsDraft((current) => ({ ...current, fromEmail: event.target.value }))} /></label><label className={`${labelClass} sm:col-span-2`}>Reply-to email<input type="email" className={inputClass} placeholder="keisha@yourdomain.com" value={settingsDraft.replyTo} onChange={(event) => setSettingsDraft((current) => ({ ...current, replyTo: event.target.value }))} /></label></div><div className="mt-6 flex flex-wrap items-center justify-between gap-4"><p className="max-w-xl text-xs leading-5 text-charcoal/45">Verify the sender domain in Resend before sending. Newsletter sends use batches of up to 100 individual messages with duplicate-send protection.</p><button type="button" onClick={() => void saveSettings()} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-charcoal px-5 py-2.5 text-sm font-semibold text-cream">{busy ? <LoaderCircle className="size-4 animate-spin" /> : <Settings className="size-4" />}Save settings</button></div></div>}
  </section>;
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="mt-3 flex items-center justify-between gap-3 text-xs font-semibold text-charcoal/55"><span>{label}</span><span className="flex items-center gap-2"><input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="size-8 cursor-pointer rounded border-0 bg-transparent" /><input value={value} onChange={(event) => onChange(event.target.value)} className="w-24 rounded-lg border border-charcoal/10 px-2 py-1.5 font-mono text-[0.65rem]" /></span></label>;
}

function EmailPreview({ template, selectedBlockId, onSelect }: { template: EmailTemplate; selectedBlockId: string | null; onSelect: (id: string) => void }) {
  const style = { backgroundColor: template.theme.contentBackground, color: template.theme.textColor, fontFamily: template.theme.fontFamily, maxWidth: template.theme.contentWidth };
  return <div className="mx-auto w-full shadow-xl" style={style}>{template.theme.logoUrl && <div className="p-7 text-center"><Image src={template.theme.logoUrl} alt={template.theme.logoAlt} width={180} height={72} unoptimized className="mx-auto max-h-20 max-w-48 object-contain" /></div>}{template.blocks.map((block) => <div key={block.id} role="button" tabIndex={0} onClick={() => onSelect(block.id)} onKeyDown={(event) => { if (event.key === "Enter") onSelect(block.id); }} className={`relative cursor-pointer outline-none transition ${selectedBlockId === block.id ? "ring-2 ring-inset ring-burgundy" : "hover:ring-2 hover:ring-inset hover:ring-gold/60"}`} style={{ padding: block.type === "spacer" ? 0 : block.padding, textAlign: block.align, backgroundColor: block.backgroundColor === "transparent" ? undefined : block.backgroundColor, minHeight: block.type === "spacer" ? block.height : undefined }}>{block.type === "heading" && <div style={{ color: block.color, fontSize: block.fontSize, fontWeight: 700, lineHeight: 1.1, whiteSpace: "pre-line" }}>{block.text}</div>}{block.type === "text" && <div style={{ color: block.color, fontSize: block.fontSize, lineHeight: 1.7, whiteSpace: "pre-line" }}>{block.text}</div>}{block.type === "icon" && <div style={{ color: block.color, fontSize: block.fontSize, lineHeight: 1 }}>{block.text || "✦"}</div>}{block.type === "image" && (block.url ? <Image src={block.url} alt={block.alt} width={640} height={400} unoptimized className="block h-auto w-full" style={{ borderRadius: block.borderRadius }} /> : <div className="grid min-h-40 place-items-center border border-dashed border-charcoal/20 bg-charcoal/5 text-sm text-charcoal/35"><ImageIcon className="mr-2 inline size-5" />Add an image</div>)}{block.type === "button" && <span className="inline-block px-6 py-3 font-bold" style={{ backgroundColor: block.backgroundColor, color: block.color, borderRadius: block.borderRadius, fontSize: block.fontSize }}>{block.label || "Button"}</span>}{block.type === "divider" && <div className="h-px" style={{ backgroundColor: block.color }} />}{block.type === "social" && <div>{block.socialLinks.map((link) => <span key={link.id} className="mx-2 font-bold" style={{ color: block.color, fontSize: block.fontSize }}>{link.label || "Social"}</span>)}</div>}</div>)}<div className="border-t border-black/10 p-7 text-center text-xs leading-6" style={{ color: template.theme.textColor }}>{template.theme.footerText}<br /><span style={{ color: template.theme.accentColor }}>Unsubscribe</span></div></div>;
}

function BlockEditor({ block, onChange, onDelete, onDuplicate, onMoveUp, onMoveDown }: { block: EmailBlock; onChange: (patch: Partial<EmailBlock>) => void; onDelete: () => void; onDuplicate: () => void; onMoveUp: () => void; onMoveDown: () => void }) {
  return <div><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-burgundy">Selected block</p><p className="mt-1 font-display text-2xl capitalize">{block.type}</p></div><div className="flex gap-1"><button type="button" onClick={onMoveUp} className="rounded-full p-2 hover:bg-charcoal/5" aria-label="Move up"><ArrowUp className="size-4" /></button><button type="button" onClick={onMoveDown} className="rounded-full p-2 hover:bg-charcoal/5" aria-label="Move down"><ArrowDown className="size-4" /></button></div></div><div className="mt-5 space-y-4">
    {(block.type === "heading" || block.type === "text") && <label className={labelClass}>Content<textarea className={`${inputClass} resize-y`} rows={block.type === "heading" ? 3 : 7} value={block.text} onChange={(event) => onChange({ text: event.target.value })} /></label>}
    {block.type === "icon" && <label className={labelClass}>Icon, emoji, or symbol<input className={inputClass} value={block.text} onChange={(event) => onChange({ text: event.target.value.slice(0, 8) })} /></label>}
    {block.type === "image" && <><AdminImageUploader label="Email image" images={block.url ? [block.url] : []} onChange={(images) => onChange({ url: images[0] || "" })} /><label className={labelClass}>Or image URL<input className={inputClass} value={block.url} onChange={(event) => onChange({ url: event.target.value })} /></label><label className={labelClass}>Image description<input className={inputClass} value={block.alt} onChange={(event) => onChange({ alt: event.target.value })} /></label></>}
    {block.type === "button" && <><label className={labelClass}>Button text<input className={inputClass} value={block.label} onChange={(event) => onChange({ label: event.target.value })} /></label><label className={labelClass}>Button link<input className={inputClass} placeholder="https://…" value={block.url} onChange={(event) => onChange({ url: event.target.value })} /></label></>}
    {block.type === "social" && <div><div className="flex items-center justify-between"><p className={labelClass}>Social links</p><button type="button" onClick={() => onChange({ socialLinks: [...block.socialLinks, { id: id(), label: "Social", url: "" }] })} className="text-xs font-semibold text-burgundy">+ Add</button></div>{block.socialLinks.map((link, index) => <div key={link.id} className="mt-3 grid grid-cols-[1fr_1.4fr_auto] gap-2"><input className="rounded-lg border border-charcoal/15 px-3 py-2 text-xs" value={link.label} onChange={(event) => onChange({ socialLinks: block.socialLinks.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item) })} /><input className="rounded-lg border border-charcoal/15 px-3 py-2 text-xs" placeholder="https://…" value={link.url} onChange={(event) => onChange({ socialLinks: block.socialLinks.map((item, itemIndex) => itemIndex === index ? { ...item, url: event.target.value } : item) })} /><button type="button" onClick={() => onChange({ socialLinks: block.socialLinks.filter((_, itemIndex) => itemIndex !== index) })} className="text-red-700"><Trash2 className="size-4" /></button></div>)}</div>}
    {block.type === "spacer" && <RangeField label="Height" value={block.height} min={8} max={120} onChange={(height) => onChange({ height })} />}
    {block.type !== "spacer" && <><label className={labelClass}>Alignment<select className={inputClass} value={block.align} onChange={(event) => onChange({ align: event.target.value as EmailBlock["align"] })}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label><RangeField label="Padding" value={block.padding} min={0} max={64} onChange={(padding) => onChange({ padding })} /></>}
    {["heading", "text", "button", "social", "icon"].includes(block.type) && <><RangeField label="Font size" value={block.fontSize} min={12} max={block.type === "icon" ? 96 : 64} onChange={(fontSize) => onChange({ fontSize })} /><ColorField label="Text color" value={block.color} onChange={(color) => onChange({ color })} /></>}
    {["heading", "text", "button"].includes(block.type) && <ColorField label="Background" value={block.backgroundColor === "transparent" ? "#ffffff" : block.backgroundColor} onChange={(backgroundColor) => onChange({ backgroundColor })} />}
    {block.type === "divider" && <ColorField label="Line color" value={block.color} onChange={(color) => onChange({ color })} />}
  </div><div className="mt-6 flex gap-2 border-t border-charcoal/10 pt-5"><button type="button" onClick={onDuplicate} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-charcoal/15 px-3 py-2 text-xs font-semibold"><Copy className="size-3.5" />Duplicate</button><button type="button" onClick={onDelete} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-700"><Trash2 className="size-3.5" />Remove</button></div></div>;
}

function ThemeEditor({ template, onChange }: { template: EmailTemplate; onChange: (patch: Partial<EmailTemplate["theme"]>) => void }) {
  return <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-burgundy">Brand settings</p><p className="mt-1 font-display text-2xl">Whole email</p><div className="mt-5 space-y-5"><AdminImageUploader label="Logo" images={template.theme.logoUrl ? [template.theme.logoUrl] : []} onChange={(images) => onChange({ logoUrl: images[0] || "" })} /><label className={labelClass}>Logo description<input className={inputClass} value={template.theme.logoAlt} onChange={(event) => onChange({ logoAlt: event.target.value })} /></label><label className={labelClass}>Footer text<textarea className={`${inputClass} resize-y`} rows={5} value={template.theme.footerText} onChange={(event) => onChange({ footerText: event.target.value })} /></label><RangeField label="Email width" value={template.theme.contentWidth} min={480} max={760} onChange={(contentWidth) => onChange({ contentWidth })} /><ColorField label="Text" value={template.theme.textColor} onChange={(textColor) => onChange({ textColor })} /></div></div>;
}

function RangeField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return <label className={labelClass}><span className="flex justify-between"><span>{label}</span><span className="normal-case tracking-normal text-charcoal/40">{value}px</span></span><input type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-3 w-full accent-burgundy" /></label>;
}

import "server-only";

import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";

import type { EmailBlock, EmailCampaign, EmailStudioSettings, EmailTemplate } from "@/lib/email-studio-types";
import { getMongoDatabase } from "@/lib/mongodb";
import { getSubmissions, updateSubmission } from "@/lib/submissions";

type StoredEmailSettings = {
  _id: "email-studio";
  provider: "resend";
  fromName: string;
  fromEmail: string;
  replyTo: string;
  apiKeyEncrypted: string;
  updatedAt: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function secretKey() {
  const value = process.env.CMS_SESSION_SECRET?.trim();
  if (!value) throw new Error("CMS_SESSION_SECRET is required before email credentials can be saved.");
  return createHash("sha256").update(value).digest();
}

function encrypt(value: string) {
  if (!value) return "";
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", secretKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString("base64url")).join(".");
}

function decrypt(value: string) {
  if (!value) return "";
  const [iv, tag, encrypted] = value.split(".").map((part) => Buffer.from(part, "base64url"));
  const decipher = createDecipheriv("aes-256-gcm", secretKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function createDefaultEmailTemplate(): EmailTemplate {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    name: "New email",
    subject: "Stories beyond the expected",
    preheader: "A new note from Keisha WriteNow Allen.",
    theme: {
      emailBackground: "#fff3df",
      contentBackground: "#fffdf9",
      textColor: "#29271f",
      accentColor: "#7f2737",
      fontFamily: "Georgia",
      contentWidth: 640,
      logoUrl: "",
      logoAlt: "Keisha WriteNow Allen",
      footerText: "You are receiving this email because you joined Keisha’s mailing list.",
    },
    blocks: [
      { id: randomUUID(), type: "heading", text: "A story worth sharing.", url: "", alt: "", label: "", align: "left", color: "#29271f", backgroundColor: "transparent", fontSize: 38, padding: 28, borderRadius: 0, height: 24, socialLinks: [] },
      { id: randomUUID(), type: "text", text: "Write your message here. Share a new release, a behind-the-scenes note, an event, or something meaningful with your readers.", url: "", alt: "", label: "", align: "left", color: "#4a463d", backgroundColor: "transparent", fontSize: 16, padding: 28, borderRadius: 0, height: 24, socialLinks: [] },
      { id: randomUUID(), type: "button", text: "", url: "https://keishawritenowallen.com/", alt: "", label: "Read more", align: "left", color: "#fff3df", backgroundColor: "#7f2737", fontSize: 15, padding: 28, borderRadius: 0, height: 24, socialLinks: [] },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

function publicSettings(settings: StoredEmailSettings | null): EmailStudioSettings {
  const apiKeyConfigured = Boolean(settings?.apiKeyEncrypted);
  return {
    provider: "resend",
    fromName: settings?.fromName || "Keisha WriteNow Allen",
    fromEmail: settings?.fromEmail || "",
    replyTo: settings?.replyTo || "",
    apiKeyConfigured,
    ready: Boolean(apiKeyConfigured && settings?.fromEmail && emailPattern.test(settings.fromEmail)),
  };
}

export async function getEmailStudioData() {
  const database = await getMongoDatabase();
  const submissions = await getSubmissions();
  if (!database) return { templates: [] as EmailTemplate[], campaigns: [] as EmailCampaign[], settings: publicSettings(null), subscribers: submissions.subscribers.map(({ id, email, status }) => ({ id, email, status })) };
  const [storedTemplates, campaigns, settings] = await Promise.all([
    database.collection<EmailTemplate>("email_templates").find().sort({ updatedAt: -1 }).toArray(),
    database.collection<EmailCampaign>("email_campaigns").find().sort({ createdAt: -1 }).limit(200).toArray(),
    database.collection<StoredEmailSettings>("integration_settings").findOne({ _id: "email-studio" }),
  ]);
  const templates = storedTemplates as unknown as EmailTemplate[];
  if (templates.length === 0) {
    const starter = createDefaultEmailTemplate();
    starter.name = "WriteNow Newsletter";
    await database.collection<EmailTemplate>("email_templates").insertOne(starter);
    templates.push(starter);
  }
  return { templates, campaigns, settings: publicSettings(settings), subscribers: submissions.subscribers.map(({ id, email, status }) => ({ id, email, status })) };
}

export async function saveEmailTemplate(template: EmailTemplate) {
  const database = await getMongoDatabase();
  if (!database) throw new Error("MongoDB must be connected before email templates can be saved.");
  const now = new Date().toISOString();
  const normalized = { ...template, id: template.id || randomUUID(), name: template.name.trim().slice(0, 120) || "Untitled email", subject: template.subject.trim().slice(0, 200), preheader: template.preheader.trim().slice(0, 240), updatedAt: now, createdAt: template.createdAt || now };
  await database.collection<EmailTemplate>("email_templates").replaceOne({ id: normalized.id }, normalized, { upsert: true });
  return normalized;
}

export async function deleteEmailTemplate(id: string) {
  const database = await getMongoDatabase();
  if (!database) return false;
  return (await database.collection<EmailTemplate>("email_templates").deleteOne({ id })).deletedCount > 0;
}

export async function saveEmailStudioSettings(input: { apiKey?: string; fromName: string; fromEmail: string; replyTo: string }) {
  const database = await getMongoDatabase();
  if (!database) throw new Error("MongoDB must be connected before email settings can be saved.");
  const fromEmail = input.fromEmail.trim().toLowerCase();
  const replyTo = input.replyTo.trim().toLowerCase();
  if (fromEmail && !emailPattern.test(fromEmail)) throw new Error("Enter a valid verified sender email address.");
  if (replyTo && !emailPattern.test(replyTo)) throw new Error("Enter a valid reply-to email address.");
  const collection = database.collection<StoredEmailSettings>("integration_settings");
  const current = await collection.findOne({ _id: "email-studio" });
  const settings: StoredEmailSettings = { _id: "email-studio", provider: "resend", fromName: input.fromName.trim().slice(0, 120) || "Keisha WriteNow Allen", fromEmail, replyTo, apiKeyEncrypted: input.apiKey?.trim() ? encrypt(input.apiKey.trim()) : current?.apiKeyEncrypted || "", updatedAt: new Date().toISOString() };
  await collection.replaceOne({ _id: "email-studio" }, settings, { upsert: true });
  return publicSettings(settings);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] || character);
}

function safeUrl(value: string) {
  return /^https?:\/\//i.test(value.trim()) ? escapeHtml(value.trim()) : "#";
}

function renderBlock(block: EmailBlock, fontFamily: string) {
  const align = ["left", "center", "right"].includes(block.align) ? block.align : "left";
  const pad = Math.max(0, Math.min(64, Number(block.padding) || 0));
  const common = `padding:${pad}px;text-align:${align};background:${escapeHtml(block.backgroundColor || "transparent")};`;
  if (block.type === "heading") return `<tr><td style="${common}color:${escapeHtml(block.color)};font-family:${fontFamily};font-size:${Math.max(18, Math.min(64, block.fontSize))}px;line-height:1.1;font-weight:700;">${escapeHtml(block.text).replace(/\n/g, "<br>")}</td></tr>`;
  if (block.type === "text") return `<tr><td style="${common}color:${escapeHtml(block.color)};font-family:${fontFamily};font-size:${Math.max(12, Math.min(28, block.fontSize))}px;line-height:1.7;">${escapeHtml(block.text).replace(/\n/g, "<br>")}</td></tr>`;
  if (block.type === "image") return `<tr><td style="${common}"><img src="${safeUrl(block.url)}" alt="${escapeHtml(block.alt)}" style="display:block;width:100%;height:auto;border:0;border-radius:${Math.max(0, Math.min(40, block.borderRadius))}px;"></td></tr>`;
  if (block.type === "button") return `<tr><td style="${common}"><a href="${safeUrl(block.url)}" style="display:inline-block;background:${escapeHtml(block.backgroundColor)};color:${escapeHtml(block.color)};font-family:${fontFamily};font-size:${Math.max(12, Math.min(24, block.fontSize))}px;font-weight:700;text-decoration:none;padding:14px 24px;border-radius:${Math.max(0, Math.min(40, block.borderRadius))}px;">${escapeHtml(block.label || "Learn more")}</a></td></tr>`;
  if (block.type === "divider") return `<tr><td style="padding:${pad}px;"><div style="height:1px;background:${escapeHtml(block.color)};"></div></td></tr>`;
  if (block.type === "spacer") return `<tr><td height="${Math.max(8, Math.min(120, block.height))}" style="height:${Math.max(8, Math.min(120, block.height))}px;line-height:${Math.max(8, Math.min(120, block.height))}px;">&nbsp;</td></tr>`;
  if (block.type === "social") return `<tr><td style="${common}">${block.socialLinks.filter((link) => link.label.trim() && /^https?:\/\//i.test(link.url)).map((link) => `<a href="${safeUrl(link.url)}" style="display:inline-block;margin:0 8px;color:${escapeHtml(block.color)};font-family:${fontFamily};font-size:${Math.max(12, Math.min(24, block.fontSize))}px;font-weight:700;text-decoration:none;">${escapeHtml(link.label)}</a>`).join("")}</td></tr>`;
  if (block.type === "icon") return `<tr><td style="${common}color:${escapeHtml(block.color)};font-family:${fontFamily};font-size:${Math.max(18, Math.min(96, block.fontSize))}px;line-height:1;">${escapeHtml(block.text || "✦")}</td></tr>`;
  return "";
}

export function renderEmailHtml(template: EmailTemplate, unsubscribeUrl = "") {
  const { theme } = template;
  const fontFamily = `'${theme.fontFamily}', Arial, sans-serif`;
  const logo = theme.logoUrl && /^https?:\/\//i.test(theme.logoUrl) ? `<tr><td style="padding:28px;text-align:center;"><img src="${safeUrl(theme.logoUrl)}" alt="${escapeHtml(theme.logoAlt)}" style="display:inline-block;max-width:180px;max-height:72px;width:auto;height:auto;"></td></tr>` : "";
  const unsubscribe = unsubscribeUrl ? `<br><a href="${safeUrl(unsubscribeUrl)}" style="color:${escapeHtml(theme.accentColor)};">Unsubscribe</a>` : "";
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(template.subject)}</title></head><body style="margin:0;padding:0;background:${escapeHtml(theme.emailBackground)};"><div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(template.preheader)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${escapeHtml(theme.emailBackground)};"><tr><td align="center" style="padding:32px 12px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:${Math.max(480, Math.min(760, theme.contentWidth))}px;background:${escapeHtml(theme.contentBackground)};color:${escapeHtml(theme.textColor)};">${logo}${template.blocks.map((block) => renderBlock(block, fontFamily)).join("")}<tr><td style="padding:28px;text-align:center;color:${escapeHtml(theme.textColor)};font-family:${fontFamily};font-size:12px;line-height:1.6;border-top:1px solid rgba(0,0,0,.1);">${escapeHtml(theme.footerText).replace(/\n/g, "<br>")}${unsubscribe}</td></tr></table></td></tr></table></body></html>`;
}

export function createUnsubscribeToken(email: string) {
  const normalized = email.trim().toLowerCase();
  const signature = createHmac("sha256", secretKey()).update(normalized).digest("base64url");
  return `${Buffer.from(normalized).toString("base64url")}.${signature}`;
}

export function verifyUnsubscribeToken(token: string) {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return "";
  const email = Buffer.from(encoded, "base64url").toString("utf8").toLowerCase();
  const expected = createHmac("sha256", secretKey()).update(email).digest();
  const actual = Buffer.from(signature, "base64url");
  return actual.length === expected.length && timingSafeEqual(actual, expected) && emailPattern.test(email) ? email : "";
}

export async function unsubscribeEmail(email: string) {
  const submissions = await getSubmissions();
  const subscriber = submissions.subscribers.find((entry) => entry.email.toLowerCase() === email.toLowerCase());
  if (subscriber) await updateSubmission("subscribers", subscriber.id, { status: "unsubscribed" });
  return Boolean(subscriber);
}

export async function sendEmailCampaign(input: { template: EmailTemplate; audience: "newsletter" | "single" | "custom"; recipients: string[]; campaignName: string; siteUrl: string }) {
  const database = await getMongoDatabase();
  if (!database) throw new Error("MongoDB must be connected before an email campaign can be sent.");
  const stored = await database.collection<StoredEmailSettings>("integration_settings").findOne({ _id: "email-studio" });
  const settings = publicSettings(stored);
  if (!stored?.apiKeyEncrypted || !settings.ready) throw new Error("Configure Resend, a verified sender address, and a reply-to address before sending.");
  const apiKey = decrypt(stored.apiKeyEncrypted);
  const submissions = await getSubmissions();
  const requested = input.audience === "newsletter" ? submissions.subscribers.filter((subscriber) => subscriber.status === "active").map((subscriber) => subscriber.email) : input.audience === "single" ? input.recipients.slice(0, 1) : input.recipients;
  const recipients = [...new Set(requested.map((email) => email.trim().toLowerCase()).filter((email) => emailPattern.test(email)))];
  if (!recipients.length) throw new Error("There are no valid recipients for this campaign.");
  const now = new Date().toISOString();
  const campaign: EmailCampaign = { id: randomUUID(), name: input.campaignName.trim().slice(0, 160) || input.template.name, templateId: input.template.id, templateName: input.template.name, subject: input.template.subject, audience: input.audience, recipientCount: recipients.length, status: "sending", sentCount: 0, failedCount: 0, error: "", createdAt: now, sentAt: "" };
  const collection = database.collection<EmailCampaign>("email_campaigns");
  await collection.insertOne(campaign);
  try {
    let sentCount = 0;
    for (let index = 0; index < recipients.length; index += 100) {
      const batch = recipients.slice(index, index + 100);
      const payload = batch.map((email) => ({
        from: `${stored.fromName} <${stored.fromEmail}>`,
        to: [email],
        subject: input.template.subject,
        html: renderEmailHtml(input.template, `${input.siteUrl.replace(/\/$/, "")}/api/newsletter/unsubscribe?token=${encodeURIComponent(createUnsubscribeToken(email))}`),
        ...(stored.replyTo ? { reply_to: stored.replyTo } : {}),
      }));
      const response = await fetch("https://api.resend.com/emails/batch", { method: "POST", headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json", "idempotency-key": `email-studio/${campaign.id}/${index / 100}` }, body: JSON.stringify(payload) });
      const result = await response.json().catch(() => null) as { message?: string; error?: { message?: string }; data?: Array<{ id?: string }> } | null;
      if (!response.ok) throw new Error(result?.message || result?.error?.message || `Resend rejected the campaign (${response.status}).`);
      sentCount += batch.length;
    }
    const completed = { ...campaign, status: "sent" as const, sentCount, sentAt: new Date().toISOString() };
    await collection.replaceOne({ id: campaign.id }, completed);
    return completed;
  } catch (error) {
    const failed = { ...campaign, status: "failed" as const, failedCount: recipients.length, error: error instanceof Error ? error.message : "Email delivery failed." };
    await collection.replaceOne({ id: campaign.id }, failed);
    throw error;
  }
}

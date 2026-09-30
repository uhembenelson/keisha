import "server-only";

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import type { CmsContent } from "@/lib/cms-types";
import { getMongoDatabase } from "@/lib/mongodb";

const dataDirectory = path.join(process.cwd(), "data");
const cmsFile = path.join(dataDirectory, "cms.json");

export async function getCmsContent(): Promise<CmsContent> {
  const database = await getMongoDatabase();
  if (database) {
    const collection = database.collection<{ _id: string; content: CmsContent }>("site_content");
    const document = await collection.findOne({ _id: "primary" });
    if (document) return normalizeCmsContent(document.content);
    const fallback = await readJsonContent();
    await collection.replaceOne({ _id: "primary" }, { content: fallback }, { upsert: true });
    return fallback;
  }
  return readJsonContent();
}

async function readJsonContent(): Promise<CmsContent> {
  const file = await readFile(cmsFile, "utf8");
  return normalizeCmsContent(JSON.parse(file) as CmsContent);
}

function normalizeCmsContent(content: CmsContent): CmsContent {
  return {
    ...content,
    settings: {
      ...content.settings,
      heroImage: content.settings.heroImage || "/images/pic.jpeg",
      aboutImage: content.settings.aboutImage || "/images/keisha-profile-c.png",
      heroFeatureEnabled: content.settings.heroFeatureEnabled ?? true,
      heroFeatureBookId: content.settings.heroFeatureBookId || "the-love-enthusiast",
      heroFeatureEyebrow: content.settings.heroFeatureEyebrow || "Order a signed copy today",
      heroFeatureCtaLabel: content.settings.heroFeatureCtaLabel || "View the book",
    },
    books: content.books.map((book) => ({
      ...book,
      availability: book.availability || (book.price ? "paid" : "coming-soon"),
      purchaseUrl: book.purchaseUrl || "",
      retailers: book.retailers?.length ? book.retailers : book.purchaseUrl ? [{ id: "primary-store", name: "Buy from retailer", url: book.purchaseUrl }] : [],
      downloadUrl: book.downloadUrl || "",
      gallery: book.gallery || [],
    })),
    news: content.news.map((item) => ({ ...item, image: item.image || "", gallery: item.gallery || [] })),
    events: content.events.map((item) => ({ ...item, image: item.image || "", gallery: item.gallery || [] })),
    media: content.media.map((item) => ({ ...item, image: item.image || "", gallery: item.gallery || [] })),
  };
}

export function isCmsContent(value: unknown): value is CmsContent {
  if (!value || typeof value !== "object") return false;
  const content = value as Partial<CmsContent>;
  return Boolean(
    content.settings &&
      Array.isArray(content.books) &&
      Array.isArray(content.news) &&
      Array.isArray(content.events) &&
      Array.isArray(content.media),
  );
}

export async function saveCmsContent(content: CmsContent) {
  const database = await getMongoDatabase();
  if (database) {
    await database.collection<{ _id: string; content: CmsContent }>("site_content").replaceOne(
      { _id: "primary" },
      { content },
      { upsert: true },
    );
    return;
  }
  await mkdir(dataDirectory, { recursive: true });
  const temporaryFile = path.join(dataDirectory, ".cms.json.tmp");
  await writeFile(temporaryFile, `${JSON.stringify(content, null, 2)}\n`, "utf8");
  await rename(temporaryFile, cmsFile);
}

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
  const settings = content.settings;
  return {
    ...content,
    settings: {
      ...settings,
      heroImage: settings.heroImage || "/images/pic.jpeg",
      aboutImage: settings.aboutImage || "/images/keisha-profile-c.png",
      heroFeatureEnabled: settings.heroFeatureEnabled ?? true,
      heroFeatureBookId: settings.heroFeatureBookId || "the-love-enthusiast",
      heroFeatureEyebrow: settings.heroFeatureEyebrow || "Order a signed copy today",
      heroFeatureCtaLabel: settings.heroFeatureCtaLabel || "View the book",
      aboutPageEyebrow: settings.aboutPageEyebrow || "About Keisha",
      aboutPageTitle: settings.aboutPageTitle || "A writer shaped by purpose, humor, and heart.",
      aboutPageIntro: settings.aboutPageIntro || settings.heroBio || "",
      aboutPageKicker: settings.aboutPageKicker || "Her story",
      aboutPageHeading:
        settings.aboutPageHeading || "Rediscovering writing changed the direction of her life.",
      aboutPageBody:
        settings.aboutPageBody ||
        [
          settings.heroBio,
          "Keisha enjoys creating stories with lighthearted humor that leave a profound message. She’s a testament of what the power of finding and following your purpose can do and aims to inspire others to do the same.",
          "In her spare time, you can find her at a wine tasting event, music or comedy show, traveling, sampling vegan dishes, or simply curled up with a captivating read.",
        ]
          .filter(Boolean)
          .join("\n\n"),
      aboutPageImageAlt: settings.aboutPageImageAlt || "Keisha ‘WriteNow’ Allen",
      aboutPageImage: settings.aboutPageImage || settings.aboutImage || "/images/keisha-profile-c.png",
      aboutPagePrimaryCtaLabel: settings.aboutPagePrimaryCtaLabel || "Explore the books",
      aboutPagePrimaryCtaHref: settings.aboutPagePrimaryCtaHref || "/books",
      aboutPageSecondaryCtaLabel: settings.aboutPageSecondaryCtaLabel || "Contact Keisha",
      aboutPageSecondaryCtaHref: settings.aboutPageSecondaryCtaHref || "/contact",
      aboutPageEnabled: settings.aboutPageEnabled ?? true,
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

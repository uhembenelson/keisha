import type { MetadataRoute } from "next";

import { getCmsContent } from "@/lib/cms";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://keisha-henna.vercel.app").replace(/\/$/, "");

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cms = await getCmsContent();
  const lastModified = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/books`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/merch`, lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/news`, lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/events`, lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/media-press`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/about`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/contact`, lastModified, changeFrequency: "yearly", priority: 0.5 },
  ];

  const bookRoutes: MetadataRoute.Sitemap = cms.books
    .filter((book) => book.published)
    .map((book) => ({
      url: `${siteUrl}/books/${book.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));

  const newsRoutes: MetadataRoute.Sitemap = cms.news
    .filter((item) => item.published)
    .map((item) => ({
      url: `${siteUrl}/news/${item.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

  const eventRoutes: MetadataRoute.Sitemap = cms.events
    .filter((item) => item.published)
    .map((item) => ({
      url: `${siteUrl}/events/${item.id}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

  const mediaRoutes: MetadataRoute.Sitemap = cms.media
    .filter((item) => item.published)
    .map((item) => ({
      url: `${siteUrl}/media-press/${item.id}`,
      lastModified,
      changeFrequency: "yearly" as const,
      priority: 0.5,
    }));

  return [...staticRoutes, ...bookRoutes, ...newsRoutes, ...eventRoutes, ...mediaRoutes];
}

export type CmsSettings = {
  siteName: string;
  heroEyebrow: string;
  heroTitle: string;
  heroAccent: string;
  heroBio: string;
  aboutHeading: string;
  aboutIntro: string;
  homepageStatOneValue: string;
  homepageStatOneTitle: string;
  homepageStatOneDescription: string;
  homepageStatTwoValue: string;
  homepageStatTwoTitle: string;
  homepageStatTwoDescription: string;
  homepageSections: CmsHomepageSection[];
  newsletterTitle: string;
  newsletterCopy: string;
  newsletterExternalUrl: string;
  newsletterExternalLabel: string;
  socialLinks: CmsSocialLink[];
  contactEmail: string;
  heroImage: string;
  aboutImage: string;
  heroFeatureEnabled: boolean;
  heroPromotionType: "book" | "newsletter" | "none";
  heroFeatureBookId: string;
  heroFeatureEyebrow: string;
  heroFeatureCtaLabel: string;
  heroNewsletterTitle: string;
  heroNewsletterCopy: string;
  heroNewsletterCtaLabel: string;
  heroAboutCtaLabel: string;
  homepageAboutKicker: string;
  homepageAboutCtaLabel: string;
  homepageAboutSecondaryImage: string;
  homepageAboutQuote: string;
  homepageBooksKicker: string;
  homepageBooksHeading: string;
  homepageBooksIntro: string;
  homepageBooksDetailCtaLabel: string;
  homepageCreativeKicker: string;
  homepageCreativeHeading: string;
  homepageCreativeIntro: string;
  homepageCreativeRoles: CmsHomepageCreativeRole[];
  homepageFeaturedBookId: string;
  homepageFeaturedBookImage: string;
  homepageFeaturedBookImageAlt: string;
  homepageFeaturedBookEyebrow: string;
  homepageFeaturedBookHeading: string;
  homepageFeaturedBookCopy: string;
  homepageFeaturedBookPrimaryCtaLabel: string;
  homepageFeaturedBookSecondaryCtaLabel: string;
  homepageConnectKicker: string;
  homepageConnectHeading: string;
  homepageConnectIntro: string;
  homepageConnectMediaTitle: string;
  homepageConnectMediaCopy: string;
  homepageConnectEventsTitle: string;
  homepageConnectEventsCopy: string;
  homepageConnectContactTitle: string;
  homepageConnectContactCopy: string;
  homepageContactKicker: string;
  homepageContactHeading: string;
  homepageContactCopy: string;
  homepageContactCtaLabel: string;
  homepageNewsletterKicker: string;
  aboutPageEyebrow: string;
  aboutPageTitle: string;
  aboutPageIntro: string;
  aboutPageKicker: string;
  aboutPageHeading: string;
  aboutPageBody: string;
  aboutPageImage: string;
  aboutPageImageAlt: string;
  aboutPagePrimaryCtaLabel: string;
  aboutPagePrimaryCtaHref: string;
  aboutPageSecondaryCtaLabel: string;
  aboutPageSecondaryCtaHref: string;
  aboutPageEnabled: boolean;
  mediaPageEyebrow: string;
  mediaPageTitle: string;
  mediaPageIntro: string;
  mediaPageHeroImage: string;
  mediaPageHeroImageAlt: string;
  mediaPageImage: string;
  mediaPageImageAlt: string;
  mediaPageResourcesKicker: string;
  mediaPageResourcesTitle: string;
  mediaPageResourcesCopy: string;
  mediaPageInquiryLabel: string;
  mediaPageDetailLabel: string;
  mediaPageOpenLinkFallback: string;
  mediaPageBackLabel: string;
  merchEyebrow: string;
  merchTitle: string;
  merchDescription: string;
  merchComingSoonLabel: string;
};

export type CmsHomepageCreativeRole = {
  id: "writer" | "author" | "speaker" | "publisher";
  title: string;
  copy: string;
};

export type CmsHomepageSectionId =
  | "hero"
  | "about"
  | "books"
  | "creative"
  | "featured-book"
  | "merch"
  | "connect"
  | "newsletter";

export type CmsHomepageSection = {
  id: CmsHomepageSectionId;
  enabled: boolean;
};

export type CmsSocialLink = {
  id: string;
  platform: "Instagram" | "Facebook" | "YouTube" | "TikTok" | "LinkedIn" | "X" | "Other";
  url: string;
};

export const HOMEPAGE_STAT_LIMITS = {
  homepageStatOneValue: 3,
  homepageStatOneTitle: 26,
  homepageStatOneDescription: 71,
  homepageStatTwoValue: 2,
  homepageStatTwoTitle: 16,
  homepageStatTwoDescription: 45,
} as const satisfies Partial<Record<keyof CmsSettings, number>>;

export const HERO_NEWSLETTER_LIMITS = {
  heroNewsletterTitle: 22,
  heroNewsletterCopy: 107,
  heroNewsletterCtaLabel: 21,
} as const satisfies Partial<Record<keyof CmsSettings, number>>;

export function homepageStatsFitLayout(settings: CmsSettings) {
  return (Object.entries(HOMEPAGE_STAT_LIMITS) as [keyof typeof HOMEPAGE_STAT_LIMITS, number][]).every(
    ([key, limit]) => settings[key].length <= limit,
  );
}

export type CmsBook = {
  id: string;
  slug: string;
  title: string;
  category: string;
  price: string;
  availability: "paid" | "free" | "coming-soon";
  purchaseUrl: string;
  retailers: CmsBookRetailer[];
  downloadUrl: string;
  cover: string;
  gallery: string[];
  shortDescription: string;
  description: string;
  published: boolean;
};

export type CmsBookRetailer = {
  id: string;
  name: string;
  url: string;
};

export type CmsNewsItem = {
  id: string;
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  body: string;
  image: string;
  gallery: string[];
  published: boolean;
};

export type CmsEvent = {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  image: string;
  gallery: string[];
  published: boolean;
};

export const CMS_MEDIA_CATEGORIES = [
  "Interviews",
  "Features",
  "Appearances",
  "Videos",
  "Podcast / vlogcast",
  "Press release",
  "Press kit",
] as const;

export type CmsMediaCategory = (typeof CMS_MEDIA_CATEGORIES)[number];

export type CmsMediaItem = {
  id: string;
  title: string;
  type: CmsMediaCategory;
  outlet: string;
  date: string;
  summary: string;
  mediaUrl: string;
  mediaCtaLabel: string;
  image: string;
  gallery: string[];
  published: boolean;
};

export const CMS_MERCH_CATEGORIES = [
  "Books",
  "Apparel",
  "Mugs",
  "Totes",
  "Bookmarks & reading accessories",
  "Limited-edition & signed items",
  "Other",
] as const;

export type CmsMerchCategory = (typeof CMS_MERCH_CATEGORIES)[number];

export type CmsMerchProduct = {
  id: string;
  name: string;
  category: CmsMerchCategory;
  shortDescription: string;
  price: string;
  buyUrl: string;
  buttonText: string;
  image: string;
  published: boolean;
};

export type CmsContent = {
  settings: CmsSettings;
  books: CmsBook[];
  news: CmsNewsItem[];
  events: CmsEvent[];
  media: CmsMediaItem[];
  merch: CmsMerchProduct[];
};

export type ContactInquiryStatus = "new" | "in-progress" | "resolved" | "archived";
export type NewsletterStatus = "active" | "unsubscribed";

export type ContactInquiry = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  source: string;
  status: ContactInquiryStatus;
  note: string;
  createdAt: string;
};

export type NewsletterSubscriber = {
  id: string;
  email: string;
  source: string;
  status: NewsletterStatus;
  note: string;
  createdAt: string;
};

export type CmsSubmissions = {
  inquiries: ContactInquiry[];
  subscribers: NewsletterSubscriber[];
};

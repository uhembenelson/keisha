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
};

export type CmsHomepageSectionId =
  | "hero"
  | "about"
  | "books"
  | "creative"
  | "featured-book"
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

export type CmsMediaItem = {
  id: string;
  title: string;
  type: string;
  outlet: string;
  date: string;
  summary: string;
  mediaUrl: string;
  mediaCtaLabel: string;
  image: string;
  gallery: string[];
  published: boolean;
};

export type CmsContent = {
  settings: CmsSettings;
  books: CmsBook[];
  news: CmsNewsItem[];
  events: CmsEvent[];
  media: CmsMediaItem[];
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

export type CmsSettings = {
  siteName: string;
  heroEyebrow: string;
  heroTitle: string;
  heroAccent: string;
  heroBio: string;
  aboutHeading: string;
  aboutIntro: string;
  newsletterTitle: string;
  newsletterCopy: string;
  contactEmail: string;
  heroImage: string;
  aboutImage: string;
  heroFeatureEnabled: boolean;
  heroFeatureBookId: string;
  heroFeatureEyebrow: string;
  heroFeatureCtaLabel: string;
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

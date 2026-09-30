import type { Metadata } from "next";
import { Cormorant_Garamond, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://keisha-henna.vercel.app").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Keisha ‘WriteNow’ Allen | Author & Creative Entrepreneur",
    template: "%s | Keisha ‘WriteNow’ Allen",
  },
  description:
    "Keisha ‘WriteNow’ Allen is a Miami-based contemporary fiction author, singer, and speaker. Read Worth the Weight and The Love Enthusiast, and follow her creative journey.",
  keywords: [
    "Keisha WriteNow Allen",
    "Keisha Allen author",
    "contemporary fiction",
    "Worth the Weight",
    "The Love Enthusiast",
    "African American author",
    "Black female author",
    "Miami author",
    "romance fiction",
    "women's fiction",
  ],
  authors: [{ name: "Keisha ‘WriteNow’ Allen", url: siteUrl }],
  creator: "Keisha ‘WriteNow’ Allen",
  publisher: "Keisha ‘WriteNow’ Allen",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Keisha ‘WriteNow’ Allen",
    title: "Keisha ‘WriteNow’ Allen | Author & Creative Entrepreneur",
    description:
      "Miami-based contemporary fiction author, singer, and speaker. Read Worth the Weight and The Love Enthusiast, and follow her creative journey.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Keisha ‘WriteNow’ Allen — Author & Creative Entrepreneur",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Keisha ‘WriteNow’ Allen | Author & Creative Entrepreneur",
    description:
      "Miami-based contemporary fiction author, singer, and speaker. Read Worth the Weight and The Love Enthusiast.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "books",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

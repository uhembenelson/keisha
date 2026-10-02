import { Globe2 } from "lucide-react";

import type { CmsSocialLink } from "@/lib/cms-types";

export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M2.5 8.2A3.2 3.2 0 0 1 5.7 5.5h12.6a3.2 3.2 0 0 1 3.2 2.7c.3 2.5.3 5.1 0 7.6a3.2 3.2 0 0 1-3.2 2.7H5.7a3.2 3.2 0 0 1-3.2-2.7 31.5 31.5 0 0 1 0-7.6Z" />
      <path d="m10 9 5 3-5 3Z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M15 4v11.5a4.5 4.5 0 1 1-4-4.47" />
      <path d="M15 4c.45 2.6 1.9 4 4.5 4.5" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M8 11v5" />
      <path d="M8 8v.01" />
      <path d="M12 16v-5" />
      <path d="M12 13.2a2.2 2.2 0 0 1 4.4 0V16" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m5 4 14 16" />
      <path d="M19 4 5 20" />
    </svg>
  );
}

export function SocialIcon({ platform, className }: { platform: CmsSocialLink["platform"]; className?: string }) {
  if (platform === "Instagram") return <InstagramIcon className={className} />;
  if (platform === "Facebook") return <FacebookIcon className={className} />;
  if (platform === "YouTube") return <YouTubeIcon className={className} />;
  if (platform === "TikTok") return <TikTokIcon className={className} />;
  if (platform === "LinkedIn") return <LinkedInIcon className={className} />;
  if (platform === "X") return <XIcon className={className} />;
  return <Globe2 className={className} aria-hidden="true" />;
}

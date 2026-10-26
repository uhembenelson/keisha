export type EmailBlockType = "heading" | "text" | "image" | "button" | "divider" | "spacer" | "social" | "icon";

export type EmailSocialLink = {
  id: string;
  label: string;
  url: string;
};

export type EmailBlock = {
  id: string;
  type: EmailBlockType;
  text: string;
  url: string;
  alt: string;
  label: string;
  align: "left" | "center" | "right";
  color: string;
  backgroundColor: string;
  fontSize: number;
  padding: number;
  borderRadius: number;
  height: number;
  socialLinks: EmailSocialLink[];
};

export type EmailTheme = {
  emailBackground: string;
  contentBackground: string;
  textColor: string;
  accentColor: string;
  fontFamily: "Arial" | "Georgia" | "Verdana" | "Trebuchet MS";
  contentWidth: number;
  logoUrl: string;
  logoAlt: string;
  footerText: string;
};

export type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  preheader: string;
  theme: EmailTheme;
  blocks: EmailBlock[];
  createdAt: string;
  updatedAt: string;
};

export type EmailCampaign = {
  id: string;
  name: string;
  templateId: string;
  templateName: string;
  subject: string;
  audience: "newsletter" | "single" | "custom";
  recipientCount: number;
  status: "sending" | "sent" | "failed";
  sentCount: number;
  failedCount: number;
  error: string;
  createdAt: string;
  sentAt: string;
};

export type EmailStudioSettings = {
  provider: "resend";
  fromName: string;
  fromEmail: string;
  replyTo: string;
  apiKeyConfigured: boolean;
  ready: boolean;
};

export type EmailStudioData = {
  templates: EmailTemplate[];
  campaigns: EmailCampaign[];
  settings: EmailStudioSettings;
  subscribers: Array<{ id: string; email: string; status: string }>;
};

import { cookies } from "next/headers";

import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import type { EmailTemplate } from "@/lib/email-studio-types";
import { sendEmailCampaign } from "@/lib/email-studio";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  if (!isValidAdminSession((await cookies()).get(ADMIN_SESSION_COOKIE)?.value)) return Response.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json().catch(() => null) as { template?: EmailTemplate; audience?: "newsletter" | "single" | "custom"; recipients?: string[]; campaignName?: string } | null;
  if (!body?.template || !body.audience) return Response.json({ error: "Choose an email and audience." }, { status: 400 });
  try {
    const campaign = await sendEmailCampaign({ template: body.template, audience: body.audience, recipients: body.recipients || [], campaignName: body.campaignName || body.template.name, siteUrl: process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin });
    return Response.json({ campaign });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "The campaign could not be sent." }, { status: 502 });
  }
}

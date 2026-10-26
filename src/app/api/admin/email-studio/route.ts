import { cookies } from "next/headers";

import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import type { EmailTemplate } from "@/lib/email-studio-types";
import { createDefaultEmailTemplate, deleteEmailTemplate, getEmailStudioData, saveEmailStudioSettings, saveEmailTemplate } from "@/lib/email-studio";

export const runtime = "nodejs";

async function authorized() {
  return isValidAdminSession((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
}

export async function GET() {
  if (!(await authorized())) return Response.json({ error: "Authentication required." }, { status: 401 });
  return Response.json(await getEmailStudioData());
}

export async function POST(request: Request) {
  if (!(await authorized())) return Response.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json().catch(() => null) as { action?: string; template?: EmailTemplate } | null;
  try {
    if (body?.action === "new-template") return Response.json({ template: createDefaultEmailTemplate() });
    if (body?.action === "save-template" && body.template) return Response.json({ template: await saveEmailTemplate(body.template) });
    return Response.json({ error: "Invalid Email Studio request." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "The email template could not be saved." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!(await authorized())) return Response.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json().catch(() => null) as { apiKey?: string; fromName?: string; fromEmail?: string; replyTo?: string } | null;
  try {
    const settings = await saveEmailStudioSettings({ apiKey: body?.apiKey, fromName: body?.fromName || "", fromEmail: body?.fromEmail || "", replyTo: body?.replyTo || "" });
    return Response.json({ settings });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Email settings could not be saved." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  if (!(await authorized())) return Response.json({ error: "Authentication required." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id") || "";
  return (await deleteEmailTemplate(id)) ? Response.json({ ok: true }) : Response.json({ error: "Template not found." }, { status: 404 });
}

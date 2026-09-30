import { randomUUID } from "node:crypto";

import { addInquiry } from "@/lib/submissions";

export const runtime = "nodejs";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (body?.website) return Response.json({ ok: true });

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const source = typeof body?.source === "string" ? body.source.slice(0, 80) : "Website contact form";

  if (!name || name.length > 120 || !emailPattern.test(email) || email.length > 254 || !subject || subject.length > 200 || !message || message.length > 5000) {
    return Response.json({ error: "Please complete every field with valid information." }, { status: 400 });
  }

  await addInquiry({ id: randomUUID(), name, email, subject, message, source, status: "new", note: "", createdAt: new Date().toISOString() });
  return Response.json({ ok: true }, { status: 201 });
}

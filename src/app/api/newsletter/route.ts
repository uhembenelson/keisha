import { randomUUID } from "node:crypto";

import { addSubscriber } from "@/lib/submissions";

export const runtime = "nodejs";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (body?.website) return Response.json({ ok: true });

  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const source = typeof body?.source === "string" ? body.source.slice(0, 80) : "Website newsletter form";
  if (!emailPattern.test(email) || email.length > 254) return Response.json({ error: "Enter a valid email address." }, { status: 400 });

  const result = await addSubscriber({ id: randomUUID(), email, source, status: "active", note: "", createdAt: new Date().toISOString() });
  return Response.json({ ok: true, existed: result.existed }, { status: result.existed ? 200 : 201 });
}

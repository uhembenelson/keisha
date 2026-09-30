import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE, createAdminSessionToken } from "@/lib/admin-auth";

export const runtime = "nodejs";

function safelyMatches(value: string, expected: string) {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);
  return valueBuffer.length === expectedBuffer.length && timingSafeEqual(valueBuffer, expectedBuffer);
}

export async function POST(request: Request) {
  const configuredEmail = process.env.CMS_ADMIN_EMAIL;
  const configuredPassword = process.env.CMS_ADMIN_PASSWORD;
  const sessionSecret = process.env.CMS_SESSION_SECRET;

  if (!configuredEmail || !configuredPassword || !sessionSecret) {
    return Response.json({ error: "Admin login has not been configured." }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as { email?: string; password?: string } | null;
  const emailMatches = safelyMatches(body?.email?.trim().toLowerCase() ?? "", configuredEmail.trim().toLowerCase());
  const passwordMatches = safelyMatches(body?.password ?? "", configuredPassword);

  if (!emailMatches || !passwordMatches) {
    return Response.json({ error: "The email or password is incorrect." }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, await createAdminSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });

  return Response.json({ ok: true });
}

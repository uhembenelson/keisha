import { cookies } from "next/headers";

import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { getCmsContent, isCmsContent, saveCmsContent } from "@/lib/cms";

export const runtime = "nodejs";

async function isAuthorized() {
  const session = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  return isValidAdminSession(session);
}

export async function GET() {
  if (!(await isAuthorized())) return Response.json({ error: "Authentication required." }, { status: 401 });
  return Response.json(await getCmsContent());
}

export async function PUT(request: Request) {
  if (!(await isAuthorized())) return Response.json({ error: "Authentication required." }, { status: 401 });

  const body: unknown = await request.json().catch(() => null);
  if (!isCmsContent(body)) {
    return Response.json({ error: "The submitted content is not valid." }, { status: 400 });
  }

  await saveCmsContent(body);
  return Response.json({ ok: true, content: body });
}

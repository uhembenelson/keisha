import { cookies } from "next/headers";

import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { getMongoStatus } from "@/lib/mongodb";

export async function GET() {
  const authenticated = await isValidAdminSession((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
  if (!authenticated) return Response.json({ error: "Authentication required." }, { status: 401 });
  try {
    return Response.json(await getMongoStatus());
  } catch {
    return Response.json({ configured: true, connected: false, mode: "mongodb", error: "MongoDB could not be reached." }, { status: 503 });
  }
}

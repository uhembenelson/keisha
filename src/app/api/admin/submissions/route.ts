import { cookies } from "next/headers";

import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import type { CmsSubmissions, ContactInquiryStatus, NewsletterStatus } from "@/lib/cms-types";
import { deleteSubmission, getSubmissions, updateSubmission } from "@/lib/submissions";

async function authorized() {
  return isValidAdminSession((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
}

function validCollection(value: unknown): value is keyof CmsSubmissions {
  return value === "inquiries" || value === "subscribers";
}

export async function GET() {
  if (!(await authorized())) return Response.json({ error: "Authentication required." }, { status: 401 });
  return Response.json(await getSubmissions());
}

export async function PATCH(request: Request) {
  if (!(await authorized())) return Response.json({ error: "Authentication required." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { collection?: unknown; id?: unknown; status?: unknown; note?: unknown } | null;
  if (!body || !validCollection(body.collection) || typeof body.id !== "string") return Response.json({ error: "Invalid request." }, { status: 400 });

  const validInquiryStatuses: ContactInquiryStatus[] = ["new", "in-progress", "resolved", "archived"];
  const validSubscriberStatuses: NewsletterStatus[] = ["active", "unsubscribed"];
  const statuses = body.collection === "inquiries" ? validInquiryStatuses : validSubscriberStatuses;
  const changes: Record<string, unknown> = {};
  if (typeof body.status === "string" && statuses.includes(body.status as never)) changes.status = body.status;
  if (typeof body.note === "string") changes.note = body.note.slice(0, 2000);
  if (Object.keys(changes).length === 0) return Response.json({ error: "No valid changes were supplied." }, { status: 400 });

  const entry = await updateSubmission(body.collection, body.id, changes);
  return entry ? Response.json({ ok: true, entry }) : Response.json({ error: "Entry not found." }, { status: 404 });
}

export async function DELETE(request: Request) {
  if (!(await authorized())) return Response.json({ error: "Authentication required." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { collection?: unknown; id?: unknown } | null;
  if (!body || !validCollection(body.collection) || typeof body.id !== "string") return Response.json({ error: "Invalid request." }, { status: 400 });
  return (await deleteSubmission(body.collection, body.id)) ? Response.json({ ok: true }) : Response.json({ error: "Entry not found." }, { status: 404 });
}

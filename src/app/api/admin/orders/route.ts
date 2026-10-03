import { cookies } from "next/headers";

import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { getMongoDatabase } from "@/lib/mongodb";

export const runtime = "nodejs";

async function authorized() {
  return isValidAdminSession((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
}

export async function GET() {
  if (!(await authorized())) return Response.json({ error: "Authentication required." }, { status: 401 });
  const database = await getMongoDatabase();
  if (!database) return Response.json({ orders: [] });
  const orders = await database.collection("merch_orders").find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).limit(250).toArray();
  return Response.json({ orders });
}

export async function PATCH(request: Request) {
  if (!(await authorized())) return Response.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json().catch(() => null) as { id?: string; status?: string } | null;
  const statuses = ["pending", "paid", "processing", "fulfilled", "cancelled", "refunded", "payment-failed"];
  if (!body?.id || !body.status || !statuses.includes(body.status)) return Response.json({ error: "Invalid order update." }, { status: 400 });
  const database = await getMongoDatabase();
  if (!database) return Response.json({ error: "Order storage is unavailable." }, { status: 503 });
  await database.collection("merch_orders").updateOne({ id: body.id }, { $set: { status: body.status, updatedAt: new Date().toISOString() } });
  return Response.json({ ok: true });
}

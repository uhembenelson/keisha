import { getMongoDatabase } from "@/lib/mongodb";

export const runtime = "nodejs";

type DigitalOrder = {
  stripeSessionId?: string;
  orderType?: string;
  format?: string;
  status?: string;
  digitalDownloadUrl?: string;
  presale?: boolean;
  presaleReleaseDate?: string;
  digitalReleasedAt?: string;
};

function safeTarget(value: string) {
  const target = value.trim();
  if (/^https?:\/\//i.test(target)) {
    try {
      const url = new URL(target);
      return !url.username && !url.password ? url.toString() : "";
    } catch {
      return "";
    }
  }
  if (/^\/(?!\/)[A-Za-z0-9/_.,%+~?=&-]+$/.test(target) && !target.split("?")[0].split("/").includes("..")) return target;
  return "";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id")?.trim();
  if (!sessionId || !sessionId.startsWith("cs_")) return Response.json({ kind: "unknown", ready: false }, { status: 400, headers: { "cache-control": "no-store" } });
  const database = await getMongoDatabase();
  if (!database) return Response.json({ kind: "unknown", ready: false }, { status: 503, headers: { "cache-control": "no-store" } });

  const order = await database.collection("merch_orders").findOne({ stripeSessionId: sessionId }, { projection: { _id: 0, stripeSessionId: 1, orderType: 1, format: 1, status: 1, digitalDownloadUrl: 1, presale: 1, presaleReleaseDate: 1, digitalReleasedAt: 1 } }) as DigitalOrder | null;
  if (!order || order.orderType !== "book" || order.format !== "digital") {
    return Response.json({ kind: "other", ready: false }, { headers: { "cache-control": "no-store" } });
  }
  if (order.status !== "paid") {
    return Response.json({ kind: "digital", ready: false, paid: false }, { headers: { "cache-control": "no-store" } });
  }
  if (order.presale === true && !order.digitalReleasedAt) {
    if (url.searchParams.get("check") === "1") return Response.json({ kind: "digital", ready: false, releasePending: true, releaseDate: order.presaleReleaseDate || "" }, { headers: { "cache-control": "no-store" } });
    return Response.json({ error: "This preorder download has not been released yet.", releaseDate: order.presaleReleaseDate || "" }, { status: 403, headers: { "cache-control": "no-store" } });
  }

  const target = safeTarget(order.digitalDownloadUrl || "");
  if (!target) return Response.json({ kind: "digital", ready: false, error: "The download link is unavailable. Please contact us." }, { status: 503, headers: { "cache-control": "no-store" } });
  if (url.searchParams.get("check") === "1") return Response.json({ kind: "digital", ready: true }, { headers: { "cache-control": "no-store" } });

  const destination = new URL(target, url.origin);
  if (destination.origin === url.origin && /^\/api\/uploads\/[a-f\d]{24}$/i.test(destination.pathname)) {
    destination.searchParams.set("session_id", sessionId);
  }
  return Response.redirect(destination.toString(), 302);
}

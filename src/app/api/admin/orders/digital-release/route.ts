import { cookies } from "next/headers";

import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { sendTransactionalEmail } from "@/lib/email-studio";
import { getMongoDatabase } from "@/lib/mongodb";

export const runtime = "nodejs";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] || character);
}

export async function POST(request: Request) {
  if (!isValidAdminSession((await cookies()).get(ADMIN_SESSION_COOKIE)?.value)) return Response.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json().catch(() => null) as { orderId?: string } | null;
  const database = await getMongoDatabase();
  if (!database) return Response.json({ error: "Order storage is unavailable." }, { status: 503 });
  const order = await database.collection("merch_orders").findOne({ id: body?.orderId, orderType: "book", format: "digital", presale: true });
  if (!order || order.status !== "paid") return Response.json({ error: "Only paid digital preorders can be released." }, { status: 400 });
  if (!order.presaleReleaseDate || order.presaleReleaseDate > new Date().toISOString().slice(0, 10)) {
    return Response.json({ error: "Digital downloads can be released on or after the configured release date.", releaseDate: order.presaleReleaseDate || "" }, { status: 409 });
  }
  if (!order.customerEmail || !order.stripeSessionId) return Response.json({ error: "This order is missing its payment email or download session." }, { status: 400 });

  const releasedAt = String(order.digitalReleasedAt || new Date().toISOString());
  await database.collection("merch_orders").updateOne({ id: order.id, status: "paid" }, { $set: { digitalReleasedAt: releasedAt, updatedAt: new Date().toISOString() } });
  const title = String(order.items?.[0]?.name || "your book");
  const origin = (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, "");
  const downloadUrl = origin + "/api/checkout/book/download?session_id=" + encodeURIComponent(String(order.stripeSessionId));
  let emailError = "";
  try {
    await sendTransactionalEmail({
      to: String(order.customerEmail),
      subject: "Your preorder download is ready: " + title,
      html: "<main style=\"margin:0 auto;max-width:600px;padding:36px 24px;background:#fffaf1;color:#29271f;font-family:Georgia,serif\"><p style=\"color:#7f2737;font:700 12px Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase\">Keisha WriteNow Allen</p><h1 style=\"font-size:32px;line-height:1.15\">Your preorder is ready.</h1><p style=\"font:16px/1.7 Arial,sans-serif\">Your digital copy of " + escapeHtml(title) + " is available now.</p><p style=\"margin:28px 0\"><a href=\"" + escapeHtml(downloadUrl) + "\" style=\"display:inline-block;padding:14px 24px;background:#7f2737;color:#fff3df;font:700 15px Arial,sans-serif;text-decoration:none\">Download your book</a></p></main>",
      text: "Your digital copy of " + title + " is available now. Download it here: " + downloadUrl,
      idempotencyKey: "presale/" + String(order.id) + "/digital-release",
    });
  } catch (error) {
    emailError = error instanceof Error ? error.message : "The release email could not be sent.";
  }
  const emailSentAt = emailError ? String(order.digitalReleaseEmailSentAt || "") : new Date().toISOString();
  await database.collection("merch_orders").updateOne({ id: order.id }, { $set: { digitalReleaseEmailSentAt: emailSentAt, digitalReleaseEmailError: emailError, updatedAt: new Date().toISOString() } });
  return Response.json({ ok: true, emailError, order: { ...order, digitalReleasedAt: releasedAt, digitalReleaseEmailSentAt: emailSentAt, digitalReleaseEmailError: emailError } });
}

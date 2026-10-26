import { cookies } from "next/headers";

import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { getPrintfulSettings, printfulReady, printfulRequest, savePrintfulSettings } from "@/lib/printful";

export const runtime = "nodejs";

async function authorized() {
  return isValidAdminSession((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
}

export async function GET() {
  if (!(await authorized())) return Response.json({ error: "Authentication required." }, { status: 401 });
  const settings = await getPrintfulSettings();
  return Response.json({
    storeId: settings?.storeId || "",
    fulfillmentEnabled: settings?.fulfillmentEnabled === true,
    autoConfirm: settings?.autoConfirm === true,
    tokenConfigured: Boolean(settings?.token),
    connected: printfulReady(settings),
    webhookPath: "/api/printful/webhook",
  });
}

export async function PUT(request: Request) {
  if (!(await authorized())) return Response.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json().catch(() => null) as { token?: string; storeId?: string; fulfillmentEnabled?: boolean; autoConfirm?: boolean } | null;
  const token = body?.token?.trim() || "";
  const storeId = body?.storeId?.trim() || "";
  if (token && token.length < 20) return Response.json({ error: "Enter a valid Printful private token." }, { status: 400 });
  const current = await getPrintfulSettings();
  const candidate = { token: token || current?.token || "", storeId, fulfillmentEnabled: body?.fulfillmentEnabled === true, autoConfirm: body?.autoConfirm === true, webhookSecret: current?.webhookSecret || "" };
  if (!candidate.token) return Response.json({ error: "Enter your Printful private token." }, { status: 400 });
  try {
    await printfulRequest("/store/products?limit=1", {}, candidate);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Printful connection failed." }, { status: 400 });
  }
  await savePrintfulSettings({ token, storeId, fulfillmentEnabled: body?.fulfillmentEnabled === true, autoConfirm: body?.autoConfirm === true });
  const settings = await getPrintfulSettings();
  let webhookConfigured = false;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, "");
  if (siteUrl && settings?.webhookSecret) {
    try {
      await printfulRequest("/webhooks", { method: "POST", body: JSON.stringify({ url: `${siteUrl}/api/printful/webhook?secret=${encodeURIComponent(settings.webhookSecret)}`, types: ["package_shipped", "order_failed", "order_canceled", "product_synced", "product_updated"] }) }, settings);
      webhookConfigured = true;
    } catch {
      webhookConfigured = false;
    }
  }
  return Response.json({ ok: true, storeId: settings?.storeId || "", fulfillmentEnabled: settings?.fulfillmentEnabled === true, autoConfirm: settings?.autoConfirm === true, tokenConfigured: Boolean(settings?.token), connected: true, webhookConfigured });
}

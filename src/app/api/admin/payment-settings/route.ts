import { cookies } from "next/headers";

import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { getPaymentSettings, paymentSettingsReady, savePaymentSettings } from "@/lib/payment-settings";

export const runtime = "nodejs";

async function authorized() {
  return isValidAdminSession((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
}

export async function GET() {
  if (!(await authorized())) return Response.json({ error: "Authentication required." }, { status: 401 });
  const settings = await getPaymentSettings();
  return Response.json({
    publishableKey: settings?.publishableKey || "",
    secretKeyConfigured: Boolean(settings?.secretKey),
    webhookSecretConfigured: Boolean(settings?.webhookSecret),
    ready: paymentSettingsReady(settings),
  });
}

export async function PUT(request: Request) {
  if (!(await authorized())) return Response.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json().catch(() => null) as { publishableKey?: string; secretKey?: string; webhookSecret?: string } | null;
  const publishableKey = body?.publishableKey?.trim() || "";
  const secretKey = body?.secretKey?.trim() || "";
  const webhookSecret = body?.webhookSecret?.trim() || "";
  if (publishableKey && !/^pk_(test|live)_/.test(publishableKey)) return Response.json({ error: "Enter a valid Stripe publishable key." }, { status: 400 });
  if (secretKey && !/^sk_(test|live)_/.test(secretKey)) return Response.json({ error: "Enter a valid Stripe secret key." }, { status: 400 });
  if (webhookSecret && !/^whsec_/.test(webhookSecret)) return Response.json({ error: "Enter a valid Stripe webhook secret." }, { status: 400 });
  await savePaymentSettings({ publishableKey, secretKey, webhookSecret });
  const settings = await getPaymentSettings();
  return Response.json({ ok: true, publishableKey: settings?.publishableKey || "", secretKeyConfigured: Boolean(settings?.secretKey), webhookSecretConfigured: Boolean(settings?.webhookSecret), ready: paymentSettingsReady(settings) });
}

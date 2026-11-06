import { cookies } from "next/headers";

import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { defaultShippingSettings, getShippingSettings, isShippingTestMode, saveShippingSettings, shippingProvider, shippingSettingsProblems, shippingSettingsReady, testShippingConnection, type ShippingAddress } from "@/lib/shipping";

export const runtime = "nodejs";

async function authorized() { return isValidAdminSession((await cookies()).get(ADMIN_SESSION_COOKIE)?.value); }

function publicSettings(settings: Awaited<ReturnType<typeof getShippingSettings>>) {
  const value = settings || defaultShippingSettings;
  return {
    token: "",
    tokenConfigured: Boolean(settings?.token),
    easypostKey: "",
    easypostKeyConfigured: Boolean(settings?.easypostKey),
    provider: shippingProvider(settings),
    ready: shippingSettingsReady(settings),
    testMode: isShippingTestMode(settings),
    labelPurchaseEnabled: value.labelPurchaseEnabled,
    autoPurchase: value.autoPurchase,
    sender: value.sender,
    parcel: value.parcel,
  };
}

export async function GET() {
  if (!(await authorized())) return Response.json({ error: "Authentication required." }, { status: 401 });
  return Response.json(publicSettings(await getShippingSettings()));
}

export async function PUT(request: Request) {
  if (!(await authorized())) return Response.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json().catch(() => null) as { token?: string; easypostKey?: string; labelPurchaseEnabled?: boolean; autoPurchase?: boolean; sender?: Partial<ShippingAddress>; parcel?: Record<string, string> } | null;
  const current = await getShippingSettings();
  const token = body?.token?.trim() || current?.token || "";
  const easypostKey = body?.easypostKey?.trim() || current?.easypostKey || "";
  if (!easypostKey && !/^shippo_(test|live)_[A-Za-z0-9]+$/.test(token)) return Response.json({ error: "Enter a valid Shippo test or live API token, or an EasyPost API key." }, { status: 400 });
  if (easypostKey && !/^EZ(TK|AK)[A-Za-z0-9]+$/.test(easypostKey)) return Response.json({ error: "Enter a valid EasyPost test (EZTK…) or production (EZAK…) API key." }, { status: 400 });
  const sender = {
    ...defaultShippingSettings.sender,
    name: String(body?.sender?.name || "").trim(),
    email: String(body?.sender?.email || "").trim(),
    phone: String(body?.sender?.phone || "").trim(),
    street1: String(body?.sender?.street1 || "").trim(),
    street2: String(body?.sender?.street2 || "").trim(),
    city: String(body?.sender?.city || "").trim(),
    state: String(body?.sender?.state || "").trim().toUpperCase(),
    zip: String(body?.sender?.zip || "").trim(),
    country: "US" as const,
  };
  const parcel = {
    length: String(body?.parcel?.length || "").trim(),
    width: String(body?.parcel?.width || "").trim(),
    height: String(body?.parcel?.height || "").trim(),
    weight: String(body?.parcel?.weight || "").trim(),
  };
  const settings = { token, easypostKey, labelPurchaseEnabled: body?.labelPurchaseEnabled === true, autoPurchase: body?.autoPurchase === true, sender, parcel };
  const problems = shippingSettingsProblems(settings);
  if (problems.length) return Response.json({ error: `Complete or correct: ${problems.join(", ")}.` }, { status: 400 });
  try { await testShippingConnection(settings); } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Shipping connection failed." }, { status: 400 }); }
  await saveShippingSettings(settings);
  return Response.json({ ok: true, ...publicSettings(await getShippingSettings()) });
}

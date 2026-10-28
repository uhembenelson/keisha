import { cookies } from "next/headers";

import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { defaultShippingSettings, getShippingSettings, isShippoTestMode, saveShippingSettings, shippingSettingsProblems, shippingSettingsReady, testShippoConnection, type ShippingAddress } from "@/lib/shipping";

export const runtime = "nodejs";

async function authorized() { return isValidAdminSession((await cookies()).get(ADMIN_SESSION_COOKIE)?.value); }

function publicSettings(settings: Awaited<ReturnType<typeof getShippingSettings>>) {
  const value = settings || defaultShippingSettings;
  return { token: "", tokenConfigured: Boolean(settings?.token), ready: shippingSettingsReady(settings), testMode: isShippoTestMode(settings), labelPurchaseEnabled: value.labelPurchaseEnabled, autoPurchase: value.autoPurchase, sender: value.sender, parcel: value.parcel };
}

export async function GET() {
  if (!(await authorized())) return Response.json({ error: "Authentication required." }, { status: 401 });
  return Response.json(publicSettings(await getShippingSettings()));
}

export async function PUT(request: Request) {
  if (!(await authorized())) return Response.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json().catch(() => null) as { token?: string; labelPurchaseEnabled?: boolean; autoPurchase?: boolean; sender?: Partial<ShippingAddress>; parcel?: Record<string, string> } | null;
  const current = await getShippingSettings();
  const token = body?.token?.trim() || current?.token || "";
  if (!/^shippo_(test|live)_[A-Za-z0-9]+$/.test(token)) return Response.json({ error: "Enter a valid Shippo test or live API token." }, { status: 400 });
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
  const settings = { token, labelPurchaseEnabled: body?.labelPurchaseEnabled === true, autoPurchase: body?.autoPurchase === true, sender, parcel };
  const problems = shippingSettingsProblems(settings);
  if (problems.length) return Response.json({ error: `Complete or correct: ${problems.join(", ")}.` }, { status: 400 });
  try { await testShippoConnection(settings); } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Shippo connection failed." }, { status: 400 }); }
  await saveShippingSettings(settings);
  return Response.json({ ok: true, ...publicSettings(await getShippingSettings()) });
}

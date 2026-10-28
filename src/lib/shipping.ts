import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import { getMongoDatabase } from "@/lib/mongodb";

export type ShippingAddress = {
  name: string;
  email: string;
  phone: string;
  street1: string;
  street2: string;
  city: string;
  state: string;
  zip: string;
  country: "US";
};

export type ShippingSettings = {
  token: string;
  labelPurchaseEnabled: boolean;
  autoPurchase: boolean;
  sender: ShippingAddress;
  parcel: { length: string; width: string; height: string; weight: string };
};

export type ShippingRate = {
  id: string;
  provider: string;
  service: string;
  amount: number;
  currency: string;
  estimatedDays: number | null;
  durationTerms: string;
};

type StoredShippingSettings = Omit<ShippingSettings, "token"> & {
  _id: "shippo";
  tokenEncrypted: string;
  updatedAt: string;
};

const emptyAddress: ShippingAddress = { name: "", email: "", phone: "", street1: "", street2: "", city: "", state: "", zip: "", country: "US" };
export const defaultShippingSettings: ShippingSettings = {
  token: "",
  labelPurchaseEnabled: false,
  autoPurchase: false,
  sender: emptyAddress,
  parcel: { length: "10", width: "7", height: "2", weight: "1" },
};

function encryptionKey() {
  const source = process.env.CMS_SESSION_SECRET?.trim();
  if (!source) throw new Error("CMS_SESSION_SECRET is required before Shippo credentials can be saved.");
  return createHash("sha256").update(source).digest();
}

function encrypt(value: string) {
  if (!value) return "";
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString("base64url")).join(".");
}

function decrypt(value: string) {
  if (!value) return "";
  const [iv, tag, encrypted] = value.split(".").map((part) => Buffer.from(part, "base64url"));
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export async function getShippingSettings(): Promise<ShippingSettings | null> {
  const database = await getMongoDatabase();
  if (!database) return null;
  const stored = await database.collection<StoredShippingSettings>("integration_settings").findOne({ _id: "shippo" });
  if (!stored) return null;
  return {
    token: decrypt(stored.tokenEncrypted),
    labelPurchaseEnabled: stored.labelPurchaseEnabled === true,
    autoPurchase: stored.autoPurchase === true,
    sender: { ...emptyAddress, ...stored.sender, country: "US" },
    parcel: { ...defaultShippingSettings.parcel, ...stored.parcel },
  };
}

export async function saveShippingSettings(input: ShippingSettings) {
  const database = await getMongoDatabase();
  if (!database) throw new Error("MongoDB must be connected before Shippo settings can be saved.");
  const collection = database.collection<StoredShippingSettings>("integration_settings");
  const current = await collection.findOne({ _id: "shippo" });
  await collection.updateOne(
    { _id: "shippo" },
    {
      $set: {
        tokenEncrypted: input.token ? encrypt(input.token) : current?.tokenEncrypted || "",
        labelPurchaseEnabled: input.labelPurchaseEnabled,
        autoPurchase: input.labelPurchaseEnabled && input.autoPurchase,
        sender: { ...input.sender, country: "US" },
        parcel: input.parcel,
        updatedAt: new Date().toISOString(),
      },
      $setOnInsert: { _id: "shippo" },
    },
    { upsert: true },
  );
}

export function shippingSettingsReady(settings: ShippingSettings | null) {
  return shippingSettingsProblems(settings).length === 0;
}

export function shippingSettingsProblems(settings: ShippingSettings | null) {
  if (!settings) return ["Shippo API token"];
  const problems: string[] = [];
  const { sender, parcel } = settings;
  if (!settings.token.trim()) problems.push("Shippo API token");
  if (!sender.name.trim()) problems.push("sender or business name");
  if (!sender.email.trim()) problems.push("sender email");
  if (!sender.phone.trim()) problems.push("sender phone");
  if (!sender.street1.trim()) problems.push("street address");
  if (!sender.city.trim()) problems.push("city");
  if (!sender.state.trim()) problems.push("state code");
  if (!sender.zip.trim()) problems.push("ZIP code");
  if (!(Number(parcel.length) > 0)) problems.push("package length");
  if (!(Number(parcel.width) > 0)) problems.push("package width");
  if (!(Number(parcel.height) > 0)) problems.push("package height");
  if (!(Number(parcel.weight) > 0)) problems.push("book weight");
  return problems;
}

export function isShippoTestMode(settings: ShippingSettings | null) {
  return Boolean(settings?.token.startsWith("shippo_test_"));
}

async function shippoRequest<T>(path: string, settings: ShippingSettings, init?: RequestInit): Promise<T> {
  const response = await fetch(`https://api.goshippo.com${path}`, {
    ...init,
    headers: {
      authorization: `ShippoToken ${settings.token}`,
      "content-type": "application/json",
      "shippo-api-version": "2018-02-08",
      ...init?.headers,
    },
    cache: "no-store",
  });
  const result = await response.json().catch(() => ({})) as T & { detail?: string; message?: string; messages?: { text?: string }[] };
  if (!response.ok) throw new Error(result.detail || result.message || result.messages?.[0]?.text || `Shippo request failed (${response.status}).`);
  return result;
}

export async function testShippoConnection(settings: ShippingSettings) {
  await shippoRequest<{ results?: unknown[] }>("/carrier_accounts/?results=1", settings);
}

export async function createShippingRates(settings: ShippingSettings, address: ShippingAddress, quantity: number): Promise<{ shipmentId: string; rates: ShippingRate[] }> {
  const weight = Math.max(0.1, Number(settings.parcel.weight) * quantity).toFixed(2);
  const shipment = await shippoRequest<{
    object_id?: string;
    rates?: Array<{ object_id?: string; provider?: string; amount?: string; currency?: string; estimated_days?: number; duration_terms?: string; servicelevel?: { name?: string } }>;
    messages?: { text?: string }[];
  }>("/shipments/", settings, {
    method: "POST",
    body: JSON.stringify({
      address_from: settings.sender,
      address_to: address,
      parcels: [{ ...settings.parcel, weight, distance_unit: "in", mass_unit: "lb" }],
      async: false,
    }),
  });
  const rates = (shipment.rates || []).map((rate) => ({
    id: rate.object_id || "",
    provider: rate.provider || "Carrier",
    service: rate.servicelevel?.name || "Shipping",
    amount: Math.round(Number(rate.amount || 0) * 100),
    currency: (rate.currency || "USD").toLowerCase(),
    estimatedDays: Number.isFinite(rate.estimated_days) ? Number(rate.estimated_days) : null,
    durationTerms: rate.duration_terms || "",
  })).filter((rate) => rate.id && rate.amount > 0 && rate.currency === "usd").sort((a, b) => a.amount - b.amount);
  if (!shipment.object_id || rates.length === 0) throw new Error(shipment.messages?.[0]?.text || "No shipping services are available for this address.");
  return { shipmentId: shipment.object_id, rates };
}

export async function purchaseShippingLabel(settings: ShippingSettings, rateId: string, orderId: string) {
  const transaction = await shippoRequest<{
    object_id?: string;
    status?: string;
    label_url?: string;
    tracking_number?: string;
    tracking_url_provider?: string;
    messages?: { text?: string }[];
  }>("/transactions/", settings, { method: "POST", body: JSON.stringify({ rate: rateId, label_file_type: "PDF", async: false, metadata: `order:${orderId}` }) });
  if (transaction.status !== "SUCCESS" || !transaction.label_url) throw new Error(transaction.messages?.[0]?.text || "Shippo could not purchase this shipping label.");
  return transaction;
}

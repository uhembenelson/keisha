import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import { getMongoDatabase } from "@/lib/mongodb";
import { isValidUsZip } from "@/lib/us-states";

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
  easypostKey: string;
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

type StoredShippingSettings = Omit<ShippingSettings, "token" | "easypostKey"> & {
  _id: "shippo";
  tokenEncrypted: string;
  easypostKeyEncrypted?: string;
  updatedAt: string;
};

const emptyAddress: ShippingAddress = { name: "", email: "", phone: "", street1: "", street2: "", city: "", state: "", zip: "", country: "US" };
export const defaultShippingSettings: ShippingSettings = {
  token: "",
  easypostKey: "",
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
    easypostKey: decrypt(stored.easypostKeyEncrypted || ""),
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
        easypostKeyEncrypted: input.easypostKey ? encrypt(input.easypostKey) : current?.easypostKeyEncrypted || "",
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
  if (!settings) return ["a shipping provider key"];
  const problems: string[] = [];
  const { sender, parcel } = settings;
  if (!settings.easypostKey.trim() && !settings.token.trim()) problems.push("EasyPost API key or Shippo API token");
  if (!sender.name.trim()) problems.push("sender or business name");
  if (!sender.email.trim()) problems.push("sender email");
  if (!sender.phone.trim()) problems.push("sender phone");
  if (!sender.street1.trim()) problems.push("street address");
  if (!sender.city.trim()) problems.push("city");
  if (!sender.state.trim()) problems.push("state code");
  if (!isValidUsZip(sender.zip)) problems.push("ZIP code");
  if (!(Number(parcel.length) > 0)) problems.push("package length");
  if (!(Number(parcel.width) > 0)) problems.push("package width");
  if (!(Number(parcel.height) > 0)) problems.push("package height");
  if (!(Number(parcel.weight) > 0)) problems.push("book weight");
  return problems;
}

export function isShippoTestMode(settings: ShippingSettings | null) {
  return Boolean(settings?.token.startsWith("shippo_test_"));
}

export type ShippingProvider = "easypost" | "shippo";

export function shippingProvider(settings: ShippingSettings | null): ShippingProvider {
  return settings?.easypostKey.trim() ? "easypost" : "shippo";
}

export function isShippingTestMode(settings: ShippingSettings | null) {
  if (shippingProvider(settings) === "easypost") return Boolean(settings?.easypostKey.startsWith("EZTK"));
  return isShippoTestMode(settings);
}

const shippoTimeoutMs = 25_000;

export class ShippoTimeoutError extends Error {
  constructor() {
    super("Shippo took too long to answer. Please try calculating shipping again.");
    this.name = "ShippoTimeoutError";
  }
}

async function shippoRequest<T>(path: string, settings: ShippingSettings, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`https://api.goshippo.com${path}`, {
      ...init,
      headers: {
        authorization: `ShippoToken ${settings.token}`,
        "content-type": "application/json",
        "shippo-api-version": "2018-02-08",
        ...init?.headers,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(shippoTimeoutMs),
    });
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) throw new ShippoTimeoutError();
    throw new Error(error instanceof Error && error.message ? `Shippo could not be reached: ${error.message}` : "Shippo could not be reached.");
  }
  const result = await response.json().catch(() => ({})) as T & { detail?: string; message?: string; messages?: { text?: string }[] };
  if (!response.ok) throw new Error(result.detail || result.message || result.messages?.[0]?.text || `Shippo request failed (${response.status}).`);
  return result;
}

export async function testShippoConnection(settings: ShippingSettings) {
  await shippoRequest<{ results?: unknown[] }>("/carrier_accounts/?results=1", settings);
}

const easypostTimeoutMs = 25_000;
const easypostBase = "https://api.easypost.com/v2";

export class ShippingTimeoutError extends Error {
  constructor(provider: string) {
    super(`${provider} took too long to answer. Please try calculating shipping again.`);
    this.name = "ShippingTimeoutError";
  }
}

async function easypostRequest<T>(path: string, settings: ShippingSettings, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${easypostBase}${path}`, {
      ...init,
      headers: {
        authorization: `Basic ${Buffer.from(`${settings.easypostKey}:`).toString("base64")}`,
        "content-type": "application/json",
        ...init?.headers,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(easypostTimeoutMs),
    });
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) throw new ShippingTimeoutError("EasyPost");
    throw new Error(error instanceof Error && error.message ? `EasyPost could not be reached: ${error.message}` : "EasyPost could not be reached.");
  }
  const result = await response.json().catch(() => ({})) as T & { error?: { message?: string } };
  if (!response.ok) throw new Error(result.error?.message || `EasyPost request failed (${response.status}).`);
  return result;
}

function easypostAddress(address: ShippingAddress) {
  return {
    name: address.name,
    street1: address.street1,
    street2: address.street2,
    city: address.city,
    state: address.state,
    zip: address.zip,
    country: "US",
    phone: address.phone,
    email: address.email,
  };
}

type EasyPostRate = { id?: string; carrier?: string; service?: string; rate?: string; currency?: string; delivery_days?: number | null; est_delivery_days?: number | null };

async function createEasyPostShipment(settings: ShippingSettings, address: ShippingAddress, quantity: number) {
  const weightOz = Math.max(1, Math.round(Number(settings.parcel.weight) * quantity * 16));
  return easypostRequest<{ id?: string; rates?: EasyPostRate[] }>("/shipments", settings, {
    method: "POST",
    body: JSON.stringify({
      shipment: {
        to_address: easypostAddress(address),
        from_address: easypostAddress(settings.sender),
        parcel: { length: Number(settings.parcel.length), width: Number(settings.parcel.width), height: Number(settings.parcel.height), weight: weightOz },
        options: { special_rates_eligibility: "USPS.MEDIAMAIL", label_format: "PDF" },
      },
    }),
  });
}

export async function testShippingConnection(settings: ShippingSettings) {
  if (shippingProvider(settings) !== "easypost") return testShippoConnection(settings);
  const shipment = await createEasyPostShipment(settings, {
    name: "Shipping Test", email: "test@example.com", phone: "9545551234",
    street1: "200 S Biscayne Blvd", street2: "", city: "Miami", state: "FL", zip: "33131", country: "US",
  }, 1);
  if (!shipment.id || !(shipment.rates || []).length) throw new Error("EasyPost did not return any rates for the connection test.");
}

export async function createShippingRates(settings: ShippingSettings, address: ShippingAddress, quantity: number): Promise<{ shipmentId: string; rates: ShippingRate[] }> {
  if (shippingProvider(settings) === "easypost") return createEasyPostRates(settings, address, quantity);
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
  return { shipmentId: shipment.object_id, rates: preferredBookRates(rates) };
}

const mediaMailService = /media mail/i;

export async function createEasyPostRates(settings: ShippingSettings, address: ShippingAddress, quantity: number): Promise<{ shipmentId: string; rates: ShippingRate[] }> {
  const shipment = await createEasyPostShipment(settings, address, quantity);
  const rates = (shipment.rates || [])
    .filter((rate) => (rate.carrier || "").toUpperCase() === "USPS")
    .map((rate) => ({
      id: rate.id || "",
      provider: "USPS",
      service: mediaMailService.test(rate.service || "") || /^media/i.test(rate.service || "") ? "Media Mail" : rate.service || "Shipping",
      amount: Math.round(Number(rate.rate || 0) * 100),
      currency: (rate.currency || "USD").toLowerCase(),
      estimatedDays: Number.isFinite(rate.delivery_days) ? Number(rate.delivery_days) : Number.isFinite(rate.est_delivery_days) ? Number(rate.est_delivery_days) : null,
      durationTerms: "",
    }))
    .filter((rate) => rate.id && rate.amount > 0 && rate.currency === "usd")
    .sort((a, b) => a.amount - b.amount);
  if (!shipment.id || rates.length === 0) throw new Error("No USPS rates are available for this address.");
  return { shipmentId: shipment.id, rates: preferredBookRates(rates) };
}

// EasyPost returns USPS Media Mail (service "MediaMail") when the shipment opts into
// special_rates_eligibility. Shippo's ePostage does not sell Media Mail at all, so when
// Shippo is the provider this falls back to its cheapest USPS rate.
function preferredBookRates(rates: ShippingRate[]): ShippingRate[] {
  const usps = rates.filter((rate) => rate.provider.toLowerCase() === "usps");
  const mediaMail = usps.filter((rate) => mediaMailService.test(rate.service));
  if (mediaMail.length > 0) return mediaMail;
  return [usps[0] ?? rates[0]];
}

export type PurchasedLabel = { object_id: string; label_url: string; tracking_number: string; tracking_url_provider: string };

async function purchaseEasyPostLabel(settings: ShippingSettings, rateId: string, shipmentId: string): Promise<PurchasedLabel> {
  if (!shipmentId) throw new Error("This order has no EasyPost shipment. Recalculate shipping before buying a label.");
  const purchased = await easypostRequest<{
    id?: string;
    tracking_code?: string;
    postage_label?: { label_url?: string; label_pdf_url?: string };
    tracker?: { public_url?: string };
  }>(`/shipments/${encodeURIComponent(shipmentId)}/buy`, settings, { method: "POST", body: JSON.stringify({ rate: { id: rateId } }) });
  const labelUrl = purchased.postage_label?.label_pdf_url || purchased.postage_label?.label_url;
  if (!purchased.id || !labelUrl) throw new Error("EasyPost could not purchase this shipping label.");
  return { object_id: purchased.id, label_url: labelUrl, tracking_number: purchased.tracking_code || "", tracking_url_provider: purchased.tracker?.public_url || "" };
}

export async function purchaseShippingLabel(settings: ShippingSettings, rateId: string, orderId: string, shipmentId: string): Promise<PurchasedLabel> {
  if (shippingProvider(settings) === "easypost") return purchaseEasyPostLabel(settings, rateId, shipmentId);
  const transaction = await shippoRequest<{
    object_id?: string;
    status?: string;
    label_url?: string;
    tracking_number?: string;
    tracking_url_provider?: string;
    messages?: { text?: string }[];
  }>("/transactions/", settings, { method: "POST", body: JSON.stringify({ rate: rateId, label_file_type: "PDF", async: false, metadata: `order:${orderId}` }) });
  if (transaction.status !== "SUCCESS" || !transaction.label_url) throw new Error(transaction.messages?.[0]?.text || "Shippo could not purchase this shipping label.");
  return {
    object_id: transaction.object_id || "",
    label_url: transaction.label_url,
    tracking_number: transaction.tracking_number || "",
    tracking_url_provider: transaction.tracking_url_provider || "",
  };
}

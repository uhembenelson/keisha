import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import { getMongoDatabase } from "@/lib/mongodb";

const PRINTFUL_API = "https://api.printful.com";

type StoredPrintfulSettings = {
  _id: "printful";
  tokenEncrypted: string;
  storeId: string;
  fulfillmentEnabled: boolean;
  autoConfirm: boolean;
  webhookSecret: string;
  updatedAt: string;
};

export type PrintfulSettings = {
  token: string;
  storeId: string;
  fulfillmentEnabled: boolean;
  autoConfirm: boolean;
  webhookSecret: string;
};

export type PrintfulSyncVariant = {
  id: number;
  catalogVariantId: number;
  name: string;
  retailPrice: string;
  sku: string;
  available: boolean;
};

export type PrintfulSyncProduct = {
  id: number;
  name: string;
  thumbnail: string;
  variants: PrintfulSyncVariant[];
};

function encryptionKey() {
  const source = process.env.CMS_SESSION_SECRET?.trim();
  if (!source) throw new Error("CMS_SESSION_SECRET is required before Printful credentials can be saved.");
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

export async function getPrintfulSettings(): Promise<PrintfulSettings | null> {
  const database = await getMongoDatabase();
  if (!database) return null;
  const stored = await database.collection<StoredPrintfulSettings>("integration_settings").findOne({ _id: "printful" });
  if (!stored) return null;
  return {
    token: decrypt(stored.tokenEncrypted),
    storeId: stored.storeId || "",
    fulfillmentEnabled: stored.fulfillmentEnabled === true,
    autoConfirm: stored.autoConfirm === true,
    webhookSecret: stored.webhookSecret || "",
  };
}

export async function savePrintfulSettings(input: { token?: string; storeId: string; fulfillmentEnabled: boolean; autoConfirm: boolean }) {
  const database = await getMongoDatabase();
  if (!database) throw new Error("MongoDB must be connected before Printful can be configured.");
  const collection = database.collection<StoredPrintfulSettings>("integration_settings");
  const current = await collection.findOne({ _id: "printful" });
  const tokenEncrypted = input.token ? encrypt(input.token) : current?.tokenEncrypted || "";
  const webhookSecret = current?.webhookSecret || randomBytes(24).toString("base64url");
  await collection.updateOne(
    { _id: "printful" },
    {
      $set: { tokenEncrypted, storeId: input.storeId, fulfillmentEnabled: input.fulfillmentEnabled, autoConfirm: input.autoConfirm, webhookSecret, updatedAt: new Date().toISOString() },
      $setOnInsert: { _id: "printful" },
    },
    { upsert: true },
  );
}

function printfulHeaders(settings: PrintfulSettings) {
  const headers: Record<string, string> = { authorization: `Bearer ${settings.token}`, "content-type": "application/json" };
  if (settings.storeId) headers["X-PF-Store-Id"] = settings.storeId;
  return headers;
}

export async function printfulRequest<T>(path: string, init: RequestInit = {}, settingsOverride?: PrintfulSettings) {
  const settings = settingsOverride || await getPrintfulSettings();
  if (!settings?.token) throw new Error("Connect Printful in the Merch area before using this feature.");
  const response = await fetch(`${PRINTFUL_API}${path}`, {
    ...init,
    headers: { ...printfulHeaders(settings), ...(init.headers || {}) },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null) as { result?: T; error?: { message?: string }; code?: number } | null;
  if (!response.ok) throw new Error(payload?.error?.message || `Printful request failed (${response.status}).`);
  return payload?.result as T;
}

export async function listPrintfulProducts() {
  const products = await printfulRequest<Array<{ id: number; name: string; thumbnail_url?: string }>>("/store/products?limit=100");
  const detailed: PrintfulSyncProduct[] = [];
  for (let index = 0; index < products.length; index += 5) {
    const batch = products.slice(index, index + 5);
    const results = await Promise.all(batch.map(async (product) => {
      const detail = await printfulRequest<{
        sync_product?: { id?: number; name?: string; thumbnail?: string; thumbnail_url?: string };
        sync_variants?: Array<{ id?: number; variant_id?: number; name?: string; retail_price?: string; sku?: string | null; availability_status?: string; is_ignored?: boolean; files?: Array<{ preview_url?: string; thumbnail_url?: string; url?: string }> }>;
      }>(`/store/products/${product.id}`);
      const variantPreview = detail.sync_variants?.flatMap((variant) => variant.files || []).map((file) => file.preview_url || file.thumbnail_url || file.url || "").find(Boolean) || "";
      return {
        id: Number(detail.sync_product?.id || product.id),
        name: detail.sync_product?.name || product.name,
        thumbnail: detail.sync_product?.thumbnail_url || detail.sync_product?.thumbnail || product.thumbnail_url || variantPreview,
        variants: (detail.sync_variants || []).filter((variant) => variant.id).map((variant) => ({
          id: Number(variant.id),
          catalogVariantId: Number(variant.variant_id || 0),
          name: variant.name || `Variant ${variant.id}`,
          retailPrice: variant.retail_price || "",
          sku: variant.sku || "",
          available: !variant.is_ignored && !["discontinued", "out_of_stock", "temporary_out_of_stock"].includes(variant.availability_status || "active"),
        })),
      };
    }));
    detailed.push(...results);
  }
  return detailed;
}

export async function createPrintfulProduct(input: { name: string; thumbnail?: string; catalogVariantIds: number[]; retailPrice: string; designUrl: string }) {
  return printfulRequest<{ id?: number; name?: string }>("/store/products", {
    method: "POST",
    body: JSON.stringify({
      sync_product: { name: input.name, thumbnail: input.thumbnail || undefined },
      sync_variants: input.catalogVariantIds.map((variantId) => ({
        variant_id: variantId,
        retail_price: input.retailPrice,
        files: [{ type: "default", url: input.designUrl }],
      })),
    }),
  });
}

export async function updatePrintfulProduct(input: { id: number; name: string; variants: Array<{ id: number; price: string; sku: string }> }) {
  return printfulRequest(`/store/products/${input.id}`, {
    method: "PUT",
    body: JSON.stringify({
      sync_product: { name: input.name },
      sync_variants: input.variants.map((variant) => ({
        id: variant.id,
        retail_price: variant.price,
        sku: variant.sku || null,
      })),
    }),
  });
}

export function printfulReady(settings: PrintfulSettings | null) {
  return Boolean(settings?.token);
}

export async function createPrintfulOrder(input: {
  orderId: string;
  recipient: { name: string; address1: string; address2?: string; city: string; stateCode?: string; countryCode: string; zip: string; email?: string; phone?: string };
  items: Array<{ syncVariantId: number; quantity: number; retailPrice?: string }>;
}) {
  const settings = await getPrintfulSettings();
  if (!settings?.token) throw new Error("Printful is not connected.");
  const result = await printfulRequest<{ id?: number; status?: string; dashboard_url?: string }>(
    `/orders?confirm=${settings.autoConfirm ? "1" : "0"}&update_existing=true`,
    {
      method: "POST",
      body: JSON.stringify({
        external_id: input.orderId,
        shipping: "STANDARD",
        recipient: {
          name: input.recipient.name,
          address1: input.recipient.address1,
          address2: input.recipient.address2 || undefined,
          city: input.recipient.city,
          state_code: input.recipient.stateCode || undefined,
          country_code: input.recipient.countryCode,
          zip: input.recipient.zip,
          email: input.recipient.email || undefined,
          phone: input.recipient.phone || undefined,
        },
        items: input.items.map((item) => ({
          sync_variant_id: item.syncVariantId,
          quantity: item.quantity,
          retail_price: item.retailPrice || undefined,
        })),
      }),
    },
    settings,
  );
  return { ...result, autoConfirmed: settings.autoConfirm };
}

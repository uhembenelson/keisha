import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import { getMongoDatabase } from "@/lib/mongodb";

type StoredPaymentSettings = {
  _id: "stripe";
  publishableKey: string;
  secretKeyEncrypted: string;
  webhookSecretEncrypted: string;
  updatedAt: string;
};

export type PaymentSettings = {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
};

function encryptionKey() {
  const source = process.env.CMS_SESSION_SECRET?.trim();
  if (!source) throw new Error("CMS_SESSION_SECRET is required before payment credentials can be saved.");
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

export async function getPaymentSettings(): Promise<PaymentSettings | null> {
  const database = await getMongoDatabase();
  if (!database) return null;
  const stored = await database.collection<StoredPaymentSettings>("payment_settings").findOne({ _id: "stripe" });
  if (!stored) return null;
  return {
    publishableKey: stored.publishableKey || "",
    secretKey: decrypt(stored.secretKeyEncrypted),
    webhookSecret: decrypt(stored.webhookSecretEncrypted),
  };
}

export async function savePaymentSettings(input: { publishableKey: string; secretKey?: string; webhookSecret?: string }) {
  const database = await getMongoDatabase();
  if (!database) throw new Error("MongoDB must be connected before payment credentials can be saved.");
  const current = await database.collection<StoredPaymentSettings>("payment_settings").findOne({ _id: "stripe" });
  const secretKeyEncrypted = input.secretKey ? encrypt(input.secretKey) : current?.secretKeyEncrypted || "";
  const webhookSecretEncrypted = input.webhookSecret ? encrypt(input.webhookSecret) : current?.webhookSecretEncrypted || "";
  await database.collection<StoredPaymentSettings>("payment_settings").updateOne(
    { _id: "stripe" },
    {
      $set: { publishableKey: input.publishableKey, secretKeyEncrypted, webhookSecretEncrypted, updatedAt: new Date().toISOString() },
      $setOnInsert: { _id: "stripe" },
    },
    { upsert: true },
  );
}

export function paymentSettingsReady(settings: PaymentSettings | null) {
  return Boolean(settings?.publishableKey && settings.secretKey && settings.webhookSecret);
}

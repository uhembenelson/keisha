import nextEnv from "@next/env";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { MongoClient, ServerApiVersion } from "mongodb";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const uri = process.env.MONGODB_URI?.trim();
if (!uri) throw new Error("Set MONGODB_URI in .env.local before running the migration.");

const databaseName = process.env.MONGODB_DATABASE?.trim() || "keisha_writenow";
const client = new MongoClient(uri, { serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true } });

try {
  const [content, submissions] = await Promise.all([
    readFile(path.join(process.cwd(), "data", "cms.json"), "utf8").then(JSON.parse),
    readFile(path.join(process.cwd(), "data", "submissions.json"), "utf8").then(JSON.parse),
  ]);
  const database = client.db(databaseName);
  await database.command({ ping: 1 });
  await database.collection("site_content").replaceOne({ _id: "primary" }, { content }, { upsert: true });
  if (submissions.inquiries.length) await database.collection("contact_inquiries").bulkWrite(submissions.inquiries.map((entry) => ({ updateOne: { filter: { id: entry.id }, update: { $set: entry }, upsert: true } })));
  if (submissions.subscribers.length) await database.collection("newsletter_subscribers").bulkWrite(submissions.subscribers.map((entry) => ({ updateOne: { filter: { email: entry.email }, update: { $set: entry }, upsert: true } })));
  await database.collection("contact_inquiries").createIndex({ id: 1 }, { unique: true });
  await database.collection("newsletter_subscribers").createIndex({ id: 1 }, { unique: true });
  await database.collection("newsletter_subscribers").createIndex({ email: 1 }, { unique: true });
  console.log(`Migration complete. MongoDB database: ${databaseName}`);
} finally {
  await client.close();
}

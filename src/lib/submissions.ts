import "server-only";

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import type { CmsSubmissions, ContactInquiry, NewsletterSubscriber } from "@/lib/cms-types";
import { getMongoDatabase } from "@/lib/mongodb";

const dataDirectory = path.join(process.cwd(), "data");
const submissionsFile = path.join(dataDirectory, "submissions.json");
let mutationQueue: Promise<unknown> = Promise.resolve();
let mongoIndexesReady: Promise<unknown> | null = null;

function ensureMongoIndexes(database: NonNullable<Awaited<ReturnType<typeof getMongoDatabase>>>) {
  mongoIndexesReady ??= Promise.all([
    database.collection("contact_inquiries").createIndex({ id: 1 }, { unique: true }),
    database.collection("newsletter_subscribers").createIndex({ id: 1 }, { unique: true }),
    database.collection("newsletter_subscribers").createIndex({ email: 1 }, { unique: true }),
  ]);
  return mongoIndexesReady;
}

export async function getSubmissions(): Promise<CmsSubmissions> {
  const database = await getMongoDatabase();
  if (database) {
    await ensureMongoIndexes(database);
    const [inquiries, subscribers] = await Promise.all([
      database.collection<ContactInquiry>("contact_inquiries").find().sort({ createdAt: -1 }).toArray(),
      database.collection<NewsletterSubscriber>("newsletter_subscribers").find().sort({ createdAt: -1 }).toArray(),
    ]);
    return { inquiries, subscribers };
  }
  const file = await readFile(submissionsFile, "utf8");
  return JSON.parse(file) as CmsSubmissions;
}

async function writeSubmissions(submissions: CmsSubmissions) {
  await mkdir(dataDirectory, { recursive: true });
  const temporaryFile = path.join(dataDirectory, ".submissions.json.tmp");
  await writeFile(temporaryFile, `${JSON.stringify(submissions, null, 2)}\n`, "utf8");
  await rename(temporaryFile, submissionsFile);
}

function queuedMutation<T>(mutation: (submissions: CmsSubmissions) => Promise<T>) {
  const result = mutationQueue.then(async () => mutation(await getSubmissions()));
  mutationQueue = result.catch(() => undefined);
  return result;
}

export function addInquiry(inquiry: ContactInquiry) {
  return addInquiryToActiveStore(inquiry);
}

async function addInquiryToActiveStore(inquiry: ContactInquiry) {
  const database = await getMongoDatabase();
  if (database) {
    await ensureMongoIndexes(database);
    await database.collection<ContactInquiry>("contact_inquiries").insertOne(inquiry);
    return inquiry;
  }
  return queuedMutation(async (submissions) => {
    submissions.inquiries.unshift(inquiry);
    await writeSubmissions(submissions);
    return inquiry;
  });
}

export function addSubscriber(subscriber: NewsletterSubscriber) {
  return addSubscriberToActiveStore(subscriber);
}

async function addSubscriberToActiveStore(subscriber: NewsletterSubscriber) {
  const database = await getMongoDatabase();
  if (database) {
    await ensureMongoIndexes(database);
    const collection = database.collection<NewsletterSubscriber>("newsletter_subscribers");
    const existing = await collection.findOne({ email: subscriber.email });
    if (existing?.status === "active") {
      return { subscriber: existing, existed: true, alreadySubscribed: true };
    }
    const result = await collection.updateOne(
      { email: subscriber.email },
      {
        $set: { status: "active", source: subscriber.source },
        $setOnInsert: {
          id: subscriber.id,
          email: subscriber.email,
          note: subscriber.note,
          createdAt: subscriber.createdAt,
        },
      },
      { upsert: true },
    );
    const saved = await collection.findOne({ email: subscriber.email });
    return { subscriber: saved as NewsletterSubscriber, existed: result.upsertedCount === 0, alreadySubscribed: false };
  }
  return queuedMutation(async (submissions) => {
    const existing = submissions.subscribers.find((item) => item.email.toLowerCase() === subscriber.email.toLowerCase());
    if (existing) {
      if (existing.status === "active") {
        return { subscriber: existing, existed: true, alreadySubscribed: true };
      }
      existing.status = "active";
      existing.source = subscriber.source;
      await writeSubmissions(submissions);
      return { subscriber: existing, existed: true, alreadySubscribed: false };
    }
    submissions.subscribers.unshift(subscriber);
    await writeSubmissions(submissions);
    return { subscriber, existed: false, alreadySubscribed: false };
  });
}

export function updateSubmission(collection: keyof CmsSubmissions, id: string, changes: Record<string, unknown>) {
  return updateActiveSubmission(collection, id, changes);
}

async function updateActiveSubmission(collection: keyof CmsSubmissions, id: string, changes: Record<string, unknown>) {
  const database = await getMongoDatabase();
  if (database) {
    const collectionName = collection === "inquiries" ? "contact_inquiries" : "newsletter_subscribers";
    return database.collection(collectionName).findOneAndUpdate({ id }, { $set: changes }, { returnDocument: "after" });
  }
  return queuedMutation(async (submissions) => {
    const entry = submissions[collection].find((item) => item.id === id);
    if (!entry) return null;
    Object.assign(entry, changes);
    await writeSubmissions(submissions);
    return entry;
  });
}

export function deleteSubmission(collection: keyof CmsSubmissions, id: string) {
  return deleteActiveSubmission(collection, id);
}

async function deleteActiveSubmission(collection: keyof CmsSubmissions, id: string) {
  const database = await getMongoDatabase();
  if (database) {
    const collectionName = collection === "inquiries" ? "contact_inquiries" : "newsletter_subscribers";
    return (await database.collection(collectionName).deleteOne({ id })).deletedCount > 0;
  }
  return queuedMutation(async (submissions) => {
    const before = submissions[collection].length;
    if (collection === "inquiries") {
      submissions.inquiries = submissions.inquiries.filter((item) => item.id !== id);
    } else {
      submissions.subscribers = submissions.subscribers.filter((item) => item.id !== id);
    }
    await writeSubmissions(submissions);
    return submissions[collection].length < before;
  });
}

import "server-only";

import { Db, MongoClient, ServerApiVersion } from "mongodb";

const uri = process.env.MONGODB_URI?.trim();
const databaseName = process.env.MONGODB_DATABASE?.trim() || "keisha_writenow";

declare global {
  var keishaMongoClientPromise: Promise<MongoClient> | undefined;
}

function createClientPromise() {
  if (!uri) return null;
  const client = new MongoClient(uri, {
    serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
  });
  return client.connect();
}

const clientPromise = uri
  ? process.env.NODE_ENV === "development"
    ? (global.keishaMongoClientPromise ??= createClientPromise() as Promise<MongoClient>)
    : createClientPromise()
  : null;

export function isMongoConfigured() {
  return Boolean(uri);
}

export async function getMongoDatabase(): Promise<Db | null> {
  if (!clientPromise) return null;
  return (await clientPromise).db(databaseName);
}

export async function getMongoStatus() {
  const database = await getMongoDatabase();
  if (!database) return { configured: false, connected: false, database: databaseName, mode: "json-fallback" as const };
  await database.command({ ping: 1 });
  return { configured: true, connected: true, database: databaseName, mode: "mongodb" as const };
}

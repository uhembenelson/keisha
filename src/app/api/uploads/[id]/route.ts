import { GridFSBucket, ObjectId } from "mongodb";

import { getMongoDatabase } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const database = await getMongoDatabase();
  if (!database) return new Response("Image not found.", { status: 404 });

  const { id } = await params;
  if (!ObjectId.isValid(id)) return new Response("Image not found.", { status: 404 });
  const objectId = new ObjectId(id);
  const file = await database.collection("media_uploads.files").findOne({ _id: objectId });
  if (!file) return new Response("Image not found.", { status: 404 });

  const isPaidBook = file.metadata?.kind === "paid-book";
  const sessionId = new URL(request.url).searchParams.get("session_id");
  if (isPaidBook) {
    const order = sessionId ? await database.collection("merch_orders").findOne({ stripeSessionId: sessionId, orderType: "book", format: "digital", status: "paid", digitalDownloadUrl: `/api/uploads/${id}` }, { projection: { _id: 1, presale: 1, digitalReleasedAt: 1 } }) : null;
    if (!order || (order.presale === true && !order.digitalReleasedAt)) return new Response("Download not found.", { status: 404 });
  }

  const bucket = new GridFSBucket(database, { bucketName: "media_uploads" });
  const chunks: Buffer[] = [];
  const stream = bucket.openDownloadStream(objectId);
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));

  return new Response(Buffer.concat(chunks), {
    headers: {
      "content-type": String(file.metadata?.contentType || "application/octet-stream"),
      "cache-control": isPaidBook ? "private, no-store" : "public, max-age=31536000, immutable",
      "content-length": String(file.length),
      ...(file.metadata?.kind === "book" || isPaidBook ? { "content-disposition": `attachment; filename="${String(file.filename).replace(/["\r\n]/g, "")}"` } : {}),
    },
  });
}

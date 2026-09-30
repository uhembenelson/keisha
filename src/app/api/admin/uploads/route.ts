import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
import { GridFSBucket, ObjectId } from "mongodb";

import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { getMongoDatabase } from "@/lib/mongodb";

export const runtime = "nodejs";

const allowedImageTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);
const allowedBookTypes = new Map([
  ["application/pdf", "pdf"],
  ["application/epub+zip", "epub"],
  ["application/x-mobipocket-ebook", "mobi"],
]);

async function authorized() {
  return isValidAdminSession((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
}

export async function POST(request: Request) {
  if (!(await authorized())) return Response.json({ error: "Authentication required." }, { status: 401 });
  const formData = await request.formData().catch(() => null);
  if (!formData) return Response.json({ error: "Submit the image as multipart form data." }, { status: 400 });
  const file = formData.get("file");
  const kind = formData.get("kind") === "book" ? "book" : "image";
  if (!(file instanceof File)) return Response.json({ error: "Choose an image to upload." }, { status: 400 });

  const extension = (kind === "book" ? allowedBookTypes : allowedImageTypes).get(file.type);
  if (!extension) return Response.json({ error: kind === "book" ? "Upload a PDF, EPUB, or MOBI book file." : "Upload a JPG, PNG, WebP, or GIF image." }, { status: 415 });
  const maxFileSize = kind === "book" ? 25 * 1024 * 1024 : 8 * 1024 * 1024;
  if (file.size > maxFileSize) return Response.json({ error: kind === "book" ? "Book files must be smaller than 25 MB." : "Images must be smaller than 8 MB." }, { status: 413 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const database = await getMongoDatabase();

  if (database) {
    const id = new ObjectId();
    const bucket = new GridFSBucket(database, { bucketName: "media_uploads" });
    await new Promise<void>((resolve, reject) => {
      const stream = bucket.openUploadStreamWithId(id, file.name, { metadata: { contentType: file.type, size: file.size, kind, uploadedAt: new Date() } });
      stream.on("error", reject);
      stream.on("finish", () => resolve());
      stream.end(bytes);
    });
    return Response.json({ url: `/api/uploads/${id.toHexString()}`, name: file.name });
  }

  const id = randomUUID();
  const publicDirectory = kind === "book" ? "downloads" : "uploads";
  const uploadsDirectory = path.join(process.cwd(), "public", publicDirectory);
  await mkdir(uploadsDirectory, { recursive: true });
  const filename = `${id}.${extension}`;
  await writeFile(path.join(uploadsDirectory, filename), bytes);
  return Response.json({ url: `/${publicDirectory}/${filename}`, name: file.name });
}

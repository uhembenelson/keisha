"use client";

import { ChangeEvent, useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, LoaderCircle, Trash2, Upload } from "lucide-react";

export function AdminImageUploader({ label, images, multiple = false, onChange }: { label: string; images: string[]; multiple?: boolean; onChange: (images: string[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    setError("");
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.set("file", file);
        const response = await fetch("/api/admin/uploads", { method: "POST", body: formData });
        const result = (await response.json()) as { url?: string; error?: string };
        if (!response.ok || !result.url) throw new Error(result.error || "The image could not be uploaded.");
        uploaded.push(result.url);
      }
      onChange(multiple ? [...images, ...uploaded] : uploaded.slice(-1));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "The image could not be uploaded.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-charcoal/55">{label}</p><button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="inline-flex items-center gap-2 rounded-full border border-burgundy px-4 py-2 text-xs font-semibold text-burgundy transition hover:bg-burgundy hover:text-cream disabled:opacity-50">{uploading ? <LoaderCircle className="size-4 animate-spin" /> : <Upload className="size-4" />}{uploading ? "Uploading…" : multiple ? "Upload images" : "Upload image"}</button></div>
      <input ref={inputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple={multiple} onChange={upload} />
      {images.length > 0 ? <div className={`mt-4 grid gap-3 ${multiple ? "grid-cols-2 sm:grid-cols-4" : "max-w-48 grid-cols-1"}`}>{images.map((image, index) => <div key={`${image}-${index}`} className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-charcoal/10 bg-white"><Image src={image} alt="Uploaded preview" fill unoptimized className="object-cover" /><button type="button" onClick={() => onChange(images.filter((_, imageIndex) => imageIndex !== index))} className="absolute right-2 top-2 rounded-full bg-charcoal/80 p-2 text-cream opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100" aria-label="Remove image"><Trash2 className="size-3.5" /></button></div>)}</div> : <button type="button" onClick={() => inputRef.current?.click()} className="mt-4 flex min-h-32 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-charcoal/20 bg-white/50 text-sm font-semibold text-charcoal/45"><ImagePlus className="size-5" />No image selected</button>}
      {error && <p className="mt-2 text-sm font-semibold text-red-700">{error}</p>}
    </div>
  );
}

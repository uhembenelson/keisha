"use client";

import { ChangeEvent, useRef, useState } from "react";
import { BookOpen, FileCheck2, LoaderCircle, Trash2, Upload } from "lucide-react";

export function AdminBookFileUploader({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("kind", "book");
      const response = await fetch("/api/admin/uploads", { method: "POST", body: formData });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || "The book file could not be uploaded.");
      onChange(result.url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "The book file could not be uploaded.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return <div><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-charcoal/55">Free book file</p><p className="mt-1 text-xs text-charcoal/45">PDF, EPUB, or MOBI · maximum 25 MB</p></div><button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="inline-flex items-center gap-2 rounded-full border border-burgundy px-4 py-2 text-xs font-semibold text-burgundy hover:bg-burgundy hover:text-cream disabled:opacity-50">{uploading ? <LoaderCircle className="size-4 animate-spin" /> : <Upload className="size-4" />}{uploading ? "Uploading…" : "Upload book"}</button></div><input ref={inputRef} className="sr-only" type="file" accept="application/pdf,application/epub+zip,.epub,.mobi" onChange={upload} />{value ? <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"><div className="flex items-center gap-3"><FileCheck2 className="size-5 text-emerald-700" /><div><p className="text-sm font-semibold text-emerald-900">Download file ready</p><p className="max-w-sm truncate text-xs text-emerald-700">{value}</p></div></div><button type="button" onClick={() => onChange("")} className="rounded-full p-2 text-emerald-800 hover:bg-white" aria-label="Remove book file"><Trash2 className="size-4" /></button></div> : <button type="button" onClick={() => inputRef.current?.click()} className="mt-4 flex min-h-28 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-charcoal/20 bg-white/50 text-sm font-semibold text-charcoal/45"><BookOpen className="size-5" />No free download uploaded</button>}{error && <p className="mt-2 text-sm font-semibold text-red-700">{error}</p>}</div>;
}

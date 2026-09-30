"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from "lucide-react";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to sign in.");

      const destination = searchParams.get("next");
      router.replace(destination?.startsWith("/admin") ? destination : "/admin");
      router.refresh();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to sign in.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-10 space-y-5">
      <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-charcoal/55">
        Email address
        <span className="relative mt-2 block">
          <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-burgundy/50" />
          <input className="w-full rounded-xl border border-charcoal/15 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-burgundy focus:ring-2 focus:ring-burgundy/10" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
        </span>
      </label>
      <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-charcoal/55">
        Password
        <span className="relative mt-2 block">
          <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-burgundy/50" />
          <input className="w-full rounded-xl border border-charcoal/15 bg-white py-3.5 pl-11 pr-12 text-sm outline-none transition focus:border-burgundy focus:ring-2 focus:ring-burgundy/10" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" />
          <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal/40 transition hover:text-burgundy" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
        </span>
      </label>
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{error}</p>}
      <button type="submit" disabled={pending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-burgundy px-5 py-3.5 text-sm font-semibold text-cream transition hover:bg-charcoal disabled:opacity-60">{pending ? <LoaderCircle className="size-4 animate-spin" /> : <>Sign in to the CMS <ArrowRight className="size-4" /></>}</button>
    </form>
  );
}

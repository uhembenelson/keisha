export const ADMIN_SESSION_COOKIE = "keisha-admin-session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8;

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function createAdminSessionToken() {
  const secret = process.env.CMS_SESSION_SECRET;
  if (!secret) return "";

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("keisha-cms-admin"));
  return toHex(signature);
}

export async function isValidAdminSession(token?: string) {
  if (!token) return false;
  const expected = await createAdminSessionToken();
  return Boolean(expected && token === expected);
}

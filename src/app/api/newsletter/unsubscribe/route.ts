import { unsubscribeEmail, verifyUnsubscribeToken } from "@/lib/email-studio";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") || "";
  const email = verifyUnsubscribeToken(token);
  if (!email) return new Response("This unsubscribe link is invalid.", { status: 400, headers: { "content-type": "text/plain; charset=utf-8" } });
  await unsubscribeEmail(email);
  return new Response("<!doctype html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>Unsubscribed</title></head><body style=\"margin:0;background:#fff3df;color:#29271f;font-family:Georgia,serif;display:grid;min-height:100vh;place-items:center;text-align:center;padding:24px\"><main><h1 style=\"font-size:48px;margin:0 0 16px\">You’re unsubscribed.</h1><p style=\"font-family:Arial,sans-serif;line-height:1.7\">You will no longer receive newsletter emails from Keisha WriteNow Allen.</p><a href=\"/\" style=\"display:inline-block;margin-top:18px;background:#7f2737;color:#fff3df;padding:14px 22px;text-decoration:none\">Return to the website</a></main></body></html>", { headers: { "content-type": "text/html; charset=utf-8" } });
}

export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("token") || "";
  const email = verifyUnsubscribeToken(token);
  if (!email) return new Response("Invalid unsubscribe request.", { status: 400 });
  const body = await request.text();
  if (!body.includes("List-Unsubscribe=One-Click")) return new Response("Invalid unsubscribe request.", { status: 400 });
  await unsubscribeEmail(email);
  return new Response(null, { status: 200 });
}

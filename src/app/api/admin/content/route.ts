import { cookies } from "next/headers";

import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { getCmsContent, isCmsContent, saveCmsContent } from "@/lib/cms";
import { HERO_NEWSLETTER_LIMITS, homepageStatsFitLayout } from "@/lib/cms-types";

export const runtime = "nodejs";

async function isAuthorized() {
  const session = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  return isValidAdminSession(session);
}

function validDigitalUrl(value: string) {
  const target = value.trim();
  if (/^https?:\/\//i.test(target)) {
    try {
      const url = new URL(target);
      return !url.username && !url.password;
    } catch {
      return false;
    }
  }
  return /^\/(?!\/)[A-Za-z0-9/_.,%+~?=&-]+$/.test(target) && !target.split("?")[0].split("/").includes("..");
}

export async function GET() {
  if (!(await isAuthorized())) return Response.json({ error: "Authentication required." }, { status: 401 });
  return Response.json(await getCmsContent());
}

export async function PUT(request: Request) {
  if (!(await isAuthorized())) return Response.json({ error: "Authentication required." }, { status: 401 });

  const body: unknown = await request.json().catch(() => null);
  if (!isCmsContent(body)) {
    return Response.json({ error: "The submitted content is not valid." }, { status: 400 });
  }
  if (!homepageStatsFitLayout(body.settings)) {
    return Response.json({ error: "A homepage statistic exceeds its layout-safe character limit." }, { status: 400 });
  }
  if (
    body.settings.heroNewsletterTitle.length > HERO_NEWSLETTER_LIMITS.heroNewsletterTitle ||
    body.settings.heroNewsletterCopy.length > HERO_NEWSLETTER_LIMITS.heroNewsletterCopy ||
    body.settings.heroNewsletterCtaLabel.length > HERO_NEWSLETTER_LIMITS.heroNewsletterCtaLabel
  ) {
    return Response.json({ error: "The hero newsletter card exceeds its layout-safe character limit." }, { status: 400 });
  }
  const externalUrls = [
    body.settings.newsletterExternalUrl,
    ...(Array.isArray(body.settings.socialLinks) ? body.settings.socialLinks.map((link) => link.url) : []),
    ...body.media.map((item) => item.mediaUrl),
    ...body.merch.map((product) => product.buyUrl),
  ];
  if (externalUrls.some((url) => typeof url === "string" && url.trim() && !/^https?:\/\//i.test(url))) {
    return Response.json({ error: "External newsletter, social, media, and merch links must begin with http:// or https://." }, { status: 400 });
  }

  const invalidBook = body.books.find((book) => {
    if (!book.published || book.availability !== "paid") return false;
    if (!book.physicalEnabled && !book.digitalEnabled) return true;
    if (book.physicalEnabled && !(Number(book.price.replace(/[^0-9.]/g, "")) > 0)) return true;
    if (book.physicalEnabled && !book.stripeEnabled && !(book.retailers ?? []).some((retailer) => retailer.name.trim() && /^https?:\/\//i.test(retailer.url))) return true;
    if (book.digitalEnabled && (!(Number(book.digitalPrice.replace(/[^0-9.]/g, "")) > 0) || !validDigitalUrl(book.digitalDownloadUrl))) return true;
    if (book.presaleEnabled && (!book.presaleReleaseDate || (book.presaleEndDate && book.presaleEndDate > book.presaleReleaseDate))) return true;
    if (book.presaleEnabled && !(book.digitalEnabled || (book.physicalEnabled && book.stripeEnabled))) return true;
    return false;
  });
  if (invalidBook) return Response.json({ error: `Complete the enabled book format details before publishing ${invalidBook.title}.` }, { status: 400 });

  await saveCmsContent(body);
  return Response.json({ ok: true, content: body });
}

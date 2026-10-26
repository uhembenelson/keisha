import { cookies } from "next/headers";

import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { saveCmsContent } from "@/lib/cms";
import type { CmsMerchCategory } from "@/lib/cms-types";
import { createPrintfulProduct, updatePrintfulProduct } from "@/lib/printful";
import { syncPrintfulProductsToCms } from "@/lib/printful-sync";

export const runtime = "nodejs";

async function authorized() {
  return isValidAdminSession((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
}

export async function POST() {
  if (!(await authorized())) return Response.json({ error: "Authentication required." }, { status: 401 });
  try {
    const { content, imported } = await syncPrintfulProductsToCms();
    return Response.json({ ok: true, content, imported });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Printful products could not be synced." }, { status: 502 });
  }
}

export async function PUT(request: Request) {
  if (!(await authorized())) return Response.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json().catch(() => null) as { name?: string; price?: string; image?: string; designUrl?: string; catalogVariantIds?: number[]; published?: boolean; category?: CmsMerchCategory; shortDescription?: string; buttonText?: string } | null;
  const name = body?.name?.trim() || "";
  const price = (body?.price || "").replace(/[^0-9.]/g, "");
  const catalogVariantIds = [...new Set((body?.catalogVariantIds || []).map(Number).filter((id) => Number.isInteger(id) && id > 0))];
  if (!name) return Response.json({ error: "Enter a product name." }, { status: 400 });
  if (!price || Number(price) <= 0) return Response.json({ error: "Enter a valid retail price." }, { status: 400 });
  if (!catalogVariantIds.length) return Response.json({ error: "Add at least one Printful catalog Variant ID." }, { status: 400 });
  if (!body?.designUrl?.trim()) return Response.json({ error: "Add the printable artwork URL." }, { status: 400 });

  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, "");
  const absoluteUrl = (value: string) => /^https?:\/\//i.test(value) ? value : `${baseUrl}${value.startsWith("/") ? "" : "/"}${value}`;
  const designUrl = absoluteUrl(body.designUrl.trim());
  const thumbnail = body.image?.trim() ? absoluteUrl(body.image.trim()) : "";
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:|\/)/i.test(designUrl)) return Response.json({ error: "Printful cannot download artwork from localhost. Use a public image URL or configure NEXT_PUBLIC_SITE_URL with the hosted website address." }, { status: 400 });

  try {
    const created = await createPrintfulProduct({ name, thumbnail, catalogVariantIds, retailPrice: Number(price).toFixed(2), designUrl });
    const { content } = await syncPrintfulProductsToCms();
    const createdProduct = content.merch.find((product) => product.printfulProductId === Number(created.id));
    if (createdProduct) {
      createdProduct.category = body.category || createdProduct.category;
      createdProduct.shortDescription = body.shortDescription?.trim() || createdProduct.shortDescription;
      createdProduct.buttonText = body.buttonText?.trim() || createdProduct.buttonText;
      createdProduct.image = body.image?.trim() || body.designUrl.trim() || createdProduct.image;
      createdProduct.published = body.published !== false;
    }
    await saveCmsContent(content);
    return Response.json({ ok: true, content, productId: createdProduct?.id || "" });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "The product could not be created in Printful." }, { status: 502 });
  }
}

export async function PATCH(request: Request) {
  if (!(await authorized())) return Response.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json().catch(() => null) as { id?: number; name?: string; variants?: Array<{ id?: number | null; price?: string; sku?: string }> } | null;
  const id = Number(body?.id);
  const variants = (body?.variants || []).flatMap((variant) => {
    const variantId = Number(variant.id);
    const price = (variant.price || "").replace(/[^0-9.]/g, "");
    return Number.isInteger(variantId) && variantId > 0 && Number(price) > 0 ? [{ id: variantId, price: Number(price).toFixed(2), sku: variant.sku?.trim() || "" }] : [];
  });
  if (!Number.isInteger(id) || id <= 0 || !body?.name?.trim() || !variants.length) return Response.json({ error: "This Printful product is missing its product or variant details." }, { status: 400 });
  try {
    await updatePrintfulProduct({ id, name: body.name.trim(), variants });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "The product could not be updated in Printful." }, { status: 502 });
  }
}

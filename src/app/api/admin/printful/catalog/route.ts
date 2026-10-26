import { cookies } from "next/headers";

import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { printfulRequest } from "@/lib/printful";

export const runtime = "nodejs";

async function authorized() {
  return isValidAdminSession((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
}

export async function GET(request: Request) {
  if (!(await authorized())) return Response.json({ error: "Authentication required." }, { status: 401 });
  const productId = new URL(request.url).searchParams.get("productId")?.trim();
  try {
    if (!productId) {
      const products = await printfulRequest<Array<{ id?: number; title?: string; model?: string; image?: string; variant_count?: number; type?: string }>>("/products");
      return Response.json({ products: (products || []).filter((product) => product.id).map((product) => ({ id: Number(product.id), name: product.title || product.model || `Product ${product.id}`, image: product.image || "", variantCount: Number(product.variant_count || 0), type: product.type || "" })) });
    }
    if (!/^\d+$/.test(productId)) return Response.json({ error: "Choose a valid Printful catalog product." }, { status: 400 });
    const detail = await printfulRequest<{ product?: { id?: number; title?: string }; variants?: Array<{ id?: number; name?: string; size?: string; color?: string; color_code?: string; image?: string; in_stock?: boolean }> }>(`/products/${productId}`);
    return Response.json({
      product: { id: Number(detail.product?.id || productId), name: detail.product?.title || `Product ${productId}` },
      variants: (detail.variants || []).filter((variant) => variant.id).map((variant) => ({ id: Number(variant.id), name: variant.name || [variant.color, variant.size].filter(Boolean).join(" / ") || `Variant ${variant.id}`, size: variant.size || "", color: variant.color || "", colorCode: variant.color_code || "", image: variant.image || "", available: variant.in_stock !== false })),
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "The Printful catalog could not be loaded." }, { status: 502 });
  }
}

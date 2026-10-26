import "server-only";

import { getCmsContent, saveCmsContent } from "@/lib/cms";
import type { CmsMerchCategory, CmsMerchProduct } from "@/lib/cms-types";
import { listPrintfulProducts } from "@/lib/printful";

function categoryFor(name: string): CmsMerchCategory {
  const value = name.toLowerCase();
  if (value.includes("mug")) return "Mugs";
  if (value.includes("tote") || value.includes("bag")) return "Totes";
  if (value.includes("shirt") || value.includes("hood") || value.includes("hat") || value.includes("apparel")) return "Apparel";
  return "Other";
}

function displayPrice(prices: string[]) {
  const valid = prices.map(Number).filter((price) => Number.isFinite(price) && price > 0);
  return valid.length ? `$${Math.min(...valid).toFixed(2)}` : "";
}

export async function syncPrintfulProductsToCms() {
  const [remoteProducts, cms] = await Promise.all([listPrintfulProducts(), getCmsContent()]);
  const existingByPrintfulId = new Map(cms.merch.filter((product) => product.printfulProductId).map((product) => [product.printfulProductId, product]));
  const imported: CmsMerchProduct[] = remoteProducts.map((remote) => {
    const existing = existingByPrintfulId.get(remote.id);
    const variants = remote.variants.map((variant) => ({
      id: `printful-${variant.id}`,
      printfulCatalogVariantId: variant.catalogVariantId || null,
      name: variant.name,
      price: variant.retailPrice,
      sku: variant.sku,
      available: variant.available,
      printfulSyncVariantId: variant.id,
    }));
    return {
      id: existing?.id || `printful-product-${remote.id}`,
      name: existing?.name || remote.name,
      category: existing?.category || categoryFor(remote.name),
      shortDescription: existing?.shortDescription || "Printful-made merchandise, produced especially for you.",
      price: existing?.price || displayPrice(variants.map((variant) => variant.price)),
      buyUrl: "",
      buttonText: existing?.buttonText || "Choose options",
      image: remote.thumbnail || existing?.image || "",
      published: existing ? existing.published === true : true,
      fulfillment: "printful",
      printfulProductId: remote.id,
      variants,
    };
  });
  const manualProducts = cms.merch.filter((product) => product.fulfillment !== "printful" || !product.printfulProductId);
  const content = { ...cms, merch: [...manualProducts, ...imported] };
  await saveCmsContent(content);
  return { content, imported: imported.length };
}

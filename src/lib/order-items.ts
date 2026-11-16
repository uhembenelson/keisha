export type OrderItemLike = { quantity?: number; name?: string };

function asOrderItems(items: unknown): OrderItemLike[] {
  return Array.isArray(items) ? (items as OrderItemLike[]) : [];
}

/** Total number of physical copies in an order, used to price the shipping weight. */
export function orderCopyCount(items: unknown): number {
  const total = asOrderItems(items).reduce((sum, item) => {
    const quantity = Math.floor(Number(item?.quantity));
    return sum + (Number.isFinite(quantity) && quantity > 0 ? quantity : 1);
  }, 0);
  return Math.max(1, total);
}

/** Human-readable list of the titles in an order, for emails and admin labels. */
export function orderItemTitles(items: unknown): string {
  const names = asOrderItems(items).map((item) => String(item?.name || "").trim()).filter(Boolean);
  if (names.length === 0) return "your book";
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export function orderIncludesSignedCopy(items: unknown): boolean {
  return asOrderItems(items).some((item) => String(item?.name || "").includes("Signed copy") || String((item as { variantName?: string })?.variantName || "") === "Signed copy");
}

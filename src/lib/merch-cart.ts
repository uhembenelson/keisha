export const MERCH_CART_KEY = "keisha-merch-cart";
export const MERCH_CART_EVENT = "keisha-cart-updated";

export type MerchCartItem = { id: string; quantity: number };

export function readMerchCart(): MerchCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(MERCH_CART_KEY) || "[]") as MerchCartItem[];
    return Array.isArray(value) ? value.filter((item) => typeof item.id === "string" && Number.isInteger(item.quantity) && item.quantity > 0) : [];
  } catch {
    return [];
  }
}

export function writeMerchCart(items: MerchCartItem[]) {
  window.localStorage.setItem(MERCH_CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(MERCH_CART_EVENT));
}

export function addMerchToCart(id: string) {
  const items = readMerchCart();
  const current = items.find((item) => item.id === id);
  if (current) current.quantity = Math.min(current.quantity + 1, 10);
  else items.push({ id, quantity: 1 });
  writeMerchCart(items);
}

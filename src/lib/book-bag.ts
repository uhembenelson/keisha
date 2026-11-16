export const BOOK_BAG_KEY = "keisha-book-bag";
export const BOOK_BAG_EVENT = "keisha-book-bag-updated";

export const MAX_BOOK_BAG_QUANTITY = 10;
export const MAX_BOOK_BAG_LINES = 20;

export type BookBagItem = { bookId: string; quantity: number; signedCopy: boolean };

export function clampBookQuantity(value: number) {
  return Math.max(1, Math.min(MAX_BOOK_BAG_QUANTITY, Math.floor(Number(value)) || 1));
}

export function readBookBag(): BookBagItem[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(BOOK_BAG_KEY) || "[]") as BookBagItem[];
    if (!Array.isArray(value)) return [];
    return value
      .filter((item) => typeof item?.bookId === "string" && item.bookId.trim().length > 0)
      .map((item) => ({ bookId: item.bookId, quantity: clampBookQuantity(item.quantity), signedCopy: item.signedCopy === true }))
      .slice(0, MAX_BOOK_BAG_LINES);
  } catch {
    return [];
  }
}

export function writeBookBag(items: BookBagItem[]) {
  window.localStorage.setItem(BOOK_BAG_KEY, JSON.stringify(items.slice(0, MAX_BOOK_BAG_LINES)));
  window.dispatchEvent(new Event(BOOK_BAG_EVENT));
}

export function addBookToBag(bookId: string, signedCopy = false, quantity = 1) {
  const items = readBookBag();
  const current = items.find((item) => item.bookId === bookId && item.signedCopy === signedCopy);
  if (current) current.quantity = clampBookQuantity(current.quantity + quantity);
  else if (items.length < MAX_BOOK_BAG_LINES) items.push({ bookId, signedCopy, quantity: clampBookQuantity(quantity) });
  writeBookBag(items);
}

export function bookBagCount(items: BookBagItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

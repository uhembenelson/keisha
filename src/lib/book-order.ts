import type { CmsBook } from "@/lib/cms-types";

export const MAX_BOOK_LINE_QUANTITY = 10;
export const MAX_BOOK_LINES = 20;

export type BookLineRequest = { bookId?: string; quantity?: number; signedCopy?: boolean };
export type BookLine = { bookId: string; quantity: number; signedCopy: boolean };

function clampLineQuantity(value: unknown) {
  return Math.max(1, Math.min(MAX_BOOK_LINE_QUANTITY, Math.floor(Number(value)) || 1));
}

/**
 * Books in the shared bag always ship now: physical, direct-checkout enabled, and
 * not in an open presale (presales keep their own release flow).
 */
export function isBookBagEligible(book: CmsBook | undefined) {
  return Boolean(book && book.published && book.availability === "paid" && book.physicalEnabled && book.stripeEnabled && !book.presaleEnabled);
}

export function bookUnitAmount(book: CmsBook, signedCopy: boolean) {
  const price = signedCopy ? book.signedCopyPrice || book.price : book.price;
  const amount = Number(String(price || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) : 0;
}

export function normalizeBookLines(value: unknown): BookLine[] {
  const requested = Array.isArray(value) ? (value as BookLineRequest[]) : [];
  const merged = new Map<string, BookLine>();
  for (const entry of requested) {
    const bookId = typeof entry?.bookId === "string" ? entry.bookId.trim() : "";
    if (!bookId) continue;
    const signedCopy = entry?.signedCopy === true;
    const key = `${bookId}:${signedCopy ? "signed" : "standard"}`;
    const current = merged.get(key);
    if (current) current.quantity = Math.min(MAX_BOOK_LINE_QUANTITY, current.quantity + clampLineQuantity(entry?.quantity));
    else if (merged.size < MAX_BOOK_LINES) merged.set(key, { bookId, quantity: clampLineQuantity(entry?.quantity), signedCopy });
  }
  return [...merged.values()];
}

export function bookLineCopyCount(lines: BookLine[]) {
  return Math.max(1, lines.reduce((sum, line) => sum + line.quantity, 0));
}

export function bookLinesTotal(lines: Array<BookLine & { unitAmount: number }>) {
  return lines.reduce((sum, line) => sum + line.unitAmount * line.quantity, 0);
}

export function bookLinesMatch(left: BookLine[], right: BookLine[]) {
  if (left.length !== right.length) return false;
  const toKey = (line: BookLine) => `${line.bookId}:${line.signedCopy ? "signed" : "standard"}:${line.quantity}`;
  const leftKeys = left.map(toKey).sort();
  const rightKeys = right.map(toKey).sort();
  return leftKeys.every((key, index) => key === rightKeys[index]);
}

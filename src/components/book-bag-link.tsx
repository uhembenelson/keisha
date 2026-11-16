"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { useEffect, useState } from "react";

import { BOOK_BAG_EVENT, bookBagCount, readBookBag } from "@/lib/book-bag";

export function BookBagLink({ mobile = false }: { mobile?: boolean }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const update = () => setCount(bookBagCount(readBookBag()));
    update();
    window.addEventListener(BOOK_BAG_EVENT, update);
    window.addEventListener("storage", update);
    return () => { window.removeEventListener(BOOK_BAG_EVENT, update); window.removeEventListener("storage", update); };
  }, []);
  if (count === 0) return null;
  const label = `Book bag with ${count} ${count === 1 ? "book" : "books"}`;
  return (
    <Link href="/books/bag" className={mobile ? "flex items-center justify-between border-b border-charcoal/15 py-4 font-display text-3xl text-burgundy" : "relative grid size-9 place-items-center border border-burgundy/20 text-burgundy hover:bg-burgundy hover:text-cream"} aria-label={label}>
      <span className={mobile ? "flex items-center gap-3" : ""}><BookOpen className="size-5" />{mobile && "Book bag"}</span>
      <span className={mobile ? "text-sm font-sans font-bold" : "absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-burgundy text-[0.65rem] font-bold text-cream"}>{count}</span>
    </Link>
  );
}

"use client";

import { cn } from "@/lib/utils";
import { openBag, useBag } from "../_lib/cart";
import { plural } from "../_lib/format";

/** "Bag" on the server and first paint, "Bag (n)" once the stored bag is read, so hydration matches. */
export function BagCount({ className }: { className?: string }) {
  const { count, hydrated } = useBag();
  return (
    <button type="button" onClick={openBag} aria-haspopup="dialog" className={cn("inline-flex min-h-11 items-center", className)}>
      Bag{hydrated && <span aria-hidden> ({count})</span>}
      {hydrated && <span className="sr-only">, {plural(count, "item")}</span>}
    </button>
  );
}

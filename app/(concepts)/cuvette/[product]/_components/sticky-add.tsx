"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { unitPriceOf, useBag } from "../../_lib/cart";
import { priceShort, unitPrice } from "../../_lib/format";
import type { Slug } from "../../_lib/product";
import { AddToBag } from "../../_components/add-to-bag";
import { useProduct } from "../../_components/catalog-provider";
import { usePurchase } from "./purchase";

/** Mobile only: appears once the buy box's Add button is off screen, and steps aside for the bag. */
export function StickyAdd({ slug }: { slug: Slug }) {
  const { purchase } = usePurchase();
  const { open } = useBag();
  const [away, setAway] = useState(false);
  const product = useProduct(slug);

  useEffect(() => {
    const target = document.getElementById("buy-add");
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setAway(!entry.isIntersecting));
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const shown = away && !open;
  if (!product) return null;
  const cents = unitPriceOf(product, purchase);
  const ml = product.sizes[0]?.ml ?? 30;

  return (
    <div
      inert={!shown}
      aria-hidden={!shown}
      className={cn(
        "paper fixed inset-x-0 bottom-0 z-40 border-t border-border transition-transform duration-300 ease-out motion-reduce:transition-none lg:hidden",
        shown ? "translate-y-0" : "translate-y-full",
      )}
    >
      <div className="flex items-center justify-between gap-4 px-(--gutter) pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="min-w-0">
          <p className="product-name truncate">{product.title}</p>
          <p className="truncate text-[0.8125rem] text-muted-foreground">
            {purchase === "subscribe" ? `Every ${product.subscribe.weeks} weeks` : `${ml} ml`} · {unitPrice(cents, ml)}
          </p>
        </div>
        <AddToBag slug={slug} purchase={purchase} label={`Add — ${priceShort(cents)}`} className="shrink-0 px-6" />
      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { useCatalog } from "../../_components/catalog-provider";
import { openBag, samplesToShip, useBag, type Bag } from "../../_lib/cart";
import type { ClientCatalog } from "../../_lib/client-catalog";
import { startShopifyCheckout, type ShopifyCheckoutRequest } from "../_lib/shopify-checkout";

function request(bag: Bag, buyable: Bag["lines"], catalog: ClientCatalog): ShopifyCheckoutRequest {
  return {
    lines: buyable.flatMap((line) => {
      const p = catalog.get(line.slug);
      return p && line.variantId ? [{ variantId: line.variantId, qty: line.qty, purchase: line.purchase, weeks: p.subscribe.weeks, title: p.title }] : [];
    }),
    samples: samplesToShip(bag, catalog).slugs.map((slug) => catalog.get(slug)?.title ?? slug),
    note: bag.note,
    promo: bag.promo,
  };
}

/** With the store connected, checkout is Shopify's: this page only hands the bag over and follows the link. */
export function ShopifyHandoff() {
  const { bag, buyable, hydrated } = useBag();
  const catalog = useCatalog();
  const router = useRouter();
  const sent = useRef(-1);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const empty = buyable.length === 0;

  useEffect(() => {
    if (!hydrated || sent.current === attempt) return;
    sent.current = attempt;
    if (empty) {
      router.replace("/cuvette");
      openBag();
      return;
    }
    startShopifyCheckout(request(bag, buyable, catalog))
      .then((result) => (result.ok ? window.location.assign(result.url) : setError(result.error)))
      .catch(() => setError("Checkout is unavailable for a moment. Please try again."));
  }, [hydrated, empty, bag, buyable, catalog, router, attempt]);

  if (error) {
    return (
      <div className="mx-auto max-w-[32rem] px-4 py-24 text-center sm:px-10">
        <p role="alert" className="text-[0.95rem]">
          {error}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button type="button" onClick={openBag} className="h-12 px-8 text-[0.95rem] font-normal">
            Open your bag
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setError(null);
              setAttempt((n) => n + 1);
            }}
            className="h-12 border-foreground bg-transparent px-8 text-[0.95rem] font-normal"
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <p className="px-4 py-24 text-center text-muted-foreground sm:px-10" aria-live="polite">
      {hydrated && empty ? "Your bag is empty. Taking you back to the shop." : "Taking you to secure checkout…"}
    </p>
  );
}

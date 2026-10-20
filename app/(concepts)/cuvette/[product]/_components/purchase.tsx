"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { unitPriceOf, type Purchase } from "../../_lib/cart";
import { price, unitPrice } from "../../_lib/format";
import type { Slug } from "../../_lib/product";
import { AddToBag } from "../../_components/add-to-bag";
import { useProduct } from "../../_components/catalog-provider";

const PurchaseContext = createContext<{ purchase: Purchase; setPurchase: (p: Purchase) => void }>({
  purchase: "once",
  setPurchase: () => {},
});

/** Shares the one-time / every-8-weeks choice between the buy box and the mobile add bar. */
export function PurchaseProvider({ children }: { children: ReactNode }) {
  const [purchase, setPurchase] = useState<Purchase>("once");
  return <PurchaseContext value={{ purchase, setPurchase }}>{children}</PurchaseContext>;
}

export function usePurchase() {
  return useContext(PurchaseContext);
}

export function PurchaseOptions({ slug }: { slug: Slug }) {
  const { purchase, setPurchase } = usePurchase();
  const product = useProduct(slug);
  if (!product) return null;
  const { weeks, discount } = product.subscribe;
  const options: { value: Purchase; title: string; note: string }[] = [
    { value: "once", title: "One-time", note: price(unitPriceOf(product, "once")) },
    { value: "subscribe", title: `Every ${weeks} weeks`, note: `${price(unitPriceOf(product, "subscribe"))} · save ${Math.round(discount * 100)}%` },
  ];

  return (
    <fieldset>
      <legend className="label mb-3 text-muted-foreground">Purchase</legend>
      <RadioGroup value={purchase} onValueChange={(v) => setPurchase(v as Purchase)} className="grid grid-cols-2 gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className="flex min-h-16 cursor-pointer items-start gap-3 rounded-(--radius) border border-border px-3.5 py-3 transition-colors hover:border-(--paper-field) has-data-checked:border-foreground has-data-checked:shadow-[inset_0_0_0_1px_var(--ink)]"
          >
            <RadioGroupItem value={o.value} className="mt-0.5" />
            <span className="flex flex-col gap-0.5">
              <span className="leading-tight">{o.title}</span>
              <span className="text-[0.8125rem] leading-snug text-muted-foreground">{o.note}</span>
            </span>
          </label>
        ))}
      </RadioGroup>
      <p className="mt-2 text-[0.8125rem] text-muted-foreground">
        {purchase === "subscribe" ? `Ships every ${weeks} weeks. Skip, move or cancel any time.` : `Or every ${weeks} weeks, about when a bottle runs out.`}
      </p>
    </fieldset>
  );
}

export function PriceAndAdd({ slug }: { slug: Slug }) {
  const { purchase } = usePurchase();
  const product = useProduct(slug);
  if (!product) return null;
  const cents = unitPriceOf(product, purchase);
  return (
    <div className="space-y-4">
      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-[2rem] leading-none font-light [font-stretch:112%] tracking-[-0.02em]">{price(cents)}</span>
        <span className="text-[0.8125rem] text-muted-foreground">
          {unitPrice(cents, product.sizes[0]?.ml ?? 30)} · VAT included
        </span>
      </p>
      <div id="buy-add">
        <AddToBag slug={slug} purchase={purchase} className="w-full" />
      </div>
    </div>
  );
}

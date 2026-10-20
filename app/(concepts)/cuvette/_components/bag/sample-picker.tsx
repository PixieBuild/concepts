"use client";

import { useId, useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { chosenSamples, sampleLimit, sampleOptions, setSamples, type Bag } from "../../_lib/cart";
import type { ClientCatalog } from "../../_lib/client-catalog";
import { POLICY } from "../../_lib/content";
import type { Slug } from "../../_lib/product";
import { useCatalog } from "../catalog-provider";
import { ProductName } from "./product-name";

// A full Shopify range would make this a long list; the rest wait behind "Show more", in merchant order.
const SHOWN = 4;

/** The collapsed row's value: what to do next, or what's already picked. */
export function sampleSummary(bag: Bag, catalog: ClientCatalog): string {
  const limit = sampleLimit(bag, catalog);
  const chosen = chosenSamples(bag, catalog);
  if (limit === 0) return "All in your bag";
  if (chosen.length === 0) return `Choose ${limit}`;
  return chosen.map((slug) => catalog.get(slug)?.title ?? slug).join(", ");
}

export function SamplePicker({ bag }: { bag: Bag }) {
  const id = useId();
  const [all, setAll] = useState(false);
  const catalog = useCatalog();
  const limit = sampleLimit(bag, catalog);
  const chosen = chosenSamples(bag, catalog);
  const options = sampleOptions(bag, catalog).filter((o) => !o.inBag);

  if (limit === 0) {
    return <p className="text-sm text-muted-foreground">Your bag already holds every serum we sample.</p>;
  }

  const toggle = (slug: Slug, on: boolean) => setSamples(on ? [...chosen, slug] : chosen.filter((s) => s !== slug));
  const shown = all ? options : options.filter((o, i) => i < SHOWN || chosen.includes(o.product.slug));
  const more = options.length - shown.length;

  return (
    <div role="group" aria-label={`Choose up to ${limit} free samples`} aria-describedby={`${id}-count`}>
      <p id={`${id}-count`} className="label text-muted-foreground">
        {chosen.length} of {limit} chosen · {POLICY.sampleMl} ml each
      </p>
      <ul className="mt-1">
        {shown.map(({ product: p }) => {
          const checked = chosen.includes(p.slug);
          const disabled = !checked && chosen.length >= limit;
          return (
            <li key={p.slug}>
              <label className={cn("flex min-h-11 cursor-pointer items-center gap-3 text-sm", disabled && "cursor-not-allowed opacity-45")}>
                <Checkbox checked={checked} disabled={disabled} onCheckedChange={(on) => toggle(p.slug, on)} className="size-4.5 rounded-xs" />
                <ProductName product={p} />
              </label>
            </li>
          );
        })}
      </ul>
      {(more > 0 || all) && options.length > SHOWN && (
        <button
          type="button"
          aria-expanded={all}
          onClick={() => setAll(!all)}
          className="link inline-flex min-h-11 cursor-pointer items-center text-sm"
        >
          {all ? "Show fewer" : `Show ${more} more`}
        </button>
      )}
      {chosen.length === 0 && <p className="mt-1 text-sm text-muted-foreground">Skip it and we pick for you.</p>}
    </div>
  );
}

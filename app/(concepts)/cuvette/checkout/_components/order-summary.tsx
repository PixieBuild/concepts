"use client";

import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { buyableLines, linePrice, openBag, samplesToShip, type Bag, type Totals } from "../../_lib/cart";
import { POLICY } from "../../_lib/content";
import { price } from "../../_lib/format";
import { sizeLabel } from "../../_lib/product";
import { ProductName } from "../../_components/bag/product-name";
import { Bottle } from "../../_components/bottle/bottle";
import { useCatalog } from "../../_components/catalog-provider";

type Props = { bag: Bag; totals: Totals; shippingKnown: boolean };

export function OrderSummary(props: Props) {
  return (
    <aside aria-label="Order summary" className="h-full">
      <div className="sticky top-10 max-w-[28rem]">
        <div className="flex items-baseline justify-between">
          <h2 className="title">In your bag</h2>
          <button type="button" onClick={openBag} className="link inline-flex min-h-11 cursor-pointer items-center text-sm">
            Edit bag
          </button>
        </div>
        <SummaryBody {...props} />
      </div>
    </aside>
  );
}

export function MobileSummary(props: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border-b border-border bg-(--paper-2) lg:hidden">
      <CollapsibleTrigger className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-4 px-4 text-left text-[0.95rem] sm:px-10">
        <span className="inline-flex items-center gap-2">
          {open ? "Hide" : "Show"} order summary
          <ChevronDownIcon className={cn("size-4 transition-transform motion-reduce:transition-none", open && "rotate-180")} aria-hidden />
        </span>
        <span className="font-medium">{price(props.totals.total)}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-6 sm:px-10">
        <SummaryBody {...props} />
        <button type="button" onClick={openBag} className="link mt-2 inline-flex min-h-11 cursor-pointer items-center text-sm">
          Edit bag
        </button>
      </CollapsibleContent>
    </Collapsible>
  );
}

function SummaryBody({ bag, totals, shippingKnown }: Props) {
  const catalog = useCatalog();
  const samples = samplesToShip(bag, catalog);
  return (
    <div>
      <ul className="mt-4 divide-y divide-border border-y border-border">
        {buyableLines(bag, catalog).map((line) => {
          const p = catalog.get(line.slug);
          if (!p) return null;
          return (
            <li key={line.id} className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-x-4 py-4">
              <div className="relative size-14 overflow-hidden bg-[#0e0f10]">
                <Bottle product={p} shot="thumb" sizes="56px" alt="" />
              </div>
              <div className="min-w-0">
                <p className="text-[0.95rem]">
                  <ProductName product={p} />
                  {line.qty > 1 && <span className="text-muted-foreground"> × {line.qty}</span>}
                </p>
                <p className="label mt-1 text-muted-foreground">
                  {sizeLabel(p)} · {line.purchase === "subscribe" ? `Every ${p.subscribe.weeks} weeks` : "One-time"}
                </p>
              </div>
              <p className="text-[0.95rem]">{price(linePrice(line, catalog))}</p>
            </li>
          );
        })}
        {totals.gift && (
          <li className="flex justify-between gap-4 py-3 text-[0.95rem]">
            <span>{POLICY.gift} travel size</span>
            <span>Free</span>
          </li>
        )}
      </ul>

      {samples.slugs.length > 0 && (
        <p className="mt-4 text-sm">
          <span className="label mr-2 text-muted-foreground">Samples</span>
          {samples.slugs.map((s) => catalog.get(s)?.title ?? s).join(", ")}, {POLICY.sampleMl} ml each
          {samples.autoPicked && <span className="text-muted-foreground"> (picked for you)</span>}
        </p>
      )}
      {bag.note && (
        <p className="mt-2 text-sm">
          <span className="label mr-2 text-muted-foreground">Gift note</span>“{bag.note}”
        </p>
      )}

      <dl className="mt-5 space-y-1.5 border-t border-border pt-4 text-[0.95rem]">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd>{price(totals.subtotal)}</dd>
        </div>
        {totals.discount > 0 && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{bag.promo}, 10% off serums</dt>
            <dd>−{price(totals.discount)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Delivery</dt>
          <dd>{totals.shipping === 0 ? "Free" : shippingKnown ? price(totals.shipping) : `From ${price(totals.shipping)}`}</dd>
        </div>
        <div className="flex items-baseline justify-between pt-2">
          <dt className="title">Total</dt>
          <dd className="title">{price(totals.total)}</dd>
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <dt>Includes VAT ({POLICY.vat * 100}%)</dt>
          <dd>{price(totals.vat)}</dd>
        </div>
      </dl>
    </div>
  );
}

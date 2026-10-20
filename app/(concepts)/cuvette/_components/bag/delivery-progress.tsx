import { CheckIcon } from "lucide-react";

import { POLICY } from "../../_lib/content";
import { shippingCost } from "../../_lib/delivery";
import { price, priceShort } from "../../_lib/format";

const free = POLICY.freeOver;
const gift = POLICY.giftOver;

function Done({ children }: { children: string }) {
  return (
    <span className="whitespace-nowrap">
      <CheckIcon className="mr-1.5 inline-block size-3.5 align-[-0.1em]" strokeWidth={2.25} aria-hidden />
      {children}
    </span>
  );
}

function message(goods: number) {
  if (goods < free)
    return (
      <>
        <strong className="font-medium">{price(free - goods)}</strong> to free delivery
      </>
    );
  if (goods < gift)
    return (
      <>
        <Done>Free delivery</Done>
        <span className="text-muted-foreground"> · </span>
        <strong className="font-medium">{priceShort(gift - goods)}</strong> more for a free travel size
      </>
    );
  return (
    <>
      <Done>Free delivery</Done>
      <span className="text-muted-foreground"> · </span>
      <Done>Travel size added</Done>
    </>
  );
}

function Segment({ fill, grow }: { fill: number; grow: number }) {
  return (
    <div className="relative h-0.5 bg-(--paper-line)" style={{ flexGrow: grow, flexBasis: 0 }}>
      <div
        className="absolute inset-y-0 left-0 bg-foreground transition-[width] duration-500 ease-out motion-reduce:transition-none"
        style={{ width: `${Math.min(1, Math.max(0, fill)) * 100}%` }}
      />
    </div>
  );
}

/** Two milestones on one rule, each segment sized to its share of the way: free delivery, then the travel size. Measured after any promo. */
export function DeliveryProgress({ goods }: { goods: number }) {
  return (
    <div className="px-5 pt-3 pb-3.5 sm:px-8">
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <p aria-live="polite">{message(goods)}</p>
        {goods < free && <p className="shrink-0 text-muted-foreground">Delivery {price(shippingCost("PT", "standard", goods))}</p>}
      </div>
      <div className="mt-2.5 flex gap-1" aria-hidden>
        <Segment fill={goods / free} grow={free} />
        <Segment fill={(goods - free) / (gift - free)} grow={gift - free} />
      </div>
    </div>
  );
}

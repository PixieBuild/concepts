"use client";

import { XIcon } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { bagTotals, setBagOpen, upsellFor, useBag, type Bag } from "../../_lib/cart";
import { eta, formatWindow } from "../../_lib/delivery";
import { plural, price } from "../../_lib/format";
import { pressedToast } from "../../_lib/modal";
import { useCatalog } from "../catalog-provider";
import { BagEmpty } from "./bag-empty";
import { BagExtras } from "./bag-extras";
import { BagLine, GiftLine } from "./bag-line";
import { DeliveryProgress } from "./delivery-progress";
import { SetOffer } from "./set-offer";
import { useNow } from "./use-now";

export function BagSheet() {
  const { bag, count, open, buyable } = useBag();
  const catalog = useCatalog();
  const title = useRef<HTMLHeadingElement>(null);
  const empty = bag.lines.length === 0;
  const totals = bagTotals(bag, catalog);

  return (
    <Sheet
      open={open}
      onOpenChange={(next, details) => {
        if (!next && details.reason === "outside-press" && pressedToast(details.event)) return;
        setBagOpen(next);
      }}
    >
      <SheetContent
        side="right"
        showCloseButton={false}
        initialFocus={title}
        className="w-full gap-0 border-l-0 shadow-none motion-reduce:transition-none data-[side=right]:w-full data-[side=right]:sm:max-w-110"
      >
        <SheetHeader className="flex-row items-center justify-between gap-4 border-b border-border py-1.5 pr-3 pl-5 sm:pr-6 sm:pl-8">
          <SheetTitle ref={title} tabIndex={-1} className="text-lg font-normal outline-none">
            Bag {count > 0 && <span className="text-muted-foreground">· {plural(count, "item")}</span>}
          </SheetTitle>
          <SheetDescription className="sr-only">Your bag: change quantities, choose samples, then check out.</SheetDescription>
          <SheetClose aria-label="Close bag" className="grid size-11 cursor-pointer place-items-center transition-colors hover:bg-(--paper-2)">
            <XIcon className="size-5" aria-hidden />
          </SheetClose>
        </SheetHeader>

        {buyable.length > 0 && (
          <div className="border-b border-border">
            <DeliveryProgress goods={totals.goods} />
          </div>
        )}

        <div data-lenis-prevent data-bag-body className="flex-1 overscroll-contain overflow-y-auto px-5 sm:px-8">
          {empty ? <BagEmpty /> : <BagBody bag={bag} gift={totals.gift} canBuy={buyable.length > 0} />}
        </div>

        {!empty && <BagFooter bag={bag} goods={totals.goods} discount={totals.discount} soldOut={bag.lines.length - buyable.length} />}
      </SheetContent>
    </Sheet>
  );
}

function BagBody({ bag, gift, canBuy }: { bag: Bag; gift: boolean; canBuy: boolean }) {
  const upsell = upsellFor(bag, useCatalog());
  return (
    <div className="pb-8">
      <ul className="divide-y divide-border">
        {bag.lines.map((line) => (
          <BagLine key={line.id} line={line} />
        ))}
        {gift && <GiftLine />}
      </ul>
      {upsell && <SetOffer upsell={upsell} />}
      {canBuy && (
        <div className={upsell ? "mt-6" : "mt-2"}>
          <BagExtras bag={bag} />
        </div>
      )}
    </div>
  );
}

function BagFooter({ bag, goods, discount, soldOut }: { bag: Bag; goods: number; discount: number; soldOut: number }) {
  const now = useNow();
  const canCheckout = soldOut < bag.lines.length;
  const note = canCheckout
    ? [soldOut > 0 ? "Sold-out items not included" : "VAT included", now && `Arrives ${formatWindow(eta("PT", "standard", now))}`].filter(Boolean).join(" · ")
    : "Everything in your bag has sold out.";

  return (
    <SheetFooter className="gap-0 border-t border-border bg-background px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-[0.95rem]">
          Subtotal
          {discount > 0 && (
            <span className="ml-2 text-sm text-muted-foreground">
              {bag.promo} −{price(discount)}
            </span>
          )}
        </p>
        <p className="text-xl tabular-nums">{price(goods)}</p>
      </div>
      <p className="mt-1 min-h-lh text-sm text-muted-foreground">{note}</p>
      {canCheckout ? (
        <Button
          nativeButton={false}
          render={<Link href="/cuvette/checkout" />}
          onClick={() => setBagOpen(false)}
          className="mt-3.5 h-12 w-full text-[0.95rem] font-normal"
        >
          Checkout
        </Button>
      ) : (
        <Button disabled className="mt-3.5 h-12 w-full text-[0.95rem] font-normal">
          Checkout
        </Button>
      )}
    </SheetFooter>
  );
}

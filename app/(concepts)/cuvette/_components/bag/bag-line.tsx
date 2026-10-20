"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { closeBag, isBuyable, linePrice, remove, restoreLine, setQty, unitPriceOf, type BagLine as Line } from "../../_lib/cart";
import { POLICY } from "../../_lib/content";
import { price, priceShort } from "../../_lib/format";
import { productHref, sizeLabel } from "../../_lib/product";
import { Bottle } from "../bottle/bottle";
import { useCatalog, useProduct } from "../catalog-provider";
import { ProductName } from "./product-name";
import { QtyStepper } from "./qty-stepper";

export function BagLine({ line }: { line: Line }) {
  const catalog = useCatalog();
  const p = catalog.get(line.slug);
  if (!p) return null;
  const subscribed = line.purchase === "subscribe";
  const soldOut = !isBuyable(line, catalog);
  const full = unitPriceOf(p, "once", line.variantId) * line.qty;
  const title = p.title;

  function onRemove() {
    const removed = remove(line.id);
    if (removed) toast(`Removed ${title}`, { action: { label: "Undo", onClick: () => restoreLine(removed.line, removed.index) } });
  }

  const removeButton = (
    <button
      type="button"
      onClick={onRemove}
      className="-mr-2 inline-flex min-h-11 cursor-pointer items-center px-2 text-sm text-muted-foreground underline decoration-(--paper-line) underline-offset-4 transition-colors hover:text-foreground hover:decoration-current"
    >
      Remove<span className="sr-only"> {p.title}</span>
    </button>
  );

  if (soldOut) {
    return (
      <Row
        dim
        thumb={<Bottle product={p} shot="thumb" sizes="56px" alt="" />}
        name={
          <Link href={productHref(line.slug)} onClick={closeBag} className="underline-offset-4 hover:underline">
            <ProductName product={p} />
          </Link>
        }
        meta={`${sizeLabel(p)} · Not charged`}
        price="Sold out"
      >
        <span />
        {removeButton}
      </Row>
    );
  }

  return (
    <Row
      thumb={<Bottle product={p} shot="thumb" sizes="56px" alt="" />}
      name={
        <Link href={productHref(line.slug)} onClick={closeBag} className="underline-offset-4 hover:underline">
          <ProductName product={p} />
        </Link>
      }
      meta={`${sizeLabel(p)} · ${subscribed ? `Every ${p.subscribe.weeks} weeks` : "One-time"}`}
      price={
        <>
          {subscribed && (
            <s className="mr-1.5 text-sm text-muted-foreground">
              <span className="sr-only">was </span>
              {price(full)}
            </s>
          )}
          {price(linePrice(line, catalog))}
        </>
      }
    >
      <QtyStepper value={line.qty} name={p.title} onChange={(qty) => setQty(line.id, qty)} />
      {removeButton}
    </Row>
  );
}

export function GiftLine() {
  const gift = useProduct(POLICY.giftHandle);
  return (
    <Row
      thumb={gift && <Bottle product={gift} shot="thumb" sizes="56px" alt="" />}
      name={
        <>
          {gift ? <ProductName product={gift} /> : POLICY.gift} <span className="text-muted-foreground">travel size</span>
        </>
      }
      meta={`10 ml · Gift over ${priceShort(POLICY.giftOver)}`}
      price="Free"
    />
  );
}

type RowProps = { thumb: ReactNode; name: ReactNode; meta: string; price: ReactNode; dim?: boolean; children?: ReactNode };

function Row({ thumb, name, meta, price, dim, children }: RowProps) {
  return (
    <li className="grid grid-cols-[3.5rem_1fr] gap-x-4 py-4">
      <div className={cn("relative size-14 overflow-hidden bg-[#0e0f10]", dim && "opacity-40 grayscale")}>{thumb}</div>
      <div className="min-w-0">
        <div className="flex items-baseline justify-between gap-3 text-[0.95rem] leading-snug">
          <p className="min-w-0">{name}</p>
          <p className="shrink-0 whitespace-nowrap">{price}</p>
        </div>
        <p className="label mt-1 text-muted-foreground">{meta}</p>
        {children && <div className="mt-2.5 flex items-center justify-between">{children}</div>}
      </div>
    </li>
  );
}

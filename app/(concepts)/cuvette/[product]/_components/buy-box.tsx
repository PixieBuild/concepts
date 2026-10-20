import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import type { SetProduct } from "../../_lib/catalog";
import { formatCount, priceShort } from "../../_lib/format";
import { isSet, priceOf, rating, sizeLabel, type Product } from "../../_lib/product";
import { AddToBag } from "../../_components/add-to-bag";
import { Bottle } from "../../_components/bottle/bottle";
import { DeliveryLine } from "./delivery-line";
import { SheetButton } from "./detail-sheet";
import { sheetRows } from "./product-sheets";
import { PriceAndAdd, PurchaseOptions } from "./purchase";

function SetRow({ set }: { set: SetProduct }) {
  const name = set.title.replace(/^The /, "the ");
  return (
    <div className="grid grid-cols-[4rem_1fr] items-center gap-x-4 gap-y-3 border border-border p-3 sm:grid-cols-[4rem_1fr_auto]">
      <div className="relative aspect-square overflow-hidden bg-card">
        <Bottle product={set} shot="thumb" sizes="64px" />
      </div>
      <Link href={`/cuvette/${set.slug}`} className="group flex min-h-11 flex-col justify-center text-[0.875rem] leading-snug">
        <span className="link">Make it {name}</span>
        <span className="text-muted-foreground">
          {priceShort(priceOf(set))} for {set.contains.length === 2 ? "both" : "all"} · {priceShort(set.separately)} bought separately
        </span>
      </Link>
      <AddToBag slug={set.slug} label="Add set" aria-label={`Add ${name} to bag`} variant="outline" className="col-span-2 h-11 sm:col-span-1" />
    </div>
  );
}

/** `sets` are the bundles that contain this product, from the catalogue; the first one is offered. */
export function BuyBox({ product, sets = [] }: { product: Product; sets?: SetProduct[] }) {
  const { display, count } = rating(product);
  const set = isSet(product);
  const offer = set ? undefined : sets[0];

  return (
    <section aria-labelledby="product-title" className="paper px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
      <p className="label flex justify-between gap-4 text-muted-foreground">
        <span>
          {product.code} · {product.type}
        </span>
        {product.lot.code && <span>Lot {product.lot.code}</span>}
      </p>

      <h1 id="product-title" className="heading mt-5">
        {set || !product.strength ? (
          product.name
        ) : (
          <>
            {product.name} <span style={{ color: `var(${product.colour.cssVar})` }}>{product.strength}</span>
          </>
        )}
      </h1>
      <p className="mt-3 text-muted-foreground">{product.descriptor}</p>
      {count > 0 && (
        <a href="#reviews" className="mt-3 inline-flex min-h-11 items-center gap-2 text-[0.875rem]">
          <span aria-hidden>★</span>
          <span>{display}</span>
          <span className="link text-muted-foreground">{formatCount(count)} reviews</span>
        </a>
      )}

      <p className="mt-4 border-t border-border pt-5">{product.benefit}</p>

      {set && (
        <ul className="mt-5 space-y-1">
          {product.parts.map((part) => (
            <li key={part.slug}>
              <Link href={`/cuvette/${part.slug}`} className="flex min-h-11 items-center justify-between gap-4 border-b border-border">
                <span className="flex items-center gap-3">
                  <span className="size-2.5 rounded-full" style={{ background: `var(${part.colour.cssVar}-band)` }} aria-hidden />
                  {part.title} · {sizeLabel(part)}
                </span>
                <ArrowRightIcon className="size-4 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 space-y-6">
        <p className="label flex justify-between text-muted-foreground">
          <span>Size</span>
          <span className="text-foreground">{set ? sizeLabel(product) : `${sizeLabel(product)} / ${Math.round((product.sizes[0]?.ml ?? 30) / 29.57)} fl oz`}</span>
        </p>
        <PurchaseOptions slug={product.slug} />
        <PriceAndAdd slug={product.slug} />
        {set && <p className="-mt-2 text-[0.8125rem] text-muted-foreground">{priceShort(product.separately)} if bought separately.</p>}
        {offer && <SetRow set={offer} />}
        <DeliveryLine price={priceOf(product)} />
        <ul className="-mt-2">
          {sheetRows(product).map((row) => (
            <li key={row.id} className="border-b border-border">
              <SheetButton id={row.id} className="group w-full justify-between gap-4">
                {row.label}
                <ArrowRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
              </SheetButton>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

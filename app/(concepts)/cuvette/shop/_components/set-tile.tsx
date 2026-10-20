import Link from "next/link";

import type { SetCard } from "../../_lib/client-catalog";
import { priceShort, unitPrice } from "../../_lib/format";
import { priceOf, productHref, sizeLabel } from "../../_lib/product";
import { AddToBag } from "../../_components/add-to-bag";
import { Bottle } from "../../_components/bottle/bottle";

/** A set reads as an order of use, so it gets a paper panel with its serums numbered, not a tile like the rest. */
export function SetTile({ set }: { set: SetCard }) {
  const cents = priceOf(set);
  const saving = set.separately - cents;
  const ml = set.parts.reduce((sum, part) => sum + (part.sizes[0]?.ml ?? 30), 0);
  const href = productHref(set.slug);

  return (
    <li className="paper grid overflow-hidden sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <Link href={href} tabIndex={-1} aria-hidden className="relative block aspect-4/3 bg-[#0c0d0e] sm:aspect-auto sm:min-h-80">
        <Bottle product={set} shot="pack" sizes="(min-width: 1280px) 30vw, (min-width: 640px) 40vw, 100vw" alt="" />
      </Link>

      <div className="flex flex-col gap-6 p-5 sm:p-7 xl:p-9">
        <p className="label flex justify-between gap-4 text-muted-foreground">
          <span>Set · {sizeLabel(set)}</span>
          {saving > 0 && <span className="text-foreground">Save {priceShort(saving)}</span>}
        </p>

        <div>
          <h3 className="title">
            <Link href={href} className="inline-flex min-h-11 items-center hover:underline hover:decoration-1 hover:underline-offset-4">
              {set.title}
            </Link>
          </h3>
          {set.descriptor && <p className="mt-2 text-muted-foreground">{set.descriptor}</p>}
        </div>

        <ol aria-label="In the order you use them" className="border-t border-border">
          {set.parts.map((part, i) => (
            <li key={part.slug} className="grid min-h-12 grid-cols-[1.25rem_0.625rem_1fr_auto] items-center gap-3 border-b border-border">
              <span className="label text-muted-foreground">{i + 1}</span>
              <span aria-hidden className="size-2.5 rounded-full" style={{ backgroundColor: part.colour.band }} />
              <Link href={productHref(part.slug)} className="inline-flex min-h-11 items-center hover:underline hover:decoration-1 hover:underline-offset-4">
                {part.title}
              </Link>
              <span className="label text-muted-foreground">{part.when.join(" ")}</span>
            </li>
          ))}
        </ol>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <p>
            <span className="block text-[1.75rem] leading-none font-light tracking-tight">{priceShort(cents)}</span>
            <span className="label mt-2 block text-muted-foreground">
              {priceShort(set.separately)} bought separately · {unitPrice(cents, ml)}
            </span>
          </p>
          <AddToBag slug={set.slug} label={`Add set — ${priceShort(cents)}`} className="max-sm:w-full" />
        </div>
      </div>
    </li>
  );
}

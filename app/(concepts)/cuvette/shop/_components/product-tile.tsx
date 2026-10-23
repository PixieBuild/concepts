import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { priceShort, unitPrice } from "../../_lib/format";
import { priceOf, productHref, sizeLabel, type ProductCard } from "../../_lib/product";
import { hasStill } from "../../_lib/stills";
import { AddToBag } from "../../_components/add-to-bag";
import { Bottle } from "../../_components/bottle/bottle";
import { LivePoster, ProductPhoto, Still } from "../../_components/still";

const SIZES = "(min-width: 2200px) 420px, (min-width: 1280px) 22vw, (min-width: 768px) 30vw, 46vw";
const REVEAL = "opacity-0 transition-opacity duration-500 group-hover:opacity-100 motion-reduce:transition-none";

/** On hover the frame turns to a second picture: the printed label for a baked product, else its second photo. */
function SecondFrame({ product }: { product: ProductCard }) {
  if (product.baked && hasStill(product.slug, "label")) {
    return <Still product={product.slug} shot="label" alt="" fill sizes={SIZES} className={REVEAL} />;
  }
  const second = product.photos[1];
  return second ? <ProductPhoto photo={second} alt="" sizes={SIZES} className={REVEAL} /> : null;
}

function flag(product: ProductCard): string | null {
  if (!product.available) return "Sold out";
  return product.tags.includes("new") ? "New" : null;
}

export function ProductTile({ product, frame, priority }: { product: ProductCard; frame: number; priority?: boolean }) {
  const cents = priceOf(product);
  const ml = product.sizes[0]?.ml ?? 30;
  const note = flag(product);
  const composited = !product.baked && product.looks.length > 0;

  return (
    <li className="group relative flex flex-col">
      <div className="relative aspect-4/5 overflow-hidden bg-[#0c0d0e] -outline-offset-2 group-has-[a:focus-visible]:outline-2 group-has-[a:focus-visible]:outline-ring">
        {/* A live composite waits on the empty set, not the product's photo, so the grid never morphs one picture into another. */}
        {composited && <LivePoster tint={product.colour.tint} />}
        <Bottle product={product} shot="pack" sizes={SIZES} priority={priority} alt="" fallback={!composited} />
        <SecondFrame product={product} />
        <span aria-hidden className="label absolute top-3 left-3 text-foreground/55 sm:top-4 sm:left-4">
          {String(frame).padStart(2, "0")}
        </span>
        {note && <span className="label absolute top-3 right-3 text-foreground sm:top-4 sm:right-4">{note}</span>}
        {product.available && (
          <AddToBag
            slug={product.slug}
            variant="outline"
            aria-label={`Add ${product.title} to bag, ${priceShort(cents)}`}
            label={<PlusIcon aria-hidden className="size-4" />}
            className="absolute right-2 bottom-2 z-10 size-11 rounded-full border-foreground/35 bg-[#0c0d0e] px-0 text-foreground hover:border-foreground hover:bg-foreground hover:text-background sm:right-3 sm:bottom-3"
          />
        )}
      </div>

      <h3 className="mt-3.5 text-[1rem] leading-tight sm:text-[1.125rem]">
        <Link href={productHref(product.slug)} className="product-name after:absolute after:inset-0 focus-visible:outline-none">
          {product.name}
          {product.strength && (
            <span className="font-normal" style={{ color: `var(${product.colour.cssVar})` }}>
              {" "}
              {product.strength}
            </span>
          )}
        </Link>
      </h3>
      {product.jobs.length > 0 && <p className="label mt-1.5 truncate text-muted-foreground">{product.jobs.join(" · ")}</p>}
      <p className="mt-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        {product.compareAt && product.compareAt > cents && (
          <s className="text-muted-foreground">
            <span className="sr-only">Was </span>
            {priceShort(product.compareAt)}
          </s>
        )}
        <span className={cn("text-[1.0625rem]", !product.available && "text-muted-foreground")}>{priceShort(cents)}</span>
        <span className="label text-muted-foreground">
          {sizeLabel(product)} · {unitPrice(cents, ml)}
        </span>
      </p>
    </li>
  );
}

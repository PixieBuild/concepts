"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRightIcon, PlusIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { priceShort, unitPrice } from "../_lib/format";
import { isSet, priceOf, rangeSummary, sizeLabel, type ProductCard, type Slug } from "../_lib/product";
import { AddToBag } from "./add-to-bag";
import { Bottle } from "./bottle/bottle";
import { useCatalog } from "./catalog-provider";

type Product = ProductCard;

function Strength({ product }: { product: Product }) {
  if (isSet(product)) {
    return (
      <span aria-hidden className="flex gap-1.5 pl-1">
        {product.parts.map((part) => (
          <span key={part.slug} className="size-2.5 rounded-full" style={{ backgroundColor: part.colour.band }} />
        ))}
      </span>
    );
  }
  return (
    <span className="figure" style={{ color: `var(${product.colour.cssVar})` }}>
      {product.strength}
    </span>
  );
}

function PriceNote({ product }: { product: Product }) {
  return isSet(product) ? <>{priceShort(product.separately)} bought separately</> : <>{unitPrice(priceOf(product), product.sizes[0]?.ml ?? 30)}</>;
}

function Row({ product, on, onShow }: { product: Product; on: boolean; onShow: () => void }) {
  const href = `/cuvette/${product.slug}`;
  const price = priceShort(priceOf(product));
  return (
    <li
      onMouseEnter={onShow}
      onFocus={onShow}
      className={cn(
        "group relative grid grid-cols-[4.5rem_1fr_auto] items-center gap-4 border-b border-border py-4 transition-[opacity,background-color] duration-300 sm:grid-cols-[6rem_1fr_auto] sm:gap-6",
        "lg:grid-cols-[7.5rem_1fr_7.5rem_6.5rem_2.75rem] lg:gap-5 lg:px-5 lg:py-7 xl:grid-cols-[8rem_1fr_7rem_7.5rem_6.5rem_2.75rem]",
        on && "lg:bg-card",
      )}
    >
      <span className="relative block aspect-square overflow-hidden bg-[#0c0d0e] lg:hidden">
        <Bottle product={product} shot="thumb" sizes="(min-width: 640px) 96px, 72px" alt="" />
      </span>
      <span className="hidden lg:block">
        <Strength product={product} />
      </span>

      <div className="min-w-0">
        <Link href={href} className="product-name text-[1.1rem] after:absolute after:inset-0 focus-visible:outline-none sm:text-[1.25rem] lg:text-[1.3rem]">
          <span className="lg:hidden">{product.title}</span>
          <span className="hidden lg:inline">{product.name}</span>
        </Link>
        <p className="mt-1 text-[0.9rem] leading-snug text-muted-foreground max-lg:hidden">{product.descriptor}</p>
        <p className="mt-1 flex flex-wrap items-baseline gap-x-2 lg:hidden">
          <span>{price}</span>
          <span className="label text-muted-foreground">
            {product.job} · {product.when.join(" ")}
          </span>
        </p>
      </div>

      <p className="label hidden leading-relaxed text-muted-foreground xl:block">
        {product.jobs.map((job) => (
          <span key={job} className="block">
            {job}
          </span>
        ))}
      </p>
      <p className="label hidden text-muted-foreground lg:block">
        {product.when.join(" ")} · pH {product.ph.replace(" and ", "/")}
      </p>
      <p className="hidden text-right lg:block">
        <span className="text-[1.15rem]">{price}</span>
        <span className="label mt-1 block text-muted-foreground">
          <PriceNote product={product} />
        </span>
      </p>

      <AddToBag
        slug={product.slug}
        variant="outline"
        aria-label={`Add ${product.title} to bag, ${price}`}
        label={<PlusIcon aria-hidden className="size-4" />}
        className={cn(
          "relative z-10 size-11 rounded-full border-input bg-transparent px-0 text-foreground hover:bg-foreground hover:text-background",
          on && "lg:border-foreground lg:bg-foreground lg:text-background",
        )}
      />
      <span aria-hidden className="pointer-events-none absolute inset-0 -outline-offset-2 group-has-[a:focus-visible]:outline-2 group-has-[a:focus-visible]:outline-ring" />
    </li>
  );
}

const WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];

/** "Four actives.", counting the single serums: a set adds none of its own. */
function actives(products: Product[]): string {
  const n = products.filter((p) => !isSet(p)).length;
  return `${WORDS[n] ?? n} ${n === 1 ? "active" : "actives"}.`;
}

/** The first few listed products in range order; the headline counts the whole shop, and /cuvette/shop lists it. */
export function Range({ products }: { products: Product[] }) {
  const { listed } = useCatalog();
  const [hovered, setHovered] = useState<Slug | null>(null);
  const preview = products.find((p) => p.slug === hovered) ?? products[0];
  const shown = preview?.slug;

  return (
    <section id="range" aria-labelledby="range-title" className="scroll-mt-14">
      <div className="px-(--gutter) py-20 lg:py-32">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="label text-muted-foreground">The range · {rangeSummary(listed)}</p>
            <h2 id="range-title" className="heading mt-4">
              {actives(listed)} <span className="text-muted-foreground">One job each.</span>
            </h2>
          </div>
          <p className="label text-muted-foreground lg:pb-2">Prices include VAT</p>
        </div>

        <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-8">
            <ul className="border-t border-border">
              {products.map((p) => (
                <Row key={p.slug} product={p} on={p.slug === shown} onShow={() => setHovered(p.slug)} />
              ))}
            </ul>
            <Link
              href="/cuvette/shop"
              className="group flex min-h-20 items-center justify-between gap-4 border-b border-border py-4 -outline-offset-2 lg:min-h-24 lg:px-5"
            >
              <span className="product-name text-[1.1rem] sm:text-[1.25rem] lg:text-[1.3rem]">
                See all {listed.length} products
              </span>
              <span
                aria-hidden
                className="grid size-11 place-items-center rounded-full border border-input transition-colors duration-300 group-hover:border-foreground group-hover:bg-foreground group-hover:text-background"
              >
                <ArrowRightIcon className="size-4" />
              </span>
            </Link>
          </div>

          <figure className="hidden lg:col-span-4 lg:block">
            <div className="sticky top-24">
              <div className="relative aspect-4/5 overflow-hidden bg-[#0c0d0e]">
                {products.map((p) => (
                  <Bottle
                    key={p.slug}
                    product={p}
                    shot="pack"
                    quality={90}
                    sizes="(min-width: 1760px) 560px, 32vw"
                    alt={p.slug === shown ? undefined : ""}
                    className={cn("transition-opacity duration-500", p.slug === shown ? "opacity-100" : "opacity-0")}
                  />
                ))}
              </div>
              {preview && (
                <figcaption className="label mt-3 flex justify-between gap-4 text-muted-foreground">
                  <span>
                    {preview.title} · {sizeLabel(preview)}
                  </span>
                  {preview.lot.code && <span>Lot {preview.lot.code}</span>}
                </figcaption>
              )}
            </div>
          </figure>
        </div>
      </div>
    </section>
  );
}

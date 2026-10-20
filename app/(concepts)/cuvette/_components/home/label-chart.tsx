"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import type { Product, ProductCard, Slug } from "../../_lib/product";
import { Bottle } from "../bottle/bottle";
import { Choices } from "./choices";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Type size falls with rank, like an optician's chart; it shows order, not amount. */
function sizeAt(i: number, n: number): CSSProperties {
  const t = Math.pow(i / Math.max(1, n - 1), 0.7);
  return { "--m": `${lerp(2.25, 0.95, t).toFixed(3)}rem`, "--d": `${lerp(3.6, 1.05, t).toFixed(3)}rem` } as CSSProperties;
}

/** A card plus its lead-active lines (`inciLead`) and what every INCI line does, already resolved on the server. */
export type ChartProduct = ProductCard & Pick<Product, "inciLead"> & { roles: Record<string, string> };

const roleOf = (product: ChartProduct, name: string) => product.roles[name] ?? "Listed on the label.";

/** `products` are the catalogue's picks for the "label-chart" slot, each with a full INCI list. */
export function LabelChart({ products }: { products: ChartProduct[] }) {
  const [chosen, setSlug] = useState<Slug | null>(null);
  const [picked, setPicked] = useState(0);
  const product = products.find((p) => p.slug === chosen) ?? products[0];
  const slug = product.slug;
  const lead = product.inciLead ?? { lines: [], amounts: {} };
  const ink = { color: `var(${product.colour.cssVar})` };
  const current = product.inci[picked] ?? product.inci[0];

  const choose = (next: Slug) => {
    setSlug(next);
    setPicked(0);
  };

  return (
    <section id="formula" aria-labelledby="formula-title" className="scroll-mt-14 border-t border-border">
      <div className="grid gap-12 px-(--gutter) py-20 lg:grid-cols-12 lg:gap-12 lg:py-32">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-24">
            <p className="label text-muted-foreground">The formula, every line of it</p>
            <h2 id="formula-title" className="heading mt-4">
              Read it top to bottom.
            </h2>
            <Choices
              label="Serum"
              value={slug}
              onChange={choose}
              options={products.map((p) => ({
                value: p.slug,
                label: (
                  <>
                    <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: p.colour.band }} />
                    {p.name}
                  </>
                ),
              }))}
              className="mt-8"
            />

            {/* Below lg the hero's own label frame is a screen away, so the chart goes straight to the list. */}
            <figure className="relative mt-8 hidden aspect-4/5 max-w-[30rem] overflow-hidden bg-[#0c0d0e] lg:block">
              {products.map((p) => (
                <Bottle
                  key={p.slug}
                  product={p}
                  shot="label"
                  sizes="480px"
                  alt={p.slug === slug ? undefined : ""}
                  className={cn("object-[50%_46%] transition-opacity duration-500", p.slug === slug ? "opacity-100" : "opacity-0")}
                />
              ))}
              <figcaption aria-live="polite" className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/85 via-black/60 to-transparent px-5 pt-16 pb-5">
                <span className="label block text-foreground/70">
                  {String(picked + 1).padStart(2, "0")} · {current}
                </span>
                <span className="mt-2 block text-[1.0625rem] leading-snug text-foreground">{roleOf(product, current)}</span>
              </figcaption>
            </figure>
          </div>
        </div>

        <div className="lg:col-span-7">
          <ol aria-label={`${product.title}, full ingredient list`} className="border-t border-border">
            {product.inci.map((name, i) => {
              const isLead = lead.lines.includes(name);
              const on = i === picked;
              return (
                <li key={name} className="border-b border-border">
                  <button
                    type="button"
                    aria-expanded={on}
                    onClick={() => setPicked(i)}
                    onMouseEnter={() => setPicked(i)}
                    onFocus={() => setPicked(i)}
                    className="group grid min-h-11 w-full grid-cols-[1.75rem_1fr_auto] items-baseline gap-3 py-2 text-left -outline-offset-2 lg:grid-cols-[2.25rem_1fr_auto]"
                  >
                    <span className="label text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                    <span
                      style={{ ...sizeAt(i, product.inci.length), ...(isLead ? ink : undefined) }}
                      className={cn(
                        "text-(length:--m) leading-[1.02] font-light tracking-[-0.025em] [font-stretch:118%] transition-colors duration-300 lg:text-(length:--d)",
                        !isLead && (on ? "text-foreground" : "text-foreground/60 group-hover:text-foreground"),
                      )}
                    >
                      {name}
                    </span>
                    <span className="label text-right text-muted-foreground" style={isLead ? ink : undefined}>
                      {lead.amounts[name]}
                    </span>
                  </button>
                  {on && <p className="pb-4 pl-[2.5rem] text-[0.9375rem] text-muted-foreground lg:hidden">{roleOf(product, name)}</p>}
                </li>
              );
            })}
          </ol>
          <p className="label mt-6 max-w-[60ch] leading-relaxed text-muted-foreground">
            Heaviest first, as on the label. Below 1% the order is free. Type size shows rank, not amount.
          </p>
          <Link href={`/cuvette/${product.slug}`} className="link mt-4 inline-flex min-h-11 items-center">
            More on {product.title}
          </Link>
        </div>
      </div>
    </section>
  );
}

import type { CSSProperties } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { costBar, isSet, priceOf, sizeLabel, type Product, type SetFields } from "../../_lib/product";
import { price, priceShort } from "../../_lib/format";
import { AddToBag } from "../../_components/add-to-bag";
import { canShow } from "../../_lib/stills";
import { Bottle } from "../../_components/bottle/bottle";
import { SheetButton } from "./detail-sheet";
import { SHEETS } from "./product-sheets";

const ink = (p: Product) => ({ color: `var(${p.colour.cssVar})` });
const months = (pao: string) => `${parseInt(pao)} months`;
const WORDS: Record<number, string> = { 2: "two", 4: "four", 8: "eight" };

export function SpecStrip({ product }: { product: Product }) {
  const set = isSet(product);
  const specs = [
    { label: "Dose", value: product.dose },
    { label: "Texture", value: product.texture },
    { label: "pH", value: product.ph },
    { label: "Fragrance", value: "None added" },
    { label: "After opening", value: product.pao ? `Use within ${months(product.pao)}` : "" },
    { label: set ? "Contains" : "Size", value: set ? sizeLabel(product) : `${sizeLabel(product)} / ${Math.round((product.sizes[0]?.ml ?? 30) / 29.57)} fl oz` },
  ].filter((spec) => spec.value);
  return (
    <section aria-label="Specification" className="px-(--gutter)">
      <dl
        style={{ "--specs": specs.length } as CSSProperties}
        className="grid grid-cols-2 gap-px border-y border-border bg-border sm:grid-cols-3 lg:grid-cols-[repeat(var(--specs),minmax(0,1fr))]"
      >
        {specs.map((s) => (
          <div key={s.label} className="bg-background px-4 py-5 sm:px-5">
            <dt className="label text-muted-foreground">{s.label}</dt>
            <dd className="mt-2 text-[1.0625rem] leading-snug">{s.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

const COUNT = ["", "One", "Two", "Three", "Four", "Five", "Six"];

export function LabelBand({ product }: { product: Product }) {
  const count = product.actives.length;
  if (!count) return null;
  const band = canShow(product, "label-wide");
  const macro = !band && canShow(product, "label");
  return (
    <section aria-labelledby="formula-heading" className="relative">
      {band && (
        <div className="relative aspect-[4/3] overflow-hidden bg-card sm:aspect-[16/9] sm:max-h-[90svh] sm:w-full">
          <Bottle product={product} shot="label-wide" sizes="100vw" quality={90} className="object-[80%_50%]" fallback={false} />
        </div>
      )}
      {macro && (
        <div className="relative mb-12 aspect-[4/3] overflow-hidden bg-card sm:mb-16 sm:aspect-[21/9] sm:max-h-[80svh]">
          <Bottle product={product} shot="label" sizes="100vw" quality={90} className="object-[50%_46%]" fallback={false} />
        </div>
      )}
      <div className="px-(--gutter)">
        <h2
          id="formula-heading"
          className={cn("heading max-w-[16ch]", band ? "mt-10 sm:absolute sm:top-[5vw] sm:left-10 sm:mt-0 sm:max-w-[14ch]" : "sm:max-w-[22ch]")}
        >
          {COUNT[count] ?? count} working ingredient{count === 1 ? "" : "s"}.{" "}
          <span className={cn("text-muted-foreground", band && "sm:text-foreground")}>Nothing for scent, colour or feel.</span>
        </h2>
        <ul
          style={{ "--actives": count > 4 ? 3 : count } as CSSProperties}
          className={cn("mt-10 grid border-t border-border sm:grid-cols-[repeat(var(--actives),minmax(0,1fr))]", band && "sm:mt-0")}
        >
          {product.actives.map((a, i) => (
            <li key={a.name} className="flex items-end justify-between gap-6 border-b border-border py-6 sm:border-b-0 sm:px-6 sm:first:ps-0 sm:[&+&]:border-s">
              <span>
                <span className="block">{a.name}</span>
                <span className="mt-1 block text-[0.875rem] text-muted-foreground">{a.does}</span>
              </span>
              <span className="figure shrink-0" style={i === 0 ? ink(product) : undefined}>
                {a.amount}
              </span>
            </li>
          ))}
        </ul>
        <SheetButton id={SHEETS.formula} className="link mt-2 text-[0.9375rem]">
          Full formula (INCI)
        </SheetButton>
      </div>
    </section>
  );
}

export function DropBand({ product }: { product: Product }) {
  if (!canShow(product, "drop")) return null;
  return (
    <figure className="relative aspect-[4/5] overflow-hidden bg-card sm:aspect-[16/9] sm:max-h-[90svh] sm:w-full">
      <Bottle product={product} shot="drop" sizes="100vw" quality={90} className="object-[50%_68%]" fallback={false} />
      <figcaption className="label absolute bottom-4 left-4 flex gap-6 text-foreground/90 [text-shadow:0_1px_2px_rgb(0_0_0/0.6)] sm:bottom-6 sm:left-10">
        <span>Dose · {product.dose}</span>
        <span>Texture · {product.texture}</span>
      </figcaption>
    </figure>
  );
}

const step = (n: number) => String(n).padStart(2, "0");

function timeOfDay(when: Product["when"]): string {
  if (when.length === 1) return when[0] === "AM" ? "morning" : "evening";
  return "routine";
}

export function MorningOrder({ product }: { product: Product & SetFields }) {
  const parts = product.parts;
  const order = ["Cleanse", ...parts.map((p) => p.name), ...(product.when.includes("AM") ? ["SPF"] : [])];
  return (
    <section aria-labelledby="order-heading" className="px-(--gutter)">
      <p className="label text-muted-foreground">How it works</p>
      <h2 id="order-heading" className="heading mt-4">
        Your {timeOfDay(product.when)}, <span className="text-muted-foreground">in order.</span>
      </h2>
      <p className="label mt-6 text-muted-foreground">{order.map((name, i) => `${step(i + 1)} ${name}`).join(" · ")}</p>
      <ol className="mt-10 grid gap-x-2 gap-y-10 sm:grid-cols-2">
        {parts.map((p, i) => (
          <li key={p.slug}>
            <Link href={`/cuvette/${p.slug}`} className="group block">
              <div className="relative aspect-[5/4] overflow-hidden bg-card">
                <Bottle product={p} shot="hero-wide" sizes="(min-width: 640px) 50vw, 100vw" />
              </div>
              <p className="label mt-4 text-muted-foreground">Step {step(i + 2)}</p>
              <p className="title mt-2">
                {p.name} <span style={ink(p)}>{p.strength}</span>
              </p>
              <p className="mt-2 max-w-[44ch] text-muted-foreground">{p.howTo.layering}</p>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function Results({ product }: { product: Product }) {
  const s = product.study;
  if (!s) return null;
  const method = ["Independent consumer study", `${s.n} participants, ages ${s.ages}`, s.use, `${s.weeks} weeks`, "Self-assessed", String(s.year)];
  return (
    <section aria-labelledby="results-heading" className="px-(--gutter)">
      <p className="label text-muted-foreground">Results</p>
      <h2 id="results-heading" className="heading mt-4">
        What changed <span className="text-muted-foreground">in {WORDS[s.weeks] ?? s.weeks} weeks.</span>
      </h2>
      <p className="label mt-8 border-y border-border py-3 text-muted-foreground sm:hidden">{method.join(" · ")}</p>
      <ul className="label mt-8 hidden flex-wrap border-y border-border text-muted-foreground sm:flex">
        {method.map((m) => (
          <li key={m} className="border-border py-3 pe-4 [&+&]:border-s [&+&]:ps-4">
            {m}
          </li>
        ))}
      </ul>
      <ul className="mt-12 grid gap-10 sm:grid-cols-3">
        {s.results.map((r) => (
          <li key={r.label}>
            <span className="figure-xl block">{r.value}%</span>
            <span className="mt-4 block text-muted-foreground">{r.label}</span>
          </li>
        ))}
      </ul>
      <p className="mt-10 flex flex-wrap items-center gap-x-6 text-[0.875rem] text-muted-foreground">
        <SheetButton id={SHEETS.study} className="link text-foreground">
          Study details
        </SheetButton>
        Individual results vary. Not a clinical trial.
      </p>
    </section>
  );
}

const SEGMENT = ["var(--band)", "color-mix(in srgb, var(--band) 62%, #2a2c2e)", "#6b6f73", "#4c5054", "#383b3e", "#ebebe8", "#25292c"];

export function Costs({ product }: { product: Product }) {
  const bar = costBar(product);
  const total = priceOf(product);
  const band = { "--band": `var(${product.colour.cssVar}-band)` } as CSSProperties;
  return (
    <section id="costs" aria-labelledby="costs-heading" className="scroll-mt-28 px-(--gutter)">
      <div className="grid gap-16 lg:grid-cols-12">
        <div className="lg:col-span-7" style={band}>
          <p className="label text-muted-foreground">Pricing, openly</p>
          <h2 id="costs-heading" className="heading mt-4">
            What {priceShort(total)} <span className="text-muted-foreground">pays for.</span>
          </h2>
          <div className="mt-10 flex h-12 gap-0.5" role="img" aria-label={bar.map((c) => `${c.label} ${price(c.cents)}`).join(", ")}>
            {bar.map((c, i) => (
              <span key={c.label} className="h-full rounded-[1px]" style={{ flexGrow: c.cents, flexBasis: 0, background: SEGMENT[i] }} />
            ))}
          </div>
          <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
            {bar.map((c, i) => (
              <li key={c.label} className="flex gap-3">
                <span className="mt-1.5 size-2 shrink-0 rounded-full ring-1 ring-border" style={{ background: SEGMENT[i] }} aria-hidden />
                <span>
                  <span className="block text-[1.0625rem]">{price(c.cents)}</span>
                  <span className="block text-[0.8125rem] text-muted-foreground">{c.label}</span>
                </span>
              </li>
            ))}
            <li className="flex gap-3 sm:col-span-1">
              <span className="mt-1.5 size-2 shrink-0" aria-hidden />
              <span>
                <span className="block text-[1.0625rem]">{price(total)}</span>
                <span className="block text-[0.8125rem] text-muted-foreground">You pay</span>
              </span>
            </li>
          </ul>
        </div>
        <div className="lg:col-span-4 lg:col-start-9">
          <h3 className="label text-muted-foreground">After the last drop</h3>
          <dl className="mt-6 divide-y divide-border border-y border-border lg:mt-[4.25rem]">
            {product.endOfLife.map((e) => (
              <div key={e.part} className="grid grid-cols-[5.5rem_1fr] gap-4 py-3.5">
                <dt className="label pt-0.5 text-muted-foreground">{e.part}</dt>
                <dd>
                  {e.material}. <span className="text-muted-foreground">{e.bin}.</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function nextLine(product: Product, next: Product): string {
  const shared = product.when.filter((part) => next.when.includes(part));
  if (shared.includes("AM")) return "Next in your morning";
  if (shared.includes("PM")) return "With it, at night";
  return "Pairs with it";
}

export function NextStep({ product, next }: { product: Product; next: Product | null }) {
  if (!next) return null;
  const href = `/cuvette/${next.slug}`;
  return (
    <section aria-labelledby="next-heading" className="px-(--gutter)">
      <div className="grid gap-8 border-t border-border pt-10 sm:grid-cols-12 sm:items-end sm:gap-6 sm:pt-14">
        <Link href={href} className="relative block aspect-[4/5] overflow-hidden bg-card sm:col-span-6 lg:col-span-5" tabIndex={-1} aria-hidden>
          <Bottle product={next} shot="pack" sizes="(min-width: 1024px) 40vw, (min-width: 640px) 50vw, 100vw" alt="" />
        </Link>
        <div className="sm:col-span-6 lg:col-span-5 lg:col-start-7">
          <p className="label text-muted-foreground">{nextLine(product, next)}</p>
          <h2 id="next-heading" className="heading mt-4">
            <Link href={href} className="hover:underline hover:decoration-1 hover:underline-offset-8">
              {next.name} <span style={ink(next)}>{next.strength}</span>
            </Link>
          </h2>
          <p className="lead mt-5 max-w-[44ch] text-muted-foreground">{next.benefit}</p>
          <p className="mt-3 max-w-[44ch] text-[0.9375rem] text-muted-foreground">{next.howTo.layering}</p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <AddToBag slug={next.slug} label={`Add — ${priceShort(priceOf(next))}`} variant="outline" className="px-6" />
            <Link href={href} className="link inline-flex min-h-11 items-center text-[0.9375rem]">
              Read about {next.name}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

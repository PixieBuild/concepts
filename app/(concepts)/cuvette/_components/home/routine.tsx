"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { addToBag } from "../../_lib/cart";
import type { SetCard } from "../../_lib/client-catalog";
import { priceShort } from "../../_lib/format";
import { concernId, priceOf, type ProductCard, type Slug } from "../../_lib/product";
import { routineFor, routineSerums, type RoutineStep } from "../../_lib/routine";
import { Bottle } from "../bottle/bottle";
import type { ConcernOption } from "../concern-filter";
import { Choices } from "./choices";

/** The set that is exactly these serums, if the store sells one. */
function setFor(serums: Slug[], sets: SetCard[]): SetCard | undefined {
  return sets.find((set) => set.contains.length === serums.length && set.contains.every((slug) => serums.includes(slug)));
}

function Step({ step, index, product }: { step: RoutineStep; index: number; product?: ProductCard }) {
  const number = <span className="label pt-1 text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>;
  if (step.kind === "yours") {
    return (
      <li className="grid min-h-18 grid-cols-[2rem_1fr] items-start gap-3 border-b border-border py-4">
        {number}
        <span>
          <span className="block text-foreground/60">{step.name}</span>
          <span className="mt-0.5 block text-[0.875rem] text-muted-foreground">{step.note}</span>
        </span>
      </li>
    );
  }
  if (!product) return null;
  return (
    <li className="grid grid-cols-[2rem_1fr_3.5rem] items-start gap-3 border-b border-border py-4 sm:grid-cols-[2rem_1fr_4rem]">
      {number}
      <span>
        <Link href={`/cuvette/${product.slug}`} className="product-name -my-2.5 inline-flex min-h-11 items-center gap-1 text-[1.0625rem] hover:underline hover:decoration-1 hover:underline-offset-4">
          {product.name} <span style={{ color: `var(${product.colour.cssVar})` }}>{product.strength}</span>
        </Link>
        <span className="label mt-1 block text-foreground">{step.dose}</span>
        <span className="mt-1 block text-[0.875rem] text-muted-foreground">{step.note}</span>
      </span>
      <span aria-hidden className="relative block aspect-square overflow-hidden bg-[#0c0d0e]">
        <Bottle product={product} shot="thumb" sizes="64px" alt="" />
      </span>
    </li>
  );
}

function Column({ title, time, steps, products }: { title: string; time: string; steps: RoutineStep[]; products: Map<Slug, ProductCard> }) {
  return (
    <div>
      <h3 className="label flex justify-between border-b border-foreground pb-3">
        <span>{title}</span>
        <span className="text-muted-foreground">{time}</span>
      </h3>
      <ol>
        {steps.map((step, i) => (
          <Step key={`${step.kind === "ours" ? step.slug : step.name}-${i}`} step={step} index={i} product={step.kind === "ours" ? products.get(step.slug) : undefined} />
        ))}
      </ol>
    </div>
  );
}

type Props = {
  /** routineProducts(): serums with a `routine`. */
  products: ProductCard[];
  concerns: ConcernOption[];
  sets: SetCard[];
  photos: Record<Slug, string | null>;
};

export function Routine({ products, concerns, sets, photos }: Props) {
  const [chosen, setConcern] = useState<string | null>(null);
  const [sensitive, setSensitive] = useState<"no" | "yes">("no");
  const still = useReducedMotion();
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const concern = chosen ?? concerns[0]?.id ?? "";
  const routine = routineFor(concern, sensitive === "yes", products);
  const serums = routineSerums(routine).filter((slug) => bySlug.has(slug));
  const asSet = setFor(serums, sets);
  const total = asSet ? priceOf(asSet) : serums.reduce((sum, slug) => sum + priceOf(bySlug.get(slug)!), 0);
  const names = serums.map((slug) => bySlug.get(slug)!.title).join(" and ");
  const leadOf = (id: string) => products.find((p) => p.concerns.some((c) => concernId(c) === id));

  const add = () => {
    if (asSet) return addToBag(asSet.slug);
    serums.forEach((slug) => addToBag(slug));
  };

  return (
    <section id="routine" aria-labelledby="routine-title" className="paper scroll-mt-14">
      <div className="px-(--gutter) py-20 lg:py-32">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-4">
            <p className="label text-muted-foreground">Your routine · two questions</p>
            <h2 id="routine-title" className="heading mt-4 max-w-[14ch]">
              Start from your skin.
            </h2>

            <p className="label mt-10 text-muted-foreground lg:mt-14">
              01 · What bothers you most
            </p>
            <Choices
              label="What bothers you most"
              variant="rows"
              value={concern}
              onChange={setConcern}
              options={concerns.map((c) => ({ value: c.id, label: c.label, aside: leadOf(c.id)?.job }))}
              className="mt-3"
            />

            <p className="label mt-8 text-muted-foreground">02 · Does your skin sting easily</p>
            <Choices
              label="Does your skin sting easily"
              value={sensitive}
              onChange={setSensitive}
              options={[
                { value: "no", label: "Rarely" },
                { value: "yes", label: "Yes, often" },
              ]}
              className="mt-3"
            />

            {Object.values(photos).some(Boolean) && (
              <div className="relative mt-12 hidden aspect-3/2 overflow-hidden bg-[#0c0d0e] lg:block">
                {concerns.map(({ id }) => {
                  const lead = leadOf(id);
                  if (!lead) return null;
                  const on = id === concern;
                  const src = photos[lead.slug];
                  const cls = cn("transition-opacity duration-700", on ? "opacity-100" : "opacity-0");
                  return src ? (
                    <Image key={id} src={src} alt={on ? `${lead.title} on fingertips` : ""} fill sizes="(min-width: 1760px) 520px, 30vw" className={cn("object-cover", cls)} />
                  ) : (
                    <Bottle key={id} product={lead} shot="drop" sizes="(min-width: 1760px) 520px, 30vw" alt={on ? undefined : ""} className={cn("object-[50%_52%]", cls)} />
                  );
                })}
              </div>
            )}
          </div>

          <div className="lg:col-span-8 lg:col-start-5 xl:col-span-7 xl:col-start-6">
            <motion.div
              key={`${concern}-${sensitive}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: still ? 0 : 0.45 }}
              aria-live="polite"
            >
              <p className="lead max-w-[46ch] text-foreground/85">{routine.note}</p>
              <div className="mt-10 grid gap-12 sm:grid-cols-2 sm:gap-8 xl:gap-12">
                <Column title="Morning" time="07:00" steps={routine.am} products={bySlug} />
                <Column title="Night" time="22:00" steps={routine.pm} products={bySlug} />
              </div>
            </motion.div>

            <div className="mt-12 flex flex-col gap-6 border-t border-foreground pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p>
                <span className="block text-[1.0625rem]">{asSet ? `As ${asSet.title.replace(/^The /, "the ")}` : names}</span>
                <span className="label mt-1 block text-muted-foreground">
                  {asSet ? `${priceShort(asSet.separately)} bought separately · ` : ""}
                  The rest is whatever you already use
                </span>
              </p>
              <Button type="button" onClick={add} className="h-12 rounded-(--radius) px-6 text-[0.95rem] font-normal">
                {serums.length === 1 ? `Add ${names}` : "Add the routine"} — {priceShort(total)}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

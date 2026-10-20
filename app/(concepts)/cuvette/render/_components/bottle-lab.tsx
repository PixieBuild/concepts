"use client";

import { useRef, useState } from "react";
import { useInView, useScroll } from "motion/react";

import { cn } from "@/lib/utils";
import { price } from "../../_lib/format";
import type { BottleLook } from "../../_lib/product-look";
import { Bottle } from "../../_components/bottle/bottle";
import { BottleSequence } from "../../_components/bottle/bottle-sequence";

/** One look per serum in the catalogue, the first of them with no baked stills, and what each costs. */
export type LabProps = { looks: BottleLook[]; subject: BottleLook; prices: Record<string, number> };
const GALLERY = [
  { shot: "pack", caption: "On the plinth" },
  { shot: "three-quarter", caption: "Three-quarter" },
  { shot: "label", caption: "Label" },
  { shot: "drop", caption: "One drop" },
] as const;

function Hero({ looks, look, onLook }: { looks: BottleLook[]; look: BottleLook; onLook: (look: BottleLook) => void }) {
  const track = useRef<HTMLElement>(null);
  const running = useInView(track, { margin: "0px 0px 300px 0px" });
  const { scrollYProgress } = useScroll({ target: track, offset: ["start start", "end end"] });
  return (
    <section ref={track} id="lab-hero" className="relative h-[300svh]">
      <div className="sticky top-0 h-svh overflow-hidden bg-[#0c0d0e]">
        <BottleSequence look={look} progress={scrollYProgress} running={running} poster={null} canvasClassName="object-[57%_50%]" />
        <div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-2 p-4 sm:p-10">
          {looks.map((l) => (
            <button
              key={l.id}
              type="button"
              data-look={l.id}
              aria-pressed={l.id === look.id}
              onClick={() => onLook(l)}
              className={cn("label flex min-h-11 items-center gap-2 border border-border px-4", l.id === look.id ? "bg-foreground text-background" : "bg-background/70")}
            >
              <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: l.accent }} />
              {l.label.name} {l.label.strength}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Dev-only proof that a product is data alone: a Shopify product with no render appears everywhere a product does. */
export function BottleLab({ looks, subject, prices }: LabProps) {
  const [look, setLook] = useState<BottleLook>(subject);
  const bag = [subject, ...looks.filter((l) => l.id !== subject.id).slice(0, 1)].map((l) => ({ look: l, cents: prices[l.id] ?? 0 }));
  return (
    <main className="flex-1">
      <header className="px-4 pt-10 pb-6 sm:px-10">
        <p className="label text-muted-foreground">Bottle lab · dev only</p>
        <h1 className="heading mt-3">
          {subject.label.name} {subject.label.strength} <span className="text-muted-foreground">exists only as data.</span>
        </h1>
      </header>

      <Hero looks={looks} look={look} onLook={setLook} />

      <section id="lab-pdp" className="px-4 py-16 sm:px-10">
        <p className="label mb-4 text-muted-foreground">Product page gallery</p>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {GALLERY.map((g) => (
            <figure key={g.shot} className="relative aspect-4/5 overflow-hidden bg-card">
              <Bottle look={subject} shot={g.shot} sizes="25vw" />
              <figcaption className="label absolute bottom-3 left-3 text-foreground/90">{g.caption}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section id="lab-bag" className="px-4 pb-24 sm:px-10">
        <div className="paper max-w-md p-6">
          <p className="title">Bag</p>
          <ul className="mt-2 divide-y divide-(--paper-line)">
            {bag.map(({ look: l, cents }) => (
              <li key={l.id} className="grid grid-cols-[4rem_1fr_auto] gap-x-4 py-5">
                <div className="relative size-16 overflow-hidden bg-[#0e0f10]">
                  <Bottle look={l} shot="thumb" sizes="64px" alt="" />
                </div>
                <div className="min-w-0">
                  <p className="text-[0.95rem]">
                    {l.label.name} {l.label.strength}
                  </p>
                  <p className="label mt-1.5 text-muted-foreground">
                    {l.label.sizeMl} ml · One-time · Lot {l.label.lot}
                  </p>
                </div>
                <p className="text-[0.95rem]">{price(cents)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}

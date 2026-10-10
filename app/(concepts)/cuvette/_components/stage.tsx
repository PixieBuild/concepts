"use client";

import { useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useInView, useScroll } from "motion/react";

import { cn } from "@/lib/utils";
import { PRODUCTS, RESULTS, STEPS, STUDY } from "../_lib/content";
import { SceneClient } from "./scene.client";

const OUT = [0.22, 1, 0.36, 1] as const;

function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, transform: "translateY(24px)" }}
      whileInView={{ opacity: 1, transform: "translateY(0px)" }}
      viewport={{ amount: 0.35 }}
      transition={{ duration: 1, delay, ease: OUT }}
    >
      {children}
    </motion.div>
  );
}

// Each chapter occupies one screen of the pinned track; the camera moves with it.
function Chapter({ index, children, className }: { index: number; children: ReactNode; className?: string }) {
  return (
    <div
      className={cn("absolute inset-x-0 flex h-svh flex-col justify-end px-6 pb-10 sm:px-10 lg:justify-center lg:pb-0", className)}
      style={{ top: `${index * 100}svh` }}
    >
      {children}
    </div>
  );
}

export function Stage() {
  const track = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const running = useInView(track, { margin: "0px 0px 300px 0px" });
  const { scrollYProgress } = useScroll({ target: track, offset: ["start start", "end end"] });
  const product = PRODUCTS[active];

  return (
    <section ref={track} className="relative h-[400svh]">
      <div className="sticky top-0 h-svh overflow-hidden">
        <SceneClient active={active} progress={scrollYProgress} running={running} />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-linear-to-t from-background via-background/75 to-transparent lg:hidden" />
      </div>

      <Chapter index={0} className="lg:justify-end lg:pb-14">
        <div className="lg:grid lg:grid-cols-12 lg:items-end lg:gap-10">
          <div className="lg:col-span-6">
            <Reveal>
              <p className="eyebrow text-muted-foreground">Three serums, one active each</p>
            </Reveal>
            <h1 className="mt-5 font-heading text-[clamp(2.7rem,6.6vw,7.2rem)] leading-[0.92]">
              <Reveal delay={0.08}>
                <span className="block">One active,</span>
              </Reveal>
              <Reveal delay={0.16}>
                <span className="block">at the strength</span>
              </Reveal>
              <Reveal delay={0.24}>
                <span className="block italic">that works.</span>
              </Reveal>
            </h1>
            <Reveal delay={0.32}>
              <p className="mt-6 max-w-[42ch] text-[1.02rem] leading-relaxed text-foreground/80">
                Clinical serums built around a single ingredient at a stated percentage. Fragrance-free, in recyclable glass.
              </p>
            </Reveal>
            <Reveal delay={0.4} className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
              <a href="#range" className="rounded-full bg-foreground px-6 py-3.5 text-[0.95rem] text-background">
                Shop {product.name} · {product.price}
              </a>
              <a href="#" className="border-b border-foreground pb-0.5 text-[0.95rem]">
                Find your routine
              </a>
            </Reveal>
          </div>

          <Reveal delay={0.5} className="mt-10 hidden lg:col-span-4 lg:col-start-9 lg:mt-0 lg:block">
            <p className="eyebrow text-muted-foreground">Choose a serum</p>
            <div role="tablist" aria-label="Serums" className="mt-3 divide-y divide-border border-y border-border">
              {PRODUCTS.map((p, i) => (
                <button
                  key={p.slug}
                  type="button"
                  role="tab"
                  aria-selected={i === active}
                  onClick={() => setActive(i)}
                  className="flex w-full items-center gap-3 py-3 text-left"
                >
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: p.liquid }} />
                  <span className={cn("flex-1 text-[0.98rem] transition-colors duration-500", i === active ? "text-foreground" : "text-muted-foreground")}>
                    {p.name} <span className="font-mono text-[0.78rem]">{p.percent}</span>
                  </span>
                  <span className="text-[0.9rem] text-muted-foreground tabular-nums">{p.price}</span>
                  <span className={cn("h-px w-6 transition-colors duration-500", i === active ? "bg-foreground" : "bg-transparent")} />
                </button>
              ))}
            </div>
            <p className="mt-3 text-[0.85rem] text-muted-foreground">Rated 4.8 by 2,140 customers</p>
          </Reveal>
        </div>
      </Chapter>

      <Chapter index={1}>
        <div className="lg:w-[42%]">
          <Reveal>
            <p className="eyebrow text-muted-foreground">Inside the bottle</p>
          </Reveal>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={product.slug} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
              <Reveal delay={0.08}>
                <p className="mt-3 font-heading text-[clamp(5.5rem,12vw,12.5rem)] leading-[0.82]">{product.percent}</p>
                <p className="mt-2 font-heading text-[clamp(1.8rem,2.8vw,2.9rem)] leading-none italic">{product.inci}</p>
              </Reveal>
              <Reveal delay={0.16}>
                <p className="mt-5 max-w-[40ch] text-[1rem] leading-relaxed text-foreground/80">{product.line}. Nothing added for scent, colour or feel.</p>
                <dl className="mt-7 hidden border-b border-border sm:block">
                  {product.facts.map((fact) => (
                    <div key={fact.name} className="flex justify-between gap-6 border-t border-border py-3 text-[0.95rem]">
                      <dt>{fact.name}</dt>
                      <dd className="font-mono tabular-nums">{fact.amount}</dd>
                    </div>
                  ))}
                </dl>
                <p className="eyebrow mt-4 text-muted-foreground">{product.ph} · Airtight glass · Use within 3 months of opening</p>
              </Reveal>
            </motion.div>
          </AnimatePresence>
        </div>
      </Chapter>

      <Chapter index={2}>
        <div className="lg:w-[40%]">
          <Reveal>
            <p className="eyebrow text-muted-foreground">How to use</p>
            <h2 className="mt-4 font-heading text-[clamp(2.8rem,5vw,5.4rem)] leading-[0.94]">
              Three drops, <em>every morning.</em>
            </h2>
          </Reveal>
          <ol className="mt-8 border-b border-border">
            {STEPS.map((step, i) => (
              <Reveal key={step.title} delay={0.1 + i * 0.08}>
                <li className="grid grid-cols-[2.5rem_1fr] gap-4 border-t border-border py-4">
                  <span className="font-mono text-[0.8rem] text-muted-foreground tabular-nums">0{i + 1}</span>
                  <div>
                    <p className="text-[1.02rem] font-medium">{step.title}</p>
                    <p className="mt-1 hidden text-[0.93rem] leading-snug text-muted-foreground sm:block">{step.body}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </Chapter>

      <Chapter index={3}>
        <div className="lg:w-[46%]">
          <Reveal>
            <p className="eyebrow text-muted-foreground">Four weeks, twice a day</p>
            <h2 className="mt-4 font-heading text-[clamp(2.8rem,5vw,5.4rem)] leading-[0.94]">
              What <em>changed.</em>
            </h2>
          </Reveal>
          <div className="mt-8 grid grid-cols-3 gap-5 border-t border-border pt-6">
            {RESULTS.map((result, i) => (
              <Reveal key={result.label} delay={0.1 + i * 0.08}>
                <p className="font-heading text-[clamp(2.8rem,5vw,5.2rem)] leading-none">{result.value}</p>
                <p className="mt-2 text-[0.9rem] leading-snug text-muted-foreground">{result.label}</p>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.35}>
            <p className="mt-6 max-w-[52ch] text-[0.8rem] leading-snug text-muted-foreground">{STUDY}</p>
          </Reveal>
        </div>
      </Chapter>
    </section>
  );
}

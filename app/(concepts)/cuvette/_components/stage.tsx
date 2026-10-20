"use client";

import { useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { Radio } from "@base-ui/react/radio";
import { motion, useInView, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";

import { buttonVariants } from "@/components/ui/button";
import { RadioGroup } from "@/components/ui/radio-group";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { formatCount, priceShort } from "../_lib/format";
import { between } from "../_lib/math";
import { isSet, priceOf, rating, type Product as FullProduct, type ProductCard } from "../_lib/product";
import { AddToBag } from "./add-to-bag";
import { useCatalog } from "./catalog-provider";
import { CHAPTERS, ChapterRail } from "./chapter-rail";
import { BottleSequence } from "./bottle/bottle-sequence";
import { HeroPoster } from "./hero-poster";

/** A hero product as the page sends it: the card plus the how-to and study the stage's chapters quote. */
export type HeroProduct = ProductCard & Pick<FullProduct, "howTo" | "study">;
type Product = HeroProduct;

const LAST = CHAPTERS.length - 1;
const OUT = [0.22, 1, 0.36, 1] as const;
const GUTTER = "px-4 sm:px-10 2xl:px-16";
// Compact anchors the frame's top edge, which drops the bottle clear of the overlay header.
const CROP = "object-[57%_50%] max-lg:object-top";
const WEEKS: Record<number, string> = { 2: "two", 4: "four", 8: "eight" };
const COUNT = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];

// Wide copy sits beside the bottle, so a beat of empty stage between chapters reads as a pause. Compact copy has
// its own panel under the bottle, where a gap reads as a blank band, so there the next one is already arriving.
const WINDOWS = {
  wide: { enter: [-0.16, -0.1], exit: [0.1, 0.16] },
  compact: { enter: [-0.18, -0.14], exit: [0.13, 0.16] },
} as const;

/** 1 while chapter `i` holds the stage, easing to 0 either side of it. */
function presence(v: number, i: number, compact: boolean) {
  const centre = i / LAST;
  const { enter: e, exit: x } = WINDOWS[compact ? "compact" : "wide"];
  const enter = i === 0 ? 1 : between(v, centre + e[0], centre + e[1]);
  const exit = i === LAST ? 0 : between(v, centre + x[0], centre + x[1]);
  return { enter, exit, shown: Math.min(enter, 1 - exit) };
}

const COMPACT = "(max-width: 1023px)";

function useCompact() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(COMPACT);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(COMPACT).matches,
    () => false,
  );
}

function ChapterLayer({ index, current, progress, className, children }: { index: number; current: number; progress: MotionValue<number>; className?: string; children: ReactNode }) {
  const compact = useCompact();
  const opacity = useTransform(progress, (v) => presence(v, index, compact).shown);
  const transform = useTransform(progress, (v) => {
    const { enter, exit } = presence(v, index, compact);
    return `translate3d(0, ${(1 - enter) * 18 - exit * 18}px, 0)`;
  });
  return (
    <motion.div
      inert={index !== current}
      style={{ opacity, transform }}
      className={cn("absolute inset-0 will-change-[opacity,transform] motion-reduce:transform-none!", index !== current && "pointer-events-none", className)}
    >
      {children}
    </motion.div>
  );
}

// Fades in on load with a transform string, never Motion's y, so text never jerks mid-entrance. The initial state
// never depends on reduced motion, which the server cannot know, so hydration matches.
function Entrance({ as = "div", delay = 0, className, children }: { as?: "div" | "span"; delay?: number; className?: string; children: ReactNode }) {
  const still = useReducedMotion();
  const Tag = as === "span" ? motion.span : motion.div;
  return (
    <Tag
      className={cn("will-change-[opacity,transform]", as === "span" && "block", className)}
      initial={{ opacity: 0, transform: "translate3d(0, 20px, 0)" }}
      animate={{ opacity: 1, transform: "translate3d(0, 0px, 0)" }}
      transition={still ? { duration: 0 } : { duration: 1.1, delay, ease: OUT }}
    >
      {children}
    </Tag>
  );
}

/** Copy that follows the serum on the plinth fades across when it changes. */
function Follows({ product, children, className }: { product: Product; children: ReactNode; className?: string }) {
  const still = useReducedMotion();
  return (
    <motion.div key={product.slug} className={className} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: still ? 0 : 0.45 }}>
      {children}
    </motion.div>
  );
}

type Chooser = { products: Product[]; active: number; onChange: (index: number) => void };

function Dot({ product, className }: { product: Product; className?: string }) {
  return <span aria-hidden className={cn("size-2 shrink-0 rounded-full", className)} style={{ backgroundColor: product.colour.band }} />;
}

function SerumRadios({ products, active, onChange, variant, className }: Chooser & { variant: "rows" | "segments" | "inline"; className?: string }) {
  return (
    <RadioGroup
      aria-label="Serum on the plinth"
      value={products[active].slug}
      onValueChange={(value) => onChange(products.findIndex((p) => p.slug === value))}
      style={variant === "segments" ? { gridTemplateColumns: `repeat(${products.length}, minmax(0, 1fr))` } : undefined}
      className={cn(
        variant === "rows" && "gap-0 border-t border-border",
        variant === "segments" && "gap-0",
        variant === "inline" && "flex w-auto flex-wrap gap-x-6 gap-y-0",
        className,
      )}
    >
      {products.map((p, i) => {
        const on = i === active;
        if (variant === "rows") {
          return (
            <Radio.Root
              key={p.slug}
              value={p.slug}
              className="group grid min-h-12 cursor-pointer grid-cols-[1.25rem_1fr_auto_3rem] items-center gap-3 border-b border-border text-left outline-offset-0"
            >
              <Dot product={p} />
              <span className={cn("product-name font-normal transition-colors duration-500", on ? "text-foreground" : "text-foreground/65 group-hover:text-foreground")}>{p.title}</span>
              <span className={cn("label transition-colors duration-500", on ? "text-foreground" : "text-foreground/55")}>{p.job}</span>
              <span className={cn("text-right transition-colors duration-500", on ? "text-foreground" : "text-foreground/65")}>{priceShort(priceOf(p))}</span>
            </Radio.Root>
          );
        }
        if (variant === "segments") {
          return (
            <Radio.Root
              key={p.slug}
              value={p.slug}
              className={cn(
                "flex h-11 min-w-0 cursor-pointer items-center justify-center gap-2 border-r border-border px-1 text-[0.9rem] transition-colors duration-300 -outline-offset-2 last:border-r-0",
                products.length > 3 && "gap-1.5 text-[0.8125rem]",
                on ? "bg-secondary text-foreground" : "text-muted-foreground",
              )}
            >
              <Dot product={p} className={cn(products.length > 3 && "max-[420px]:hidden")} />
              <span className="truncate">{p.name}</span>
            </Radio.Root>
          );
        }
        return (
          <Radio.Root
            key={p.slug}
            value={p.slug}
            className={cn("label flex min-h-11 cursor-pointer items-center gap-2 transition-colors duration-300", on ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            <Dot product={p} className={cn("transition-opacity", on ? "opacity-100" : "opacity-50")} />
            {p.name}
          </Radio.Root>
        );
      })}
    </RadioGroup>
  );
}

function StudySheet({ product }: { product: Product }) {
  const { study } = product;
  if (!study) return null;
  const facts = [
    ["Participants", `${study.n}, aged ${study.ages}`],
    ["Skin", study.skin],
    ["Use", study.use],
    ["Length", `${study.weeks} weeks`],
    ["Measure", study.measure],
    ["Year", String(study.year)],
  ];
  return (
    <Sheet>
      <SheetTrigger className="link inline-flex min-h-11 items-center">Study details</SheetTrigger>
      <SheetContent side="right" showCloseButton={false} className="w-full gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md">
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <SheetTitle className="font-normal">
              <span className="title">{product.title}: the study</span>
            </SheetTitle>
            <SheetDescription className="mt-1.5 text-[0.95rem] text-muted-foreground">Self-assessed; not a clinical trial.</SheetDescription>
          </div>
          <SheetClose className="label -mr-2 inline-flex min-h-11 shrink-0 items-center px-2">Close</SheetClose>
        </div>
        <div data-lenis-prevent className="flex-1 overflow-y-auto px-6 py-6">
          <ul className="grid grid-cols-3 gap-4">
            {study.results.map((r) => (
              <li key={r.label}>
                <p className="figure">{r.value}%</p>
                <p className="mt-2 text-[0.9rem] leading-snug text-muted-foreground">{r.label}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-8 border-b border-border">
            {facts.map(([term, value]) => (
              <div key={term} className="grid grid-cols-[8rem_1fr] gap-4 border-t border-border py-3">
                <dt className="label pt-0.5 text-muted-foreground">{term}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 leading-relaxed text-muted-foreground">{study.note}</p>
          <Link href={`/cuvette/${product.slug}#results`} className="link mt-4 inline-flex min-h-11 items-center">
            More on {product.title}
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Opening({ product, chooser }: { product: Product; chooser: Chooser }) {
  const stars = rating(product);
  // Counts the whole store, like the range below, not the few serums the plinth holds.
  const serums = useCatalog().listed.filter((p) => !isSet(p)).length;
  return (
    <div className="lg:grid lg:grid-cols-12 lg:items-end lg:gap-10">
      <div className="lg:col-span-7 xl:col-span-6">
        <Entrance>
          <p className="eyebrow text-muted-foreground max-lg:[@media(max-height:800px)]:hidden">{COUNT[serums] ?? serums} {serums === 1 ? "serum" : "serums"}, one lead active each</p>
        </Entrance>
        <h1 className="display mt-3 lg:mt-5">
          <Entrance as="span" delay={0.08}>
            One active,
          </Entrance>
          <Entrance as="span" delay={0.16}>
            at the strength
          </Entrance>
          <Entrance as="span" delay={0.24} className="text-muted-foreground">
            that works.
          </Entrance>
        </h1>
        <Entrance delay={0.32}>
          <p className="lead mt-3 text-foreground/85 lg:mt-6">Fragrance-free. Filled in Porto.</p>
        </Entrance>
        <Entrance delay={0.4} className="mt-4 flex items-center gap-3 lg:mt-8 lg:gap-6">
          {/* A link styled as a button: Base UI's render prop would give it role="button". */}
          <Link href={`/cuvette/${product.slug}`} className={cn(
              buttonVariants(),
              "h-12 flex-1 rounded-(--radius) px-5 text-[0.95rem] font-normal focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-solid focus-visible:outline-ring sm:flex-none lg:px-6",
            )}>
            Shop {product.title} — {priceShort(priceOf(product))}
          </Link>
          <AddToBag
            slug={product.slug}
            variant="outline"
            className="rounded-(--radius) border-input bg-transparent hover:bg-foreground/5 max-sm:px-4"
            label={
              <>
                <span className="sm:hidden">Add</span>
                <span className="hidden sm:inline">Add to bag</span>
              </>
            }
          />
        </Entrance>
      </div>

      <Entrance delay={0.5} className="hidden lg:col-span-4 lg:col-start-9 lg:block xl:col-span-3 xl:col-start-10 2xl:w-[24rem] 2xl:justify-self-end">
        <p className="eyebrow mb-3 text-muted-foreground">On the plinth</p>
        <SerumRadios variant="rows" {...chooser} />
        {stars.count > 0 && (
          <Link href={`/cuvette/${product.slug}#reviews`} className="mt-2 inline-flex min-h-11 items-center text-[0.9rem] text-foreground/75 transition-colors hover:text-foreground">
            {product.name} · {stars.display} out of 5 · {formatCount(stars.count)} reviews
          </Link>
        )}
      </Entrance>
    </div>
  );
}

function Formula({ product, chooser }: { product: Product; chooser: Chooser }) {
  return (
    <div className="lg:w-[40%] xl:w-[36%]">
      <SerumRadios variant="inline" {...chooser} className="mb-4 hidden lg:flex" />
      <Follows product={product}>
        <p className="eyebrow text-muted-foreground">Inside the bottle</p>
        <h2 className="mt-2 lg:mt-4">
          <span className="figure-hero block max-lg:text-[5.5rem]" style={{ color: `var(${product.colour.cssVar})` }}>
            {product.strength}
          </span>
          <span className="title mt-2 block lg:mt-4">{product.lead}</span>
        </h2>
        <p className="mt-2 max-w-[38ch] text-foreground/85 lg:mt-5 lg:text-[1.05rem]">{product.benefit}</p>
        <p className="label mt-3 text-muted-foreground lg:mt-6">
          {[product.ph && `pH ${product.ph}`, product.pao && `PAO ${product.pao}`, `${product.sizes[0]?.ml ?? 30} ml`, product.texture].filter(Boolean).join(" · ")}
        </p>
      </Follows>
    </div>
  );
}

function Dose({ product, chooser }: { product: Product; chooser: Chooser }) {
  return (
    <div className="lg:w-[40%] xl:w-[34%]">
      <SerumRadios variant="inline" {...chooser} className="mb-4 hidden lg:flex" />
      <Follows product={product}>
        <p className="eyebrow text-muted-foreground">How to use · {product.when.join(" and ")}</p>
        <h2 className="heading mt-2 max-lg:text-[1.75rem] lg:mt-4">{product.howTo.headline}</h2>
        <ol className="mt-3 border-b border-border lg:mt-8">
          {product.howTo.steps.map((step, i) => (
            <li key={step} className="grid grid-cols-[2.25rem_1fr] gap-3 border-t border-border py-2 lg:py-4">
              <span className="label pt-1 text-muted-foreground">0{i + 1}</span>
              <span className="lg:text-[1.05rem]">{step}</span>
            </li>
          ))}
        </ol>
      </Follows>
    </div>
  );
}

function Results({ product, chooser }: { product: Product; chooser: Chooser }) {
  const { study } = product;
  if (!study) return <SerumRadios variant="inline" {...chooser} className="mb-4 hidden lg:flex" />;
  return (
    <div className="lg:w-[46%] xl:w-[40%]">
      <SerumRadios variant="inline" {...chooser} className="mb-4 hidden lg:flex" />
      <Follows product={product} className="grid grid-cols-[1fr_auto] gap-x-4 lg:block">
        <p className="eyebrow col-span-2 text-muted-foreground">
          Independent consumer study · n={study.n} · {study.use.toLowerCase()} · {study.weeks} weeks · {study.year} · self-assessed
        </p>
        <h2 className="heading mt-2 max-lg:text-[1.75rem] lg:mt-4">What changed in {WEEKS[study.weeks] ?? study.weeks} weeks.</h2>
        <ul className="col-span-2 mt-4 grid grid-cols-3 gap-4 border-t border-border pt-4 lg:mt-8 lg:gap-6 lg:pt-6">
          {study.results.map((r) => (
            <li key={r.label}>
              <p className="figure max-lg:text-[2.5rem]">{r.value}%</p>
              <p className="mt-1.5 text-[0.85rem] leading-snug text-muted-foreground lg:mt-2 lg:text-[0.95rem]">{r.label}</p>
            </li>
          ))}
        </ul>
        {/* Beside the heading on phones, where the stage has no height to spare below the figures. */}
        <div className="col-start-2 row-start-2 self-end lg:mt-5">
          <StudySheet product={product} />
        </div>
      </Follows>
    </div>
  );
}

/** `products` is heroProducts() from the catalogue: tagged `hero` in Shopify, at most four, each with a bottle. */
export function Stage({ products }: { products: Product[] }) {
  const track = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [current, setCurrent] = useState(0);
  const running = useInView(track, { margin: "0px 0px 300px 0px" });
  const { scrollYProgress } = useScroll({ target: track, offset: ["start start", "end end"] });
  const product = products[Math.min(active, products.length - 1)];
  const chooser: Chooser = { products, active, onChange: setActive };

  useMotionValueEvent(scrollYProgress, "change", (v) => setCurrent(Math.min(LAST, Math.max(0, Math.round(v * LAST)))));

  const layers = [
    { body: <Opening product={product} chooser={chooser} />, place: "lg:items-end lg:pb-10" },
    { body: <Formula product={product} chooser={chooser} />, place: "lg:items-center" },
    { body: <Dose product={product} chooser={chooser} />, place: "lg:items-center" },
    { body: <Results product={product} chooser={chooser} />, place: "lg:items-center" },
  ];

  return (
    <section id="stage" ref={track} aria-label="Serums with one lead active each" className="relative h-[400svh]">
      {CHAPTERS.map((chapter, i) => (
        <span key={chapter.id} id={chapter.id} aria-hidden className="absolute inset-x-0 h-px" style={{ top: `${i * 100}svh` }} />
      ))}

      <div className="sticky top-0 flex h-svh flex-col overflow-hidden">
        <div data-scene className="relative h-[54svh] shrink-0 bg-[#0c0d0e] [@media(max-height:700px)]:h-[50svh] md:h-[60svh] lg:absolute lg:inset-0 lg:h-auto lg:[@media(max-height:700px)]:h-auto">
          <BottleSequence
            look={product.looks[0]}
            progress={scrollYProgress}
            running={running}
            poster={<HeroPoster product={product} priority={active === 0} className={CROP} />}
            canvasClassName={CROP}
          />
          {/* The raised dropper runs off the top of the phone's frame: it falls into shadow under the header rather
              than meeting the wordmark. */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b from-[#0c0d0e] via-[#0c0d0e]/70 to-transparent lg:hidden" />
        </div>

        <div className="relative z-10 shrink-0 border-y border-border bg-background lg:hidden">
          <SerumRadios variant="segments" {...chooser} />
        </div>

        <div className="relative min-h-0 flex-1 lg:absolute lg:inset-x-0 lg:top-22 lg:bottom-14">
          {layers.map((layer, i) => (
            <ChapterLayer key={CHAPTERS[i].id} index={i} current={current} progress={scrollYProgress} className={cn("flex items-start", layer.place)}>
              <div className={cn("w-full pt-4 lg:pt-0", GUTTER)}>{layer.body}</div>
            </ChapterLayer>
          ))}
        </div>

        <div className="relative z-10 mt-auto shrink-0 bg-background">
          <div className={GUTTER}>
            <ChapterRail progress={scrollYProgress} current={current} />
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { Fragment, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeftIcon, ArrowRightIcon, MinusIcon, PlusIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Review, Shot } from "../../_lib/product";
import { Bottle, type BottleProduct } from "../bottle/bottle";

export type ReelQuote = {
  key: string;
  review: Review;
  product: BottleProduct;
  shot: Shot;
  /** The single bottle the narrow md–lg column shows instead, where the plate would crop labels mid-word. */
  narrow: { product: BottleProduct; shot: Shot } | null;
  /** The owner's skin photograph for this serum, once there is one; until then its drop stands in. */
  photo: string | null;
  rating: { display: string; count: string };
};

const SWIPE = 40;
const pad = (n: number) => String(n).padStart(2, "0");

// The outgoing quote leaves quickly and the next waits for it, so two quotes never share the frame.
const SHOWN = "opacity-100 [transform:translate3d(0,0,0)] duration-700 delay-200 ease-out";
const HIDDEN = "pointer-events-none opacity-0 [transform:translate3d(0,0.75rem,0)] duration-200 ease-in";

function Slide({ quote, index, total, active }: { quote: ReelQuote; index: number; total: number; active: boolean }) {
  const { review, product } = quote;
  const [replyOpen, setReplyOpen] = useState(false);
  return (
    <figure
      id={`voice-${quote.key}`}
      role="tabpanel"
      aria-roledescription="slide"
      aria-label={`${index + 1} of ${total}`}
      aria-hidden={!active}
      inert={!active}
      className={cn(
        "col-start-1 row-start-1 flex flex-col self-start transition-[opacity,transform] will-change-[opacity,transform] motion-reduce:transform-none! motion-reduce:transition-none md:self-end",
        active ? SHOWN : HIDDEN,
      )}
    >
      <p className="label flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
        <span className="inline-flex items-center gap-2" style={{ color: `var(${product.colour.cssVar})` }}>
          <span aria-hidden className="size-1.5 rounded-full" style={{ backgroundColor: product.colour.band }} />
          {product.title}
        </span>
        <span>Rated {review.rating} of 5</span>
      </p>
      <blockquote className="mt-6 lg:mt-8">
        <p className="max-w-[21em] -indent-[0.2em] text-[clamp(1.5rem,0.9rem+1.9vw,4rem)] leading-[1.12] font-light tracking-[-0.03em] text-pretty [font-stretch:118%] sm:-indent-[0.42em]">
          &ldquo;{review.body}&rdquo;
        </p>
      </blockquote>
      <figcaption className="mt-8 flex flex-wrap items-baseline gap-x-5 gap-y-1.5">
        <span className="text-foreground">
          {review.name}, {review.city}
        </span>
        <span className="label text-muted-foreground">
          {review.skin} skin · {review.age} · {review.usedFor}
        </span>
      </figcaption>
      {review.reply && (
        <div className="mt-6 max-w-[36rem] border-l border-foreground/30 pl-4 text-[0.875rem] leading-relaxed text-muted-foreground xl:mt-8 2xl:text-base">
          {/* Below xl the reply waits behind one line, so one long slide never sets a tall gap for the rest. */}
          <button
            type="button"
            aria-expanded={replyOpen}
            onClick={() => setReplyOpen(!replyOpen)}
            className="label flex min-h-11 items-center gap-2 text-foreground xl:hidden"
          >
            {review.reply.by} replied
            {replyOpen ? <MinusIcon aria-hidden className="size-3" /> : <PlusIcon aria-hidden className="size-3" />}
          </button>
          <div className={cn(replyOpen ? "block" : "hidden xl:block")}>
            <p className="label text-foreground max-xl:hidden">
              Reply · {review.reply.by}, {review.reply.role}
            </p>
            <p className="xl:mt-2">{review.reply.body}</p>
          </div>
        </div>
      )}
    </figure>
  );
}

// The column is tall and narrow, so a 4:5 plate fills by height (never under ~860px) and needs 0.8 of it in width.
const PLATE_SIZES = "(min-width: 768px) max(42vw, 82vh, 44rem), 100vw";

const POSITION: Partial<Record<Shot, string>> = { drop: "object-[50%_72%] md:object-[50%_42%]" };

function Plate({ quotes, current }: { quotes: ReelQuote[]; current: ReelQuote }) {
  return (
    <div className="relative aspect-4/3 overflow-hidden bg-[#0c0d0e] sm:aspect-16/9 md:col-start-8 md:col-end-13 md:row-span-3 md:row-start-1 md:aspect-auto">
      {quotes.map((q) => {
        const on = q.key === current.key;
        const cls = cn("transition-opacity duration-1000 ease-out motion-reduce:transition-none", on ? "opacity-100" : "opacity-0");
        const alt = on ? undefined : "";
        if (q.photo) return <Image key={q.key} src={q.photo} alt="" fill sizes={PLATE_SIZES} className={cn("object-cover", cls)} />;
        if (!q.narrow) return <Bottle key={q.key} product={q.product} shot={q.shot} sizes={PLATE_SIZES} alt={alt} className={cn(POSITION[q.shot], cls)} />;
        return (
          <Fragment key={q.key}>
            <Bottle product={q.product} shot={q.shot} sizes={PLATE_SIZES} alt={alt} className={cn(POSITION[q.shot], "md:max-xl:hidden", cls)} />
            <Bottle product={q.narrow.product} shot={q.narrow.shot} sizes={PLATE_SIZES} alt={alt} className={cn("hidden md:max-xl:block", cls)} />
          </Fragment>
        );
      })}
    </div>
  );
}

export function ReviewsReel({ quotes, average, count }: { quotes: ReelQuote[]; average: string; count: string }) {
  const [index, setIndex] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const current = quotes[index];
  const total = quotes.length;

  const go = (next: number, focus = false) => {
    const i = (next + total) % total;
    setIndex(i);
    if (focus) tabs.current[i]?.focus();
  };

  const onTabKey = (event: KeyboardEvent) => {
    const to = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: total - 1 }[event.key];
    if (to === undefined) return;
    event.preventDefault();
    go(to, true);
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") swipe.current = { x: event.clientX, y: event.clientY };
  };
  const onPointerUp = (event: PointerEvent) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(event.clientY - start.y)) go(index + (dx < 0 ? 1 : -1));
  };

  return (
    <section
      id="voices"
      aria-labelledby="voices-title"
      aria-roledescription="carousel"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (swipe.current = null)}
      className="scroll-mt-14 border-t border-border [touch-action:pan-y_pinch-zoom] md:grid md:min-h-[min(80svh,52rem)] md:grid-cols-12 md:grid-rows-[auto_1fr_auto] xl:min-h-[min(calc(100svh-3.5rem),64rem)] 2xl:[&_.label]:text-[0.8125rem] 2xl:[&_.label]:tracking-[0.1em]"
    >
      <header className="px-(--gutter) pt-20 pb-10 md:col-span-7 md:pt-24 md:pb-0 lg:pt-28">
        <h2 id="voices-title" className="label text-muted-foreground">
          Reviews, written after weeks of use
        </h2>
        <p className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="title 2xl:text-[3rem]">{average}</span>
          <span className="label text-muted-foreground">out of 5 · {count} reviews</span>
        </p>
      </header>

      <Plate quotes={quotes} current={current} />

      <div className="grid content-start px-(--gutter) pt-8 md:col-span-7 md:content-end md:row-start-2 md:pt-16 lg:pt-20 lg:pr-16 2xl:pr-24">
        {quotes.map((q, i) => (
          <Slide key={q.key} quote={q} index={i} total={total} active={i === index} />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-6 px-(--gutter) pt-8 pb-20 md:pt-12 md:col-span-7 md:row-start-3 md:pb-24 lg:pb-28">
        <div className="flex items-center gap-4">
          <div role="tablist" aria-label="Reviews" onKeyDown={onTabKey} className="-ml-3 flex">
            {quotes.map((q, i) => (
              <button
                key={q.key}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-controls={`voice-${q.key}`}
                aria-label={`Review ${pad(i + 1)}: ${q.review.name} on ${q.product.title}`}
                tabIndex={i === index ? 0 : -1}
                onClick={() => go(i)}
                className="group relative grid h-11 w-11 place-items-center -outline-offset-2"
              >
                <span
                  className={cn(
                    "label transition-colors duration-300",
                    i === index ? "text-foreground" : "text-muted-foreground group-hover:text-foreground",
                  )}
                >
                  {pad(i + 1)}
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-x-3 bottom-2 h-px origin-left bg-foreground transition-transform duration-500 motion-reduce:transition-none",
                    i === index ? "scale-x-100" : "scale-x-0",
                  )}
                />
              </button>
            ))}
          </div>
          <div className="hidden gap-2 sm:flex">
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous review"
              className="grid size-11 place-items-center rounded-full border border-input transition-colors hover:bg-foreground hover:text-background"
            >
              <ArrowLeftIcon aria-hidden className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next review"
              className="grid size-11 place-items-center rounded-full border border-input transition-colors hover:bg-foreground hover:text-background"
            >
              <ArrowRightIcon aria-hidden className="size-4" />
            </button>
          </div>
        </div>
        <Link href={`/cuvette/${current.product.slug}#reviews`} className="link inline-flex min-h-11 items-center gap-1.5 text-[0.9375rem]">
          All {current.rating.count} reviews of {current.product.title}
          <ArrowRightIcon aria-hidden className="size-3.5" />
        </Link>
      </div>
    </section>
  );
}

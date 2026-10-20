"use client";

import { useId, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { Product } from "../../_lib/product";

type Strip = NonNullable<Product["storage"]>["strip"];

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

function colourAt(strip: Strip, day: number): string {
  const next = strip.findIndex((s) => s.day >= day);
  if (next <= 0) return strip[0].colour;
  const a = strip[next - 1];
  const b = strip[next];
  const t = (day - a.day) / (b.day - a.day);
  const [r, g, bl] = rgb(a.colour).map((v, i) => Math.round(v + (rgb(b.colour)[i] - v) * t));
  return `rgb(${r} ${g} ${bl})`;
}

function stageAt(strip: Strip, day: number) {
  return [...strip].reverse().find((s) => s.day <= day) ?? strip[0];
}

/** How much of the beam gets through: the darker the serum, the more it absorbs. */
function transmitted(day: number, last: number) {
  return 0.95 - ((day - 1) / (last - 1)) * 0.6;
}

/** A spectrophotometer's view: white light in, through a cuvette of the serum, the day's colour out. */
function Cell({ colour, day, last, title }: { colour: string; day: number; last: number; title: string }) {
  const out = transmitted(day, last);
  const fade = { transition: "fill 300ms, opacity 300ms, stop-color 300ms" };
  return (
    <svg viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 size-full" role="img" aria-label={`A cuvette of ${title} serum on day ${day}, the light through it ${colour}`}>
      <defs>
        <linearGradient id="cc-shade" x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.38" />
          <stop offset="0.3" stopColor="#000" stopOpacity="0" />
          <stop offset="0.48" stopColor="#fff" stopOpacity="0.14" />
          <stop offset="0.62" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.42" />
        </linearGradient>
        <linearGradient id="cc-depth" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.16" />
          <stop offset="0.12" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="cc-in" x1="0" x2="1">
          <stop offset="0" stopColor="#f4f4f0" stopOpacity="0" />
          <stop offset="1" stopColor="#f4f4f0" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="cc-out" x1="0" x2="1">
          <stop offset="0" stopColor={colour} stopOpacity={out} style={fade} />
          <stop offset="1" stopColor={colour} stopOpacity="0" style={fade} />
        </linearGradient>
        <filter id="cc-glow" x="-20%" y="-300%" width="140%" height="700%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
        <filter id="cc-soft" x="-60%" y="-400%" width="220%" height="900%">
          <feGaussianBlur stdDeviation="40" />
        </filter>
      </defs>

      <ellipse cx="400" cy="800" rx="230" ry="34" fill={colour} opacity={0.3 * out + 0.1} filter="url(#cc-soft)" style={fade} />
      <line x1="90" x2="710" y1="790" y2="790" stroke="#ebebe8" strokeOpacity="0.16" />

      <rect x="0" y="514" width="330" height="22" fill="url(#cc-in)" filter="url(#cc-glow)" opacity="0.55" />
      <rect x="0" y="523" width="330" height="4" fill="url(#cc-in)" />
      <rect x="470" y="508" width="330" height="34" fill="url(#cc-out)" filter="url(#cc-glow)" />
      <rect x="470" y="522" width="330" height="6" fill="url(#cc-out)" />

      <rect x="330" y="230" width="140" height="560" rx="3" fill="#ebebe8" fillOpacity="0.05" stroke="#ebebe8" strokeOpacity="0.34" strokeWidth="1.5" />
      <rect x="341" y="360" width="118" height="419" fill={colour} style={fade} />
      <rect x="341" y="360" width="118" height="419" fill="url(#cc-shade)" />
      <rect x="341" y="360" width="118" height="419" fill="url(#cc-depth)" />
      <rect x="341" y="514" width="118" height="22" fill="#fff" opacity={0.12 + 0.18 * out} filter="url(#cc-glow)" style={fade} />
      <ellipse cx="400" cy="360" rx="59" ry="4" fill="#fff" opacity="0.4" />
      <rect x="347" y="244" width="6" height="530" fill="#fff" opacity="0.16" />
      <rect x="330" y="230" width="11" height="560" fill="#ebebe8" opacity="0.07" />
      <rect x="459" y="230" width="11" height="560" fill="#ebebe8" opacity="0.07" />

      <g fill="#9a9ea2" fontFamily="var(--font-mono)" fontSize="19" letterSpacing="1.6">
        <text x="90" y="500">LIGHT IN</text>
        <text x="710" y="500" textAnchor="end">
          LIGHT OUT
        </text>
        <text x="400" y="826" textAnchor="middle">
          PATH 10 MM
        </text>
      </g>
    </svg>
  );
}

export type ClockProduct = Pick<Product, "title" | "lot" | "colour"> & { storage: NonNullable<Product["storage"]> };

/** A serum whose editorial has a storage colour strip; `more` is the link to the full storage note. */
export function ColourClock({ product, more }: { product: ClockProduct; more?: ReactNode }) {
  const strip = product.storage.strip;
  const last = strip[strip.length - 1].day;
  const id = useId();
  const [day, setDay] = useState(1);
  const colour = colourAt(strip, day);
  const stage = stageAt(strip, day);

  return (
    <section id="colour" aria-labelledby="colour-title" className="scroll-mt-28 px-(--gutter)">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-6">
        <div className="relative aspect-4/5 bg-[#0c0d0e] bg-[radial-gradient(70%_70%_at_30%_22%,rgb(235_235_232/0.09),transparent)] sm:aspect-16/11 lg:col-span-7 lg:aspect-auto lg:min-h-[min(48rem,86svh)]">
          <Cell colour={colour} day={day} last={last} title={product.title} />
          <p className="label absolute top-5 left-5 text-muted-foreground">
            {product.title}
            {product.lot.code && ` · lot ${product.lot.code}`}
          </p>
        </div>

        <div className="lg:col-span-5 lg:flex lg:items-center lg:pl-6 xl:pl-12">
          <div className="w-full max-w-[36rem]">
            <p className="label text-muted-foreground">After opening</p>
            <h2 id="colour-title" className="heading mt-4">
              Watch the colour, <span className="text-muted-foreground">not the calendar.</span>
            </h2>
            <p className="mt-5 max-w-[40ch] text-foreground/80 lg:text-[1.05rem]">{product.storage.headline}</p>

            <div className="mt-10 flex items-end justify-between gap-6 border-t border-border pt-6" aria-live="polite">
              <p className="figure-xl">Day {day}</p>
              <p className="flex items-center gap-2 pb-2">
                <span aria-hidden className="size-3 rounded-full ring-1 ring-border" style={{ backgroundColor: colour }} />
                <span className="label">{stage.label}</span>
              </p>
            </div>

            <label htmlFor={`${id}-day`} className="sr-only">
              Days since opening
            </label>
            <input
              id={`${id}-day`}
              type="range"
              min={1}
              max={last}
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
              aria-valuetext={`Day ${day}: ${stage.label}`}
              style={{ accentColor: product.colour.band }}
              className="mt-6 h-11 w-full cursor-pointer"
            />
            <ol className="mt-2 grid" style={{ gridTemplateColumns: `repeat(${strip.length}, minmax(0, 1fr))` }}>
              {strip.map((s) => (
                <li key={s.day}>
                  <button
                    type="button"
                    onClick={() => setDay(s.day)}
                    aria-label={`Day ${s.day}: ${s.label}`}
                    className={cn("flex min-h-11 w-full cursor-pointer flex-col items-start gap-2 text-left transition-colors", stage.day === s.day ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
                  >
                    <span aria-hidden className="h-1.5 w-full" style={{ backgroundColor: s.colour }} />
                    <span className="label">{s.day}</span>
                    <span className="label hidden pr-3 leading-tight sm:block">{s.label}</span>
                  </button>
                </li>
              ))}
            </ol>
            {more}
          </div>
        </div>
      </div>
    </section>
  );
}

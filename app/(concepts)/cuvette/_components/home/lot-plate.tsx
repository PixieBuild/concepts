"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { motion, useTransform, type MotionValue } from "motion/react";

import type { ProductCard } from "../../_lib/product";
import { formatDate } from "../../_lib/format";
import { ENAMEL } from "../../_lib/product-look";
import { clamp01, smoothstep, usePassage } from "./passage";

const MONO = "font-mono uppercase";
const GRAIN = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.9 0"/></filter><rect width="180" height="180" filter="url(#g)"/></svg>')}")`;
const WIDE = "font-sans font-medium uppercase [font-stretch:125%]";

function shortDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y.slice(2)}`;
}

/** One printed line as a sharp and a defocused copy; `focus` crossfades them, so nothing re-rasterises on scroll. */
function Line({ focus, top, className, style, children }: { focus: MotionValue<number>; top: string; className: string; style?: CSSProperties; children: ReactNode }) {
  const soft = useTransform(() => 1 - focus.get());
  const base = `absolute inset-x-0 text-center whitespace-nowrap will-change-[opacity] ${className}`;
  return (
    <>
      <motion.span aria-hidden className={`${base} blur-[0.32cqw]`} style={{ ...style, top, opacity: soft }}>
        {children}
      </motion.span>
      <motion.span aria-hidden className={base} style={{ ...style, top, opacity: focus }}>
        {children}
      </motion.span>
    </>
  );
}

/**
 * The lower label of a bottle, macro, set from the product's own data so any product gets one. As the plate scrolls
 * through, focus racks from the size line down to the lot line and a glint crosses the glass.
 */
export function LotPlate({ product }: { product: ProductCard }) {
  const plate = useRef<HTMLDivElement>(null);
  const { progress, calm } = usePassage(plate);
  const onLot = useTransform(() => (calm.get() ? 1 : smoothstep(0.32, 0.56, progress.get())));
  const onSize = useTransform(() => 1 - onLot.get());
  const glint = useTransform(() => `translate3d(${calm.get() ? 0 : (clamp01(progress.get()) * 150 - 75).toFixed(2)}%, 0, 0)`);

  const look = product.looks[0];
  if (!look) return null;
  const label = look.label;
  const strength = Math.round(14 + Math.min(1.2, product.colour.density) * 22);
  const liquid = product.colour.liquid;
  const ink = { color: ENAMEL };

  return (
    <div
      ref={plate}
      role="img"
      aria-label={`Close-up of the ${product.title} label: lot ${label.lot}, filled ${formatDate(label.filled)} in Porto, printed on the glass`}
      className="@container absolute inset-0 overflow-hidden"
      style={{
        background: [
          "linear-gradient(90deg, rgb(0 0 0 / 0.66), transparent 20%, transparent 78%, rgb(0 0 0 / 0.7))",
          "linear-gradient(180deg, rgb(0 0 0 / 0.3), transparent 22%, transparent 70%, rgb(0 0 0 / 0.5))",
          `linear-gradient(180deg, color-mix(in srgb, ${liquid} ${strength}%, #0d0e0f), color-mix(in srgb, ${liquid} ${Math.round(strength * 0.7)}%, #08090a))`,
        ].join(", "),
      }}
    >
      <span aria-hidden className="absolute inset-y-0 left-[6%] w-[5%] bg-white/30 blur-[1.8cqw]" />
      <span aria-hidden className="absolute inset-y-0 left-[47.5%] w-[3%] opacity-50 blur-[0.6cqw]" style={{ backgroundColor: `color-mix(in srgb, ${liquid} 55%, white)` }} />
      <span aria-hidden className="absolute inset-y-0 left-[82%] w-[8%] bg-white/15 blur-[2.4cqw]" />

      <div aria-hidden className="absolute inset-x-0 top-[4%] text-center blur-[0.7cqw]" style={ink}>
        <p className={`${WIDE} text-[4.2cqw] tracking-[0.12em]`}>
          {label.strength} {label.active}
        </p>
        <span className="mx-auto mt-[3cqw] block h-[0.5cqw] w-[56%]" style={{ backgroundColor: look.accent }} />
      </div>

      <Line focus={onSize} top="30%" className={`${WIDE} text-[3.5cqw] tracking-[0.14em]`} style={ink}>
        Serum · {label.sizeMl} ml · {Math.round(label.sizeMl / 29.5735)} fl oz
      </Line>
      <Line focus={onSize} top="41%" className={`${MONO} text-[3.6cqw]`} style={ink}>
        pH {label.ph} · fragrance-free · PAO {label.pao}
      </Line>
      <Line focus={onLot} top="62%" className={`${MONO} text-[4.6cqw] tracking-[0.02em]`} style={ink}>
        Lot {label.lot} · filled {shortDate(label.filled)}
      </Line>
      <Line focus={onLot} top="72%" className={`${MONO} text-[3.6cqw] tracking-[0.04em]`} style={{ color: `color-mix(in srgb, ${ENAMEL} 78%, transparent)` }}>
        Porto, Portugal
      </Line>

      <span aria-hidden className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: GRAIN }} />
      <motion.span
        aria-hidden
        style={{ transform: glint }}
        className="absolute inset-0 bg-[linear-gradient(104deg,transparent_38%,rgb(255_255_255/0.07)_46%,rgb(255_255_255/0.2)_50%,rgb(255_255_255/0.07)_54%,transparent_62%)] will-change-transform"
      />
    </div>
  );
}

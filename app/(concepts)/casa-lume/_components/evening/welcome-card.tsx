"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { useMotionValueEvent, type MotionValue } from "motion/react";

import { cn } from "@/lib/utils";
import { ACT, band } from "./timeline";
import { IMAGE_BASE } from "@/app/(concepts)/casa-lume/_lib/content";

type Ink = (typeof import("@/app/(concepts)/casa-lume/_lib/welcome-ink"))["WELCOME_INK"];

export const WELCOME_NOTE = "Benvenuti, we left the shutters open so you can hear the sea. Giulia";

/** A letterpress welcome card on which Giulia's note writes itself as `progress` moves through the ink act. */
export function WelcomeCard({ progress, className }: { progress: MotionValue<number>; className?: string }) {
  const [ink, setInk] = useState<Ink | null>(null);
  const strokes = useRef<(SVGPathElement | null)[]>([]);
  const written = useRef(-1);
  const maskId = `ink-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  useEffect(() => {
    let live = true;
    import("@/app/(concepts)/casa-lume/_lib/welcome-ink").then((m) => {
      if (!live) return;
      written.current = -1;
      setInk(m.WELCOME_INK);
    });
    return () => {
      live = false;
    };
  }, []);

  const write = useCallback(
    (p: number) => {
      if (!ink) return;
      const t = band(p, ACT.ink);
      if (t === written.current) return;
      written.current = t;
      ink.strokes.forEach((s, i) => {
        const el = strokes.current[i];
        if (!el) return;
        const f = Math.min(1, Math.max(0, (t - s.a) / (s.b - s.a)));
        el.style.strokeDashoffset = String(s.l * (1 - f));
      });
    },
    [ink],
  );

  useEffect(() => write(progress.get()), [progress, write]);
  useMotionValueEvent(progress, "change", write);

  return (
    <div
      role="img"
      aria-label={`A handwritten welcome card: “${WELCOME_NOTE}”`}
      className={cn(
        "@container relative aspect-[500/340] overflow-hidden bg-[oklch(0.962_0.016_84)] shadow-[0_2px_5px_rgb(0_0_0/0.28),0_34px_60px_-26px_rgb(0_0_0/0.7)]",
        className,
      )}
    >
      <div aria-hidden className="paper-grain absolute inset-0 opacity-[0.16] mix-blend-multiply" />
      <div aria-hidden className="absolute inset-[3.2%] border border-[oklch(0.6_0.1_43/0.28)]" />
      <div aria-hidden className="absolute inset-x-0 top-[9%] flex flex-col items-center gap-[1.6cqw] text-primary">
        <span className="relative size-[6.4cqw]">
          <Image src={`${IMAGE_BASE}/mark.png`} alt="" fill sizes="40px" className="object-contain opacity-80" />
        </span>
        <span className="font-heading text-[2.5cqw] leading-none tracking-[0.42em]">CASA LUME</span>
      </div>
      {ink && (
        <svg aria-hidden viewBox={ink.viewBox} className="absolute inset-0 size-full">
          <defs>
            <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="500" height="340">
              {ink.strokes.map((s, i) => (
                <path
                  key={i}
                  ref={(el) => {
                    strokes.current[i] = el;
                  }}
                  d={s.d}
                  fill="none"
                  stroke="#fff"
                  strokeWidth="5.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={`${s.l} ${s.l + 1}`}
                  strokeDashoffset={s.l}
                />
              ))}
            </mask>
          </defs>
          <g fill="oklch(0.3 0.05 265)" fillOpacity="0.92" mask={`url(#${maskId})`}>
            {ink.ink.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
        </svg>
      )}
    </div>
  );
}

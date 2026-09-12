"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";
import { CHALK_LINES } from "../_lib/content";

type Box = { x: number; y: number; w: number; h: number };

const CHALK_CURSOR =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Cpath d='M6 22l12-12 2 2-12 12z' fill='%23efe9dc' stroke='%23182019' stroke-width='1'/%3E%3Cpath d='M18 10l2 2' stroke='%23182019' stroke-width='1'/%3E%3C/svg%3E\") 6 22, crosshair";

// The chalkboard in the photograph: the shop's roast note writes itself on,
// then anyone can pick up the chalk and add to it.
export function Chalkboard({
  box,
  size,
  writeAt,
  className,
}: {
  box: Box;
  size: string;
  writeAt: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;

    const fit = () => {
      const r = el.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const snapshot = el.width ? ctx.getImageData(0, 0, el.width, el.height) : null;
      el.width = Math.round(r.width * dpr);
      el.height = Math.round(r.height * dpr);
      if (snapshot) ctx.putImageData(snapshot, 0, 0);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);

    let last: { x: number; y: number } | null = null;
    const point = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const s = el.width / r.width;
      return { x: (e.clientX - r.left) * s, y: (e.clientY - r.top) * s };
    };
    const stroke = (a: { x: number; y: number }, b: { x: number; y: number }) => {
      const s = el.width / el.getBoundingClientRect().width;
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      const steps = Math.max(1, Math.round(dist / (1.5 * s)));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = a.x + (b.x - a.x) * t;
        const y = a.y + (b.y - a.y) * t;
        // Chalk: a soft core plus scattered grain, never a clean vector line.
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = "#efe9dc";
        ctx.beginPath();
        ctx.arc(x, y, 1.3 * s, 0, Math.PI * 2);
        ctx.fill();
        for (let g = 0; g < 4; g++) {
          ctx.globalAlpha = 0.18 + Math.random() * 0.25;
          ctx.beginPath();
          ctx.arc(x + (Math.random() - 0.5) * 5 * s, y + (Math.random() - 0.5) * 5 * s, (0.5 + Math.random()) * s, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };
    const down = (e: PointerEvent) => {
      el.setPointerCapture(e.pointerId);
      last = point(e);
      stroke(last, last);
      setDrawn(true);
    };
    const move = (e: PointerEvent) => {
      if (!last) return;
      const p = point(e);
      stroke(last, p);
      last = p;
    };
    const up = () => {
      last = null;
    };
    const wipe = () => {
      ctx.clearRect(0, 0, el.width, el.height);
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("dblclick", wipe);
    return () => {
      ro.disconnect();
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("dblclick", wipe);
    };
  }, []);

  return (
    <div
      className={cn("chalk absolute", className)}
      style={{
        left: `${box.x * 100}%`,
        top: `${box.y * 100}%`,
        width: `${box.w * 100}%`,
        height: `${box.h * 100}%`,
        fontSize: size,
      }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 flex flex-col justify-center">
        {CHALK_LINES.map((line, index) => (
          <motion.span
            key={line}
            className={cn(
              "block",
              index === 0 && "text-[1.5em]",
              index === 2 && "mt-[0.4em] text-[0.9em] uppercase tracking-[0.12em]",
            )}
            initial={{ clipPath: reduced ? "inset(-10% -4% -20% 0%)" : "inset(-10% 100% -20% 0%)" }}
            animate={{ clipPath: "inset(-10% -4% -20% 0%)" }}
            transition={{ duration: reduced ? 0 : 0.9 + index * 0.2, delay: writeAt + index * 0.9, ease: "linear" }}
          >
            {line}
          </motion.span>
        ))}
      </div>

      <canvas
        ref={canvas}
        aria-label="A chalkboard you can write on. Double-click to wipe it."
        className="absolute inset-[-12%] size-[124%] touch-none"
        style={{ cursor: CHALK_CURSOR }}
      />

      <motion.span
        aria-hidden
        className="pointer-events-none absolute right-0 -bottom-[1.1em] text-[0.62em] tracking-[0.1em] whitespace-nowrap uppercase opacity-70"
        initial={{ opacity: 0 }}
        animate={{ opacity: drawn ? 0 : 0.7 }}
        transition={{ duration: 0.8, delay: drawn ? 0 : writeAt + 3.2 }}
      >
        pick up the chalk ↗
      </motion.span>
    </div>
  );
}

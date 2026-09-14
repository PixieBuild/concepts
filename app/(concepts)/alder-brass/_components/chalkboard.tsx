"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";
import { usePageRevealed } from "./opening";
import { CHALK_LINES } from "../_lib/content";

type Box = { x: number; y: number; w: number; h: number };
type Point = { x: number; y: number; t: number; pressure: number };

const CHALK = "#efe9dc";
const TAU = Math.PI * 2;
const CHALK_CURSOR =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Cpath d='M6 22l12-12 2 2-12 12z' fill='%23efe9dc' stroke='%23182019' stroke-width='1'/%3E%3Cpath d='M18 10l2 2' stroke='%23182019' stroke-width='1'/%3E%3C/svg%3E\") 6 22, crosshair";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const jitter = (spread: number) => (Math.random() - 0.5) * spread;
// Slate has tooth: chalk only catches on the high spots, so a fast stroke breaks up.
const tooth = (x: number, y: number) =>
  (Math.sin(x * 0.9 + Math.sin(y * 0.6) * 2) * Math.sin(y * 1.1 + x * 0.3) + 1) / 2;

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
  const revealed = usePageRevealed();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;

    const scale = () => el.width / el.getBoundingClientRect().width;

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

    const point = (e: PointerEvent): Point => {
      const r = el.getBoundingClientRect();
      const s = el.width / r.width;
      return {
        x: (e.clientX - r.left) * s,
        y: (e.clientY - r.top) * s,
        t: e.timeStamp,
        pressure: e.pointerType === "pen" ? 0.5 + e.pressure : 1,
      };
    };

    // weight is 1 with the hand at rest and 0 in a flick: slow chalk piles up, fast chalk barely lands.
    const dab = (x: number, y: number, s: number, weight: number, pressure: number) => {
      const radius = (0.6 + weight * 1.2) * pressure * s;
      const alpha = 0.14 + weight * 0.32;
      ctx.fillStyle = CHALK;
      ctx.globalAlpha = alpha * 0.3;
      ctx.beginPath();
      ctx.arc(x, y, radius * 1.9, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(x + jitter(0.8 * s), y + jitter(0.8 * s), radius, 0, TAU);
      ctx.fill();
      const grains = 2 + Math.round(weight * 3);
      for (let g = 0; g < grains; g++) {
        ctx.globalAlpha = 0.06 + Math.random() * (0.1 + weight * 0.2);
        ctx.beginPath();
        ctx.arc(x + jitter(6 * s), y + jitter(6 * s), (0.3 + Math.random() * 0.8) * s, 0, TAU);
        ctx.fill();
      }
    };

    let last: Point | null = null;
    let lastDown: Point | null = null;
    let speed = 0;
    let wiping = 0;

    const stroke = (a: Point, b: Point) => {
      const s = scale();
      const dist = Math.hypot(b.x - a.x, b.y - a.y) / s;
      speed += (dist / Math.max(1, b.t - a.t) - speed) * 0.3;
      const weight = 1 - clamp01(speed / 1.6);
      const skip = clamp01((speed - 0.45) / 1.3) * 0.75;
      const steps = Math.max(1, Math.round(dist / 1.1));
      for (let i = 0; i <= steps; i++) {
        const k = i / steps;
        const x = a.x + (b.x - a.x) * k;
        const y = a.y + (b.y - a.y) * k;
        if (tooth(x / s, y / s) < skip) continue;
        dab(x, y, s, weight, b.pressure);
      }
      ctx.globalAlpha = 1;
    };

    const wipe = () => {
      const { width: w, height: h } = el;
      if (wiping || !w || !h) return;
      last = null;
      const s = scale();
      const snap = document.createElement("canvas");
      snap.width = w;
      snap.height = h;
      snap.getContext("2d")?.drawImage(el, 0, 0);
      const dir = Math.random() < 0.5 ? -1 : 1;

      const smear = (t: number) => {
        const e = 1 - (1 - t) ** 3;
        const drag = e * 70 * s;
        ctx.clearRect(0, 0, w, h);
        ctx.filter = `blur(${e * 1.6 * s}px)`;
        ctx.globalAlpha = 1 - e * 0.93;
        ctx.drawImage(snap, dir * e * 8 * s, e * 3 * s);
        for (let i = 1; i < 12; i++) {
          const k = i / 11;
          ctx.globalAlpha = e * 0.055 * (1 - k);
          ctx.drawImage(snap, dir * k * drag, k * drag * 0.25);
        }
        ctx.filter = "none";
        ctx.globalAlpha = 1;
      };

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        smear(1);
        return;
      }
      const start = performance.now();
      const frame = (now: number) => {
        const t = Math.min(1, (now - start) / 650);
        smear(t);
        wiping = t < 1 ? requestAnimationFrame(frame) : 0;
      };
      wiping = requestAnimationFrame(frame);
    };

    const down = (e: PointerEvent) => {
      if (wiping) return;
      el.setPointerCapture(e.pointerId);
      const p = point(e);
      const twice =
        !!lastDown && p.t - lastDown.t < 320 && Math.hypot(p.x - lastDown.x, p.y - lastDown.y) < 24 * scale();
      lastDown = p;
      if (twice) {
        wipe();
        return;
      }
      speed = 0;
      last = p;
      stroke(p, p);
      setDrawn(true);
    };
    const move = (e: PointerEvent) => {
      if (!last) return;
      const events = e.getCoalescedEvents?.() ?? [];
      for (const ev of events.length ? events : [e]) {
        const p = point(ev);
        stroke(last, p);
        last = p;
      }
    };
    const up = () => {
      last = null;
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(wiping);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
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
            initial={false}
            animate={{ clipPath: revealed || reduced ? "inset(-10% -4% -20% 0%)" : "inset(-10% 100% -20% 0%)" }}
            transition={{ duration: reduced ? 0 : 0.9 + index * 0.2, delay: revealed ? writeAt + index * 0.9 : 0, ease: "linear" }}
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
        animate={{ opacity: drawn || !revealed ? 0 : 0.7 }}
        transition={{ duration: 0.8, delay: drawn ? 0 : writeAt + 3.2 }}
      >
        pick up the chalk ↗
      </motion.span>
    </div>
  );
}

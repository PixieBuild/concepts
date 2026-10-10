"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { animate, motion, useAnimationFrame, useReducedMotion } from "motion/react";

import { ADDRESS, BRAND, HOURS, LINE, STEMS, TODAY } from "../_lib/content";

const EASE = [0.76, 0, 0.24, 1] as const;
const OUT = [0.22, 1, 0.36, 1] as const;
const IDLE_MS = 1400;

type Trail = { x: number; y: number; next: number; z: number; movedAt: number };

function drop(stage: HTMLElement, cards: (HTMLDivElement | null)[], trail: Trail, x: number, y: number) {
  const gap = Math.max(72, stage.clientWidth * 0.065);
  if (Math.hypot(x - trail.x, y - trail.y) < gap) return;
  trail.x = x;
  trail.y = y;
  const card = cards[trail.next % cards.length];
  trail.next += 1;
  if (!card) return;
  card.style.zIndex = String(trail.z++);
  const tilt = (Math.random() * 2 - 1) * 8;
  const at = (scale: number) => `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${tilt}deg) scale(${scale})`;
  animate(
    card,
    { transform: [at(0.4), at(1), at(1), at(0.1)], opacity: [0, 1, 1, 0] },
    { duration: 1.7, times: [0, 0.2, 0.62, 1], ease: ["easeOut", "linear", "easeIn"] },
  );
}

export function Hero() {
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);
  const stage = useRef<HTMLElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const trail = useRef<Trail>({ x: -9999, y: -9999, next: 0, z: 1, movedAt: -Infinity });

  const shown = ready ? 1 : 0;
  const fade = (delay: number, duration = 1) => ({ duration: reduced ? 0 : duration, delay: ready && !reduced ? delay : 0, ease: OUT });

  useEffect(() => {
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = stage.current;
    if (!el || !ready || reduced) return;
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = el.getBoundingClientRect();
      trail.current.movedAt = performance.now();
      drop(el, cards.current, trail.current, e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener("pointermove", move);
    return () => el.removeEventListener("pointermove", move);
  }, [ready, reduced]);

  // Left alone, the trail walks a slow figure of eight so the page is never still.
  useAnimationFrame((time) => {
    const el = stage.current;
    if (!el || !ready || reduced || performance.now() - trail.current.movedAt < IDLE_MS) return;
    const s = time / 1000;
    const x = el.clientWidth * (0.5 + 0.34 * Math.sin(s * 0.8));
    const y = el.clientHeight * (0.5 + 0.2 * Math.sin(s * 1.3 + 0.6));
    drop(el, cards.current, trail.current, x, y);
  });

  return (
    <section ref={stage} className="relative isolate h-svh min-h-[40rem] overflow-hidden bg-background text-foreground">
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: shown }}
        transition={fade(1)}
        className="relative z-30 grid grid-cols-2 gap-6 px-6 pt-6 text-[0.95rem] sm:px-10 sm:pt-8 lg:grid-cols-12"
      >
        <p className="font-medium lg:col-span-3">Blumenwerkstatt</p>
        <p className="hidden text-muted-foreground lg:col-span-5 lg:block">
          {ADDRESS} · {HOURS}
        </p>
        <nav aria-label="Sections" className="flex justify-end gap-6 lg:col-span-4">
          <a href="#" className="hidden sm:inline">Weddings</a>
          <a href="#" className="hidden sm:inline">Workshops</a>
          <a href="#" className="underline decoration-(--poppy) decoration-2 underline-offset-4">Order flowers</a>
        </nav>
      </motion.header>

      <div className="relative z-30 grid gap-8 px-6 pt-[8vh] sm:px-10 lg:grid-cols-12 lg:gap-6">
        <motion.p
          initial={{ opacity: 0, transform: "translateY(16px)" }}
          animate={{ opacity: shown, transform: shown ? "translateY(0px)" : "translateY(16px)" }}
          transition={fade(0.75)}
          className="max-w-[24ch] font-heading text-[clamp(1.45rem,2.2vw,2.25rem)] leading-[1.1] font-medium tracking-[-0.02em] lg:col-span-5"
        >
          {LINE}
        </motion.p>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: shown }} transition={fade(0.95)} className="hidden sm:block lg:col-span-3 lg:col-start-10">
          <p className="mb-2 flex items-center gap-2 text-[0.8rem] font-medium tracking-[0.08em] uppercase">
            <span className="size-2 rounded-full bg-(--poppy)" />
            In the shop today
          </p>
          <ul>
            {TODAY.map(([name, price]) => (
              <li key={name} className="flex justify-between gap-4 border-t border-border py-1.5 text-[0.95rem]">
                <span>{name}</span>
                <span className="tabular-nums">€ {price}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      <div aria-hidden className="pointer-events-none absolute inset-0 z-20">
        {STEMS.map((stem, i) => (
          <div
            key={stem.name}
            ref={(node) => {
              cards.current[i] = node;
            }}
            className="absolute top-0 left-0 aspect-[3/4] w-[clamp(8.5rem,14vw,14.5rem)] overflow-hidden opacity-0 shadow-[0_24px_48px_-24px_rgba(31,38,24,0.5)]"
            style={{ backgroundColor: stem.tone }}
          >
            {stem.photo ? (
              <Image src={stem.photo} alt="" fill sizes="15vw" className="object-cover" />
            ) : (
              <span className="absolute inset-x-3 bottom-3 text-[0.7rem] font-medium tracking-[0.1em] text-black/55 uppercase">{stem.name}</span>
            )}
          </div>
        ))}
      </div>

      <h1
        aria-label="Stängel"
        className="pointer-events-none absolute inset-x-0 -bottom-[0.1em] z-10 flex justify-center font-heading text-[clamp(7rem,26vw,27rem)] leading-[0.8] font-extrabold tracking-[-0.065em] select-none"
      >
        {BRAND.split("").map((ch, i) => (
          <span key={i} aria-hidden className="inline-block overflow-hidden pt-[0.14em]">
            <motion.span
              className="inline-block will-change-transform"
              initial={{ transform: "translateY(105%)" }}
              animate={{ transform: shown ? "translateY(0%)" : "translateY(105%)" }}
              transition={{ duration: reduced ? 0 : 1.2, delay: ready && !reduced ? 0.1 + i * 0.055 : 0, ease: EASE }}
            >
              {ch}
            </motion.span>
          </span>
        ))}
      </h1>
    </section>
  );
}

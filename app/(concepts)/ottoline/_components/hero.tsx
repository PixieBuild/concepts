"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";

import { BRAND, CITY, EST, FLANKS, TAGLINE } from "../_lib/content";

const EASE = [0.76, 0, 0.24, 1] as const;
const LETTERS = BRAND.toUpperCase().split("");

export function Hero() {
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);
  const stage = useRef<HTMLElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, { stiffness: 40, damping: 18 });
  const sy = useSpring(py, { stiffness: 40, damping: 18 });
  const bloom = useTransform([sx, sy], ([x, y]: number[]) =>
    `radial-gradient(60% 55% at ${(x * 100).toFixed(1)}% ${(y * 100).toFixed(1)}%, rgba(195,154,114,0.22), rgba(195,154,114,0) 70%)`,
  );

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
    if (!el || reduced) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      px.set((e.clientX - r.left) / r.width);
      py.set((e.clientY - r.top) / r.height);
    };
    el.addEventListener("pointermove", move);
    return () => el.removeEventListener("pointermove", move);
  }, [px, py, reduced]);

  const t = (delay: number, duration = 1.1) => ({ duration: reduced ? 0 : duration, delay: ready && !reduced ? delay : 0, ease: EASE });
  const shown = ready ? 1 : 0;

  return (
    <section ref={stage} className="relative isolate flex h-svh min-h-[40rem] items-center justify-center overflow-hidden bg-background text-foreground">
      <motion.div aria-hidden style={{ backgroundImage: bloom }} className="absolute inset-0" />
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(90%_80%_at_50%_50%,rgba(0,0,0,0),rgba(28,9,20,0.75))]" />

      {/* The name again, at monument scale, drifting behind everything. */}
      <motion.p
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: shown ? 1 : 0 }}
        transition={{ duration: 2.4, delay: 0.4 }}
        className="script pointer-events-none absolute top-1/2 left-1/2 -translate-y-[62%] whitespace-nowrap text-[42vw] leading-none text-(--blush)/[0.07] select-none"
        style={{ x: "-50%" }}
      >
        <motion.span
          className="block will-change-transform"
          animate={reduced ? undefined : { transform: ["translateX(-3%)", "translateX(3%)", "translateX(-3%)"] }}
          transition={{ duration: 46, repeat: Infinity, ease: "easeInOut" }}
        >
          {BRAND}
        </motion.span>
      </motion.p>

      {/* Bevelled frame. */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: shown }}
        transition={t(1.6, 1.4)}
        className="pointer-events-none absolute inset-4 border border-(--blush)/25 [clip-path:polygon(18px_0,calc(100%-18px)_0,100%_18px,100%_calc(100%-18px),calc(100%-18px)_100%,18px_100%,0_calc(100%-18px),0_18px)] sm:inset-6"
      />
      <motion.span aria-hidden initial={{ opacity: 0 }} animate={{ opacity: shown }} transition={t(1.9)} className="absolute top-8 left-1/2 -translate-x-1/2 text-(--rose) text-lg sm:top-10">❦</motion.span>

      <div className="relative grid w-full grid-cols-[1fr_auto_1fr] items-center gap-6 px-8 sm:gap-10 lg:px-16">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: shown }} transition={t(1.25)} className="label text-right text-(--blush)/80">
          {FLANKS[0]}
        </motion.p>

        <div className="flex flex-col items-center">
          <h1 className="flex font-heading text-[clamp(3.4rem,11vw,10.5rem)] leading-[0.86] font-black tracking-[0.02em] uppercase" aria-label={BRAND}>
            {LETTERS.map((ch, i) => (
              <span key={i} className="inline-block overflow-hidden pb-[0.06em]">
                <motion.span
                  aria-hidden
                  className="inline-block will-change-transform"
                  initial={{ transform: "translateY(110%)" }}
                  animate={{ transform: shown ? "translateY(0%)" : "translateY(110%)" }}
                  transition={{ duration: reduced ? 0 : 1.2, delay: ready && !reduced ? 0.15 + i * 0.07 : 0, ease: EASE }}
                >
                  {ch}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.p
            initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
            animate={{ opacity: shown, clipPath: shown ? "inset(0 -6% 0 0)" : "inset(0 100% 0 0)" }}
            transition={{ duration: reduced ? 0 : 1.4, delay: ready && !reduced ? 0.95 : 0, ease: "easeInOut" }}
            className="script -mt-[0.32em] pr-[0.25em] text-[clamp(2.2rem,6.4vw,6rem)] leading-none text-(--rose)"
          >
            Parfums
          </motion.p>
        </div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: shown }} transition={t(1.25)} className="label text-(--blush)/80">
          {FLANKS[1]}
        </motion.p>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: shown }} transition={t(2.0)} className="absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-4 sm:bottom-12">
        <span aria-hidden className="h-12 w-px bg-(--blush)/40" />
        <p className="label text-center text-(--blush)/70">
          {TAGLINE.replace("Ottoline · ", "")}
          <br />
          <span className="text-(--blush)/45">{CITY} · depuis {EST}</span>
        </p>
      </motion.div>
    </section>
  );
}

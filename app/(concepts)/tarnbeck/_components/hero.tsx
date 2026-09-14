"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import { SceneClient } from "./scene.client";
import { BRAND, LINE, REFERENCE, SPECS } from "../_lib/content";

const EASE = [0.76, 0, 0.24, 1] as const;
const LETTERS = BRAND.toUpperCase().split("");

export function Hero() {
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const shown = ready ? 1 : 0;
  const at = (delay: number, duration = 1) => ({ duration: reduced ? 0 : duration, delay: ready && !reduced ? delay : 0, ease: EASE });

  return (
    <section className="relative isolate h-svh min-h-[40rem] overflow-hidden bg-background text-foreground">
      {/* The wordmark, enormous, behind the object. */}
      <h1
        aria-label={BRAND}
        className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center font-heading text-[clamp(6rem,19.4vw,19rem)] leading-none tracking-[0.04em] uppercase text-foreground/[0.92] select-none"
      >
        {LETTERS.map((ch, i) => (
          <span key={i} className="inline-block overflow-hidden">
            <motion.span
              aria-hidden
              className="inline-block will-change-transform"
              initial={{ transform: reduced ? "translateY(0%)" : "translateY(104%)" }}
              animate={{ transform: shown || reduced ? "translateY(0%)" : "translateY(104%)" }}
              transition={{ duration: reduced ? 0 : 1.3, delay: ready && !reduced ? 0.2 + i * 0.05 : 0, ease: EASE }}
            >
              {ch}
            </motion.span>
          </span>
        ))}
      </h1>

      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: shown }}
        transition={{ duration: reduced ? 0 : 1.6, delay: ready && !reduced ? 0.6 : 0, ease: "easeOut" }}
      >
        <SceneClient />
      </motion.div>
      <div aria-hidden className="grain pointer-events-none absolute inset-0 opacity-60" />

      <header className="absolute inset-x-0 top-0 flex items-center justify-between px-6 pt-6 sm:px-10 sm:pt-8">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: shown }} transition={at(1.6)} className="font-heading text-[1.05rem] tracking-[0.3em] uppercase">
          {BRAND}
        </motion.p>
        <motion.nav initial={{ opacity: 0 }} animate={{ opacity: shown }} transition={at(1.7)} className="label hidden gap-8 text-foreground/70 sm:flex" aria-label="Sections">
          <a href="#">Watches</a>
          <a href="#">The workshop</a>
          <a href="#">Enquire</a>
        </motion.nav>
      </header>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: shown }} transition={at(1.8)} className="absolute bottom-10 left-6 max-w-[26ch] sm:bottom-12 sm:left-10">
        <p className="label text-(--brass)">{REFERENCE}</p>
        <p className="mt-3 font-heading text-[1.35rem] leading-snug text-foreground/90 sm:text-[1.6rem]">{LINE}</p>
      </motion.div>

      <motion.ul initial={{ opacity: 0 }} animate={{ opacity: shown }} transition={at(1.95)} className="label absolute right-6 bottom-10 hidden flex-col gap-2 text-right text-foreground/60 sm:right-10 sm:bottom-12 sm:flex">
        {SPECS.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </motion.ul>
    </section>
  );
}

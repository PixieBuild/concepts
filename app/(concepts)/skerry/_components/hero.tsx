"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import { SceneClient } from "./scene.client";
import { BRAND, HEADLINE, INTRO, META } from "../_lib/content";

const EASE = [0.76, 0, 0.24, 1] as const;

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
      <div className="absolute inset-0">
        <SceneClient />
      </div>

      <header className="absolute inset-x-0 top-0 flex items-center justify-between px-6 pt-6 sm:px-10 sm:pt-8">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: shown }} transition={at(1.4)} className="font-heading text-[1.1rem] font-semibold tracking-[0.22em] uppercase">
          {BRAND}
        </motion.p>
        <motion.nav initial={{ opacity: 0 }} animate={{ opacity: shown }} transition={at(1.5)} className="label hidden gap-8 text-foreground/80 sm:flex" aria-label="Sections">
          <a href="#">Work</a>
          <a href="#">Studio</a>
          <a href="#">Journal</a>
          <a href="#">Contact</a>
        </motion.nav>
      </header>

      <div className="absolute inset-x-0 bottom-0 grid gap-8 px-6 pb-10 sm:px-10 sm:pb-12 lg:grid-cols-[1.4fr_1fr] lg:items-end lg:gap-12">
        <h1 className="font-heading text-[clamp(2.6rem,6.2vw,6rem)] leading-[0.98] font-medium tracking-[-0.03em] text-balance">
          {HEADLINE.map((line, i) => (
            <span key={line} className="block overflow-hidden pb-[0.08em]">
              <motion.span
                className="block will-change-transform"
                initial={{ transform: reduced ? "translateY(0%)" : "translateY(108%)" }}
                animate={{ transform: shown || reduced ? "translateY(0%)" : "translateY(108%)" }}
                transition={{ duration: reduced ? 0 : 1.2, delay: ready && !reduced ? 0.5 + i * 0.12 : 0, ease: EASE }}
              >
                {line}
              </motion.span>
            </span>
          ))}
        </h1>
        <div className="flex flex-col gap-6 lg:items-end lg:text-right">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: shown }} transition={at(1.1)} className="max-w-[38ch] text-[1.02rem] leading-relaxed text-foreground/80">
            {INTRO}
          </motion.p>
          <motion.ul initial={{ opacity: 0 }} animate={{ opacity: shown }} transition={at(1.35)} className="label flex flex-wrap gap-x-6 gap-y-2 text-foreground/60 lg:justify-end">
            {META.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </motion.ul>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

import { BRAND, HERO, LINE, META } from "../_lib/content";

const EASE = [0.76, 0, 0.24, 1] as const;
const LETTERS = BRAND.toUpperCase().split("");

export function Hero() {
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);
  const section = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end start"] });
  const photoY = useTransform(scrollYProgress, [0, 1], ["0%", reduced ? "0%" : "18%"]);
  const wordY = useTransform(scrollYProgress, [0, 1], ["0%", reduced ? "0%" : "-30%"]);

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
  const at = (delay: number, duration = 1.2) => ({ duration: reduced ? 0 : duration, delay: ready && !reduced ? delay : 0, ease: EASE });

  return (
    <section ref={section} className="relative isolate h-svh min-h-[40rem] overflow-hidden bg-background text-foreground">
      <motion.div
        className="absolute inset-0 will-change-[clip-path]"
        initial={{ clipPath: reduced ? "inset(0)" : "inset(100% 0 0 0)" }}
        animate={{ clipPath: shown ? "inset(0 0 0 0)" : "inset(100% 0 0 0)" }}
        transition={at(0, 1.5)}
      >
        <motion.div style={{ y: photoY }} className="absolute inset-0 will-change-transform">
          <motion.div
            className="absolute inset-0"
            initial={{ transform: "scale(1.12)" }}
            animate={{ transform: shown && !reduced ? "scale(1)" : "scale(1.12)" }}
            transition={{ duration: reduced ? 0 : 14, ease: "linear" }}
          >
            <Image src={HERO.src} alt={HERO.alt} fill priority quality={92} sizes="100vw" className="object-cover object-[50%_35%]" style={{ filter: "contrast(1.05) saturate(0.82)" }} />
          </motion.div>
        </motion.div>
      </motion.div>

      <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,rgba(15,23,34,0.55),rgba(15,23,34,0)_45%)]" />
      <div aria-hidden className="absolute inset-x-0 top-0 h-[28%] bg-[linear-gradient(to_bottom,rgba(15,23,34,0.5),rgba(15,23,34,0))]" />
      <div aria-hidden className="grain absolute inset-0 opacity-70" />

      {/* Thin vertical rules, drawn in after the photograph. */}
      <div aria-hidden className="absolute inset-0 grid grid-cols-6 px-6 sm:px-10">
        {Array.from({ length: 7 }, (_, i) => (
          <motion.span
            key={i}
            className="h-full w-px origin-top bg-foreground/15 will-change-transform"
            style={{ gridColumn: i === 6 ? "6 / 7" : `${i + 1}`, justifySelf: i === 6 ? "end" : "start" }}
            initial={{ transform: reduced ? "scaleY(1)" : "scaleY(0)" }}
            animate={{ transform: shown || reduced ? "scaleY(1)" : "scaleY(0)" }}
            transition={{ duration: reduced ? 0 : 1.6, delay: ready && !reduced ? 1.1 + i * 0.05 : 0, ease: EASE }}
          />
        ))}
      </div>

      <header className="absolute inset-x-0 top-0 flex items-center justify-between px-6 pt-6 sm:px-10 sm:pt-8">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: shown }} transition={at(1.7)} className="label">
          {BRAND}
        </motion.p>
        <motion.nav initial={{ opacity: 0 }} animate={{ opacity: shown }} transition={at(1.8)} className="label hidden gap-8 sm:flex" aria-label="Sections">
          <a href="#">The houses</a>
          <a href="#">The marsh</a>
          <a href="#">Enquire</a>
        </motion.nav>
      </header>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: shown }}
        transition={at(1.5)}
        className="italic-serif absolute top-[42%] left-6 max-w-[22ch] text-[clamp(1.1rem,1.7vw,1.5rem)] leading-snug text-foreground/95 [text-shadow:0_1px_18px_rgba(15,23,34,0.45)] sm:left-10"
      >
        {LINE}
      </motion.p>

      <motion.dl initial={{ opacity: 0 }} animate={{ opacity: shown }} transition={at(1.9)} className="label absolute top-[calc(42%+7.5rem)] left-6 hidden flex-col gap-2 text-foreground/75 [text-shadow:0_1px_14px_rgba(15,23,34,0.5)] sm:left-10 sm:flex">
        {META.map((m) => (
          <dd key={m}>{m}</dd>
        ))}
      </motion.dl>

      {/* The word, cropped by the bottom edge on purpose. */}
      <motion.h1
        style={{ y: wordY }}
        aria-label={BRAND}
        className="display absolute inset-x-0 -bottom-[0.14em] flex justify-center text-[clamp(5rem,20.6vw,19.5rem)] leading-none tracking-[-0.01em] uppercase will-change-transform"
      >
        {LETTERS.map((ch, i) => (
          <span key={i} className="inline-block overflow-hidden">
            <motion.span
              aria-hidden
              className="inline-block will-change-transform"
              initial={{ transform: reduced ? "translateY(0%)" : "translateY(105%)" }}
              animate={{ transform: shown || reduced ? "translateY(0%)" : "translateY(105%)" }}
              transition={{ duration: reduced ? 0 : 1.3, delay: ready && !reduced ? 0.55 + i * 0.045 : 0, ease: EASE }}
            >
              {ch}
            </motion.span>
          </span>
        ))}
      </motion.h1>
    </section>
  );
}

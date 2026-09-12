"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import { FadeIn, SETTLE } from "./motion";
import { Mark } from "./mark";
import { usePageRevealed } from "./newspaper";
import { Shell } from "./shell";
import { ADDRESS, NAV_LINKS } from "../_lib/content";

const LETTERS = ["A", "L", "D", "E", "R", " ", "&", " ", "B", "R", "A", "S", "S"];

export function Masthead() {
  const [fonts, setFonts] = useState(false);
  const revealed = usePageRevealed();
  const reduced = useReducedMotion();
  const ready = fonts && revealed;

  useEffect(() => {
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) setFonts(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <header>
      <Shell className="text-center">
        <FadeIn play={ready} delay={0.5} className="label flex justify-between pt-5 text-muted-foreground sm:pt-6">
          <span className="hidden sm:inline">{ADDRESS.short}</span>
          <span className="sm:hidden">Alder St · Portland</span>
          <span>Open today till six</span>
        </FadeIn>

        <FadeIn play={ready} delay={0.6} className="flex justify-center pt-5 sm:pt-7">
          <Mark className="size-10 sm:size-12" />
        </FadeIn>

        {/* Each letter is pressed into the page in turn, like a line of type going through a press. */}
        <h1
          className="mt-3 flex justify-center font-heading text-[clamp(1.9rem,7.4vw,4.9rem)] leading-none tracking-[0.16em] uppercase [padding-left:0.16em] sm:mt-4 2xl:text-[6rem]"
          aria-label="Alder & Brass"
        >
          {LETTERS.map((letter, index) => (
            <motion.span
              key={index}
              aria-hidden
              className={letter === "&" ? "tracking-normal italic text-(--brass)" : undefined}
              initial={{ opacity: 0, transform: reduced ? "scale(1)" : "scale(1.28)" }}
              animate={{ opacity: ready ? 1 : 0, transform: ready || reduced ? "scale(1)" : "scale(1.28)" }}
              transition={{
                duration: reduced ? 0 : 0.55,
                delay: ready ? 0.7 + index * 0.06 : 0,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {letter === " " ? " " : letter}
            </motion.span>
          ))}
        </h1>

        <FadeIn play={ready} delay={1.25} className="label mt-3 text-muted-foreground sm:mt-4 sm:tracking-[0.24em]">
          <span className="hidden sm:inline">Coffee house &amp; roastery · Portland, Oregon · since 2009</span>
          <span className="sm:hidden">Coffee house &amp; roastery · since 2009</span>
        </FadeIn>

        <div className="mt-4 flex items-center gap-3 sm:mt-5">
          <motion.span
            initial={{ transform: reduced ? "scaleX(1)" : "scaleX(0)" }}
            animate={{ transform: ready || reduced ? "scaleX(1)" : "scaleX(0)" }}
            transition={{ duration: reduced ? 0 : 1.1, delay: ready ? 1.35 : 0, ease: SETTLE }}
            className="h-[5px] flex-1 origin-right border-y border-foreground"
          />
          <motion.span
            initial={{ opacity: 0, transform: reduced ? "scale(1)" : "scale(2.4)" }}
            animate={{ opacity: ready ? 1 : 0, transform: ready || reduced ? "scale(1)" : "scale(2.4)" }}
            transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 18, delay: ready ? 2.3 : 0 }}
            className="text-(--brass) text-[0.7rem]"
          >
            ✦
          </motion.span>
          <motion.span
            initial={{ transform: reduced ? "scaleX(1)" : "scaleX(0)" }}
            animate={{ transform: ready || reduced ? "scaleX(1)" : "scaleX(0)" }}
            transition={{ duration: reduced ? 0 : 1.1, delay: ready ? 1.35 : 0, ease: SETTLE }}
            className="h-[5px] flex-1 origin-left border-y border-foreground"
          />
        </div>
      </Shell>

      <nav
        aria-label="Sections"
        className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm"
      >
        <Shell className="label flex h-11 items-center justify-between gap-4 text-foreground sm:h-12">
          <span className="flex gap-4 sm:gap-8">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="transition-colors hover:text-(--brass)">
                <span className="hidden sm:inline">{link.label}</span>
                <span className="sm:hidden">{link.short}</span>
              </a>
            ))}
          </span>
          <span className="hidden text-muted-foreground md:inline">No bookings · walk in</span>
        </Shell>
      </nav>
    </header>
  );
}

"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";
import { FadeIn, SETTLE } from "./motion";
import { LETTERS, Mark } from "./mark";
import { EXIT, EXIT_EASE, useOpening } from "./opening";
import { Shell } from "./shell";
import { ADDRESS, NAV_LINKS } from "../_lib/content";

const REST = "translate3d(0px, 0px, 0) scale(1)";
const BONE = "#e7e2d2";
const INK = "#182019";
const GAP = 18;

type Pose = { mark: string; word: string };

// The hero pose: mark and wordmark stacked at the centre of the viewport, a little
// larger. Everything is measured from the elements at rest, so the way back is `REST`.
// Layout position, ignoring any transform the element currently carries.
function laidOut(el: HTMLElement) {
  let left = 0;
  let top = 0;
  let node: HTMLElement | null = el;
  while (node) {
    left += node.offsetLeft;
    top += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { left, top: top - window.scrollY, width: el.offsetWidth, height: el.offsetHeight };
}

function poseFor(mark: HTMLElement, word: HTMLElement): Pose {
  const m = laidOut(mark);
  const w = laidOut(word);
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  const wordScale = Math.min(5.6 * 16, Math.max(32, 0.083 * vw)) / parseFloat(getComputedStyle(word).fontSize);
  const markScale = 1.2;
  const wordH = w.height * wordScale;
  const markH = m.height * markScale;
  const centre = vh / 2 - vh * 0.02;
  const markCy = centre - (wordH + GAP) / 2;
  const wordCy = centre + (markH + GAP) / 2;
  const at = (r: { left: number; top: number; width: number; height: number }, cy: number, s: number) =>
    `translate3d(${(vw / 2 - (r.left + r.width / 2)).toFixed(2)}px, ${(cy - (r.top + r.height / 2)).toFixed(2)}px, 0) scale(${s.toFixed(4)})`;
  return { mark: at(m, markCy, markScale), word: at(w, wordCy, wordScale) };
}

export function Masthead() {
  const stage = useOpening();
  const reduced = useReducedMotion();
  const [fonts, setFonts] = useState(false);
  const [pose, setPose] = useState<Pose | null>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLHeadingElement>(null);

  const revealed = stage !== "hold";
  const hero = stage === "hold";
  const travelling = stage !== "done";

  useEffect(() => {
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) setFonts(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Measured before paint so the wordmark never shows at rest while the ground is up.
  useLayoutEffect(() => {
    if (!hero) return;
    const measure = () => {
      if (markRef.current && wordRef.current) setPose(poseFor(markRef.current, wordRef.current));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [hero, fonts]);

  const heroTransition = hero
    ? { opacity: { duration: 0.6 }, transform: { duration: 0 } }
    : { duration: EXIT, ease: EXIT_EASE };
  const heroColor = { duration: EXIT * 0.5, delay: EXIT * 0.3 };
  const lift = travelling ? "relative z-[80]" : "";

  return (
    <header>
      <Shell className="text-center">
        <FadeIn play={revealed} delay={0.2} className="label flex justify-between pt-5 text-muted-foreground sm:pt-6">
          <span className="hidden sm:inline">{ADDRESS.short}</span>
          <span className="sm:hidden">Alder St · Portland</span>
          <span>Open today till six</span>
        </FadeIn>

        <div className="flex justify-center pt-5 sm:pt-7">
          <motion.div
            ref={markRef}
            initial={false}
            animate={{
              opacity: hero && !pose ? 0 : 1,
              transform: hero && pose ? pose.mark : REST,
              filter: hero ? "invert(1) brightness(0.92)" : "invert(0)",
            }}
            transition={{ ...heroTransition, filter: hero ? { duration: 0 } : heroColor }}
            className={cn("origin-center will-change-transform", lift)}
          >
            <Mark className="size-10 sm:size-12" />
          </motion.div>
        </div>

        <motion.h1
          ref={wordRef}
          aria-label="Alder & Brass"
          initial={false}
          animate={{
            opacity: hero && !pose ? 0 : 1,
            transform: hero && pose ? pose.word : REST,
            color: hero ? BONE : INK,
          }}
          transition={{ ...heroTransition, color: hero ? { duration: 0 } : heroColor }}
          className={cn(
            "mt-3 flex origin-center justify-center font-heading text-[clamp(1.9rem,7.4vw,4.9rem)] leading-none tracking-[0.16em] uppercase will-change-transform [padding-left:0.16em] sm:mt-4 2xl:text-[6rem]",
            lift,
          )}
        >
          {LETTERS.map((letter, index) => (
            <span key={index} aria-hidden className={letter === "&" ? "tracking-normal italic text-(--brass)" : undefined}>
              {letter === " " ? "\u00A0" : letter}
            </span>
          ))}
        </motion.h1>

        <FadeIn play={revealed} delay={0.9} className="label mt-3 text-muted-foreground sm:mt-4 sm:tracking-[0.24em]">
          <span className="hidden sm:inline">Coffee house &amp; roastery · Portland, Oregon · since 2009</span>
          <span className="sm:hidden">Coffee house &amp; roastery · since 2009</span>
        </FadeIn>

        <div className="mt-4 flex items-center gap-3 sm:mt-5">
          <motion.span
            initial={false}
            animate={{ transform: revealed || reduced ? "scaleX(1)" : "scaleX(0)" }}
            transition={{ duration: reduced ? 0 : 1.1, delay: revealed && !reduced ? 1.0 : 0, ease: SETTLE }}
            className="h-[5px] flex-1 origin-right border-y border-foreground"
          />
          <motion.span
            initial={false}
            animate={{ opacity: revealed ? 1 : 0, transform: revealed || reduced ? "scale(1)" : "scale(2.4)" }}
            transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 18, delay: revealed ? 1.95 : 0 }}
            className="text-(--brass) text-[0.7rem]"
          >
            ✦
          </motion.span>
          <motion.span
            initial={false}
            animate={{ transform: revealed || reduced ? "scaleX(1)" : "scaleX(0)" }}
            transition={{ duration: reduced ? 0 : 1.1, delay: revealed && !reduced ? 1.0 : 0, ease: SETTLE }}
            className="h-[5px] flex-1 origin-left border-y border-foreground"
          />
        </div>
      </Shell>

      <nav
        aria-label="Sections"
        style={{ opacity: revealed ? 1 : 0, transition: "opacity 0.6s ease 0.4s" }}
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

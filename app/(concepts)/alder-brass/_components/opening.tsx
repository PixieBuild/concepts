"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { Mark, WordmarkLetters } from "./mark";
import { IMAGES } from "../_lib/content";

const Ctx = createContext(false);

export function usePageRevealed() {
  return useContext(Ctx);
}

// The wordmark stands alone while the hero's images decode, then travels into its
// slot in the masthead as the page appears. One element carries the continuity.
const ASSETS = [IMAGES.counter.src, IMAGES.counterTall.src, IMAGES.cup.src, IMAGES.mark];
const MIN_HOLD = 1.3;
const EXIT = 1.15;
const EXIT_EASE = [0.65, 0, 0.3, 1] as const;

type Box = { x: number; y: number; w: number; h: number };
const box = (el: Element | null): Box | null => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
};
// The masthead h1 is a full-width flex row of letter spans, so its own box is the shell;
// the flip has to land on the letters themselves.
const textBox = (el: Element | null): Box | null => {
  if (!el) return null;
  const rects = [...el.children].map((c) => c.getBoundingClientRect()).filter((r) => r.width > 0);
  if (!rects.length) return box(el);
  const x = Math.min(...rects.map((r) => r.left));
  const y = Math.min(...rects.map((r) => r.top));
  return { x, y, w: Math.max(...rects.map((r) => r.right)) - x, h: Math.max(...rects.map((r) => r.bottom)) - y };
};
// Both copies share the same markup, so the exact scale is the font-size ratio and
// the letter extents can be centred on each other.
const flip = (from: Box | null, to: Box | null, scale: number) => {
  if (!from || !to) return "translate3d(0px, 0px, 0) scale(1)";
  const dx = to.x + to.w / 2 - (from.x + from.w / 2);
  const dy = to.y + to.h / 2 - (from.y + from.h / 2);
  return `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) scale(${scale.toFixed(5)})`;
};
const fontSize = (el: Element | null) => (el ? parseFloat(getComputedStyle(el).fontSize) : 1);

export function Opening({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [done, setDone] = useState(reduced === true);
  const [wordTo, setWordTo] = useState<string>("translate3d(0px, 0px, 0) scale(1)");
  const [markTo, setMarkTo] = useState<string>("translate3d(0px, 0px, 0) scale(1)");
  const word = useRef<HTMLDivElement>(null);
  const mark = useRef<HTMLDivElement>(null);
  const revealed = reduced === true || leaving || done;

  useEffect(() => {
    if (reduced) return;
    const root = document.documentElement;
    // Lock scrolling on the root, not the body: with `scrollbar-gutter: stable` the
    // gutter stays reserved, so nothing shifts when the scrollbar comes back.
    root.style.overflow = "hidden";
    const started = performance.now();
    let loaded = 0;
    let cancelled = false;
    const total = ASSETS.length + 1;
    const tick = () => {
      loaded += 1;
      if (!cancelled) setProgress(Math.round((loaded / total) * 100));
      if (loaded >= total) {
        const wait = Math.max(0, MIN_HOLD * 1000 - (performance.now() - started));
        window.setTimeout(() => !cancelled && setReady(true), wait);
      }
    };
    document.fonts.ready.then(tick);
    ASSETS.forEach((src) => {
      const img = new Image();
      img.onload = tick;
      img.onerror = tick;
      img.src = src;
    });
    return () => {
      cancelled = true;
      root.style.overflow = "";
    };
  }, [reduced]);

  useEffect(() => {
    if (!ready || leaving) return;
    const raf = requestAnimationFrame(() => {
      const h1 = document.querySelector("main header h1");
      const letters = word.current?.firstElementChild ?? null;
      const pageMark = h1?.previousElementSibling?.firstElementChild ?? null;
      setWordTo(flip(textBox(letters), textBox(h1), fontSize(h1) / fontSize(letters)));
      const m = box(mark.current);
      const pm = box(pageMark);
      setMarkTo(flip(m, pm, m && pm ? pm.w / m.w : 1));
      setLeaving(true);
    });
    return () => cancelAnimationFrame(raf);
  }, [ready, leaving]);

  const finish = () => {
    setDone(true);
    document.documentElement.style.overflow = "";
  };

  useEffect(() => {
    if (!leaving) return;
    const t = window.setTimeout(finish, EXIT * 1000 + 400);
    return () => window.clearTimeout(t);
  }, [leaving]);

  const ease = { duration: EXIT, ease: EXIT_EASE };

  // The page's own mark and wordmark stay hidden until the travelling copies land on them.
  useEffect(() => {
    if (reduced) return;
    const header = document.querySelector("main header");
    const h1 = header?.querySelector("h1") as HTMLElement | null;
    const mk = h1?.previousElementSibling?.firstElementChild as HTMLElement | null;
    if (!h1 || !mk) return;
    const show = done;
    h1.style.visibility = show ? "" : "hidden";
    mk.style.visibility = show ? "" : "hidden";
  }, [reduced, done]);

  return (
    <Ctx.Provider value={revealed}>
      {children}
      <AnimatePresence>
        {!reduced && !done && (
          <div aria-hidden className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
            <motion.div
              initial={false}
              animate={{ clipPath: leaving ? "inset(0 0 100% 0)" : "inset(0 0 0% 0)" }}
              transition={ease}
              className="absolute inset-0 bg-[#182019]"
            />

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.div
                ref={mark}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transform: leaving ? markTo : "translate3d(0px, 0px, 0) scale(1)",
                  filter: leaving ? "invert(0)" : "invert(1) brightness(0.92)",
                }}
                transition={leaving ? { ...ease, filter: { duration: EXIT * 0.5, delay: EXIT * 0.3 } } : { duration: 0.6 }}
                className="origin-center will-change-transform"
              >
                <Mark className="size-12 sm:size-14" />
              </motion.div>
              <motion.div
                ref={word}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transform: leaving ? wordTo : "translate3d(0px, 0px, 0) scale(1)",
                  color: leaving ? "#182019" : "#e7e2d2",
                }}
                transition={leaving ? { ...ease, color: { duration: EXIT * 0.5, delay: EXIT * 0.3 } } : { duration: 0.6, delay: 0.1 }}
                onAnimationComplete={() => leaving && finish()}
                className="mt-4 origin-center will-change-transform sm:mt-5"
              >
                <WordmarkLetters className="text-[clamp(2rem,8.3vw,5.6rem)]" />
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: leaving ? 0 : 1 }}
              transition={{ duration: leaving ? 0.25 : 0.6, delay: leaving ? 0 : 0.3 }}
              className="label absolute inset-x-0 bottom-8 flex justify-between px-5 text-[#e7e2d2]/60 sm:bottom-10 sm:px-8 lg:px-10"
            >
              <span>214 Alder Street · Portland</span>
              <span className="tabular-nums">{String(progress).padStart(3, "0")}</span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  );
}

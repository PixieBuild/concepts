"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";

import { IMAGES } from "../_lib/content";

export type Stage = "hold" | "leave" | "done";
const Ctx = createContext<Stage>("done");

export function useOpening() {
  return useContext(Ctx);
}

export function usePageRevealed() {
  return useContext(Ctx) !== "hold";
}

// The masthead's own mark and wordmark sit centred on an ink ground while the hero's
// images decode, then the ground lifts and they travel back to their place in the
// page. They are the real elements, so the landing is `transform: none` and cannot miss.
const ASSETS = [IMAGES.counter.src, IMAGES.counterTall.src, IMAGES.cup.src, IMAGES.mark];
const MIN_HOLD = 1.3;
export const EXIT = 1.15;
export const EXIT_EASE = [0.65, 0, 0.3, 1] as const;

const QUERY = "(prefers-reduced-motion: reduce)";
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
// Null on the server and during hydration, so the first client frame matches the
// server's; the real preference arrives in the synchronous re-render that follows.
const useReducedMotionPref = () =>
  useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => null);

export function Opening({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotionPref();
  const [progress, setProgress] = useState(0);
  // State always starts on hold so the server and client render the same first frame;
  // `useReducedMotion` is null until hydration, so a reduced-motion reader resolves to
  // done in the same render it becomes known, before anything moves.
  const [held, setStage] = useState<Stage>("hold");
  const stage: Stage = reduced ? "done" : held;

  useEffect(() => {
    if (reduced) return;
    // Lock scrolling on the root, not the body: with `scrollbar-gutter: stable` the
    // gutter stays reserved, so nothing shifts when the scrollbar comes back.
    const root = document.documentElement;
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
        window.setTimeout(() => !cancelled && setStage("leave"), wait);
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
    if (stage !== "leave") return;
    const t = window.setTimeout(() => {
      setStage("done");
      document.documentElement.style.overflow = "";
    }, EXIT * 1000 + 80);
    return () => window.clearTimeout(t);
  }, [stage]);

  const leaving = stage === "leave";

  return (
    <Ctx.Provider value={stage}>
      {children}
      <AnimatePresence>
        {!reduced && stage !== "done" && (
          <div aria-hidden className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
            <motion.div
              initial={false}
              animate={{ clipPath: leaving ? "inset(0 0 100% 0)" : "inset(0 0 0% 0)" }}
              transition={{ duration: EXIT, ease: EXIT_EASE }}
              className="absolute inset-0 bg-[#182019]"
            />
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

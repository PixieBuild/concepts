"use client";

import { useEffect, type RefObject } from "react";
import { useMotionValue, useScroll } from "motion/react";

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function smoothstep(from: number, to: number, v: number) {
  const t = clamp01((v - from) / (to - from));
  return t * t * (3 - 2 * t);
}

/** An element's trip through the viewport, 0 entering at the bottom to 1 leaving at the top, plus a reduced-motion flag. */
export function usePassage(target: RefObject<HTMLElement | null>) {
  const { scrollYProgress } = useScroll({ target, offset: ["start end", "end start"] });
  // A motion value rather than useReducedMotion, so the first client render matches the server's.
  const calm = useMotionValue(0);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => calm.set(query.matches ? 1 : 0);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, [calm]);
  return { progress: scrollYProgress, calm };
}

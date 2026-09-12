"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { cancelFrame, frame, time } from "motion";

import "lenis/dist/lenis.css";

// `lerp` is how much of the remaining distance each frame covers: 1 is native scroll.
// Lenis ticks inside Motion's frame loop, so scroll-linked values read the scroll
// position on the same frame it moves instead of one behind.
export function SmoothScroll({ lerp = 0.15 }: { lerp?: number }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      lerp,
      syncTouch: false,
      anchors: true,
      autoRaf: false,
    });
    const tick = () => lenis.raf(time.now());
    frame.update(tick, true);

    const root = document.documentElement;
    const locked = (el: Element) => getComputedStyle(el).overflow === "hidden";
    const sync = () => {
      if (locked(document.body) || locked(root)) lenis.stop();
      else lenis.start();
    };

    const observer = new MutationObserver(sync);
    const options = { attributes: true, attributeFilter: ["style", "class"] };
    observer.observe(document.body, options);
    observer.observe(root, options);
    sync();

    return () => {
      cancelFrame(tick);
      observer.disconnect();
      lenis.destroy();
    };
  }, [lerp]);

  return null;
}

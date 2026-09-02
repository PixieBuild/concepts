"use client";

import { useEffect } from "react";
import Lenis from "lenis";

import "lenis/dist/lenis.css";

export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      lerp: 0.15,
      syncTouch: false,
      anchors: true,
      autoRaf: true,
    });

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
      observer.disconnect();
      lenis.destroy();
    };
  }, []);

  return null;
}

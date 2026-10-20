"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

const TOP = 112;
const BOTTOM = 24;

/** Sticks below the header; when taller than the viewport, sticks by its foot instead so nothing is cut off. */
export function StickyColumn({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      el.style.top = `${Math.min(TOP, window.innerHeight - el.offsetHeight - BOTTOM)}px`;
    };
    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div ref={ref} className={cn("lg:sticky lg:top-28", className)}>
      {children}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

import { cn } from "@/lib/utils";

export const EASE = [0.16, 1, 0.3, 1] as const;
export const SETTLE = [0.22, 1, 0.36, 1] as const;
const VIEWPORT = { once: true, margin: "0px 0px -12% 0px" } as const;

// Text animates `transform` as a string, never the `y` shortcut: Motion hands a whole
// transform to the compositor to interpolate, while `y` is written from JavaScript each
// frame and Chrome snaps it to device pixels, so slow settles tick instead of glide.
function rise(distance: number) {
  return {
    hidden: { opacity: 0, transform: `translateY(${distance}px)` },
    shown: { opacity: 1, transform: "translateY(0px)" },
  };
}

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const { hidden, shown } = rise(reduced ? 0 : 18);

  return (
    <motion.div
      className={className}
      initial={hidden}
      whileInView={shown}
      viewport={VIEWPORT}
      transition={{ duration: reduced ? 0 : 0.9, delay, ease: SETTLE }}
    >
      {children}
    </motion.div>
  );
}

// Load-time text keeps its layer for the life of the page: the wordmark is large enough
// that the repaint when a finished animation's layer is dropped would show.
export function FadeIn({
  children,
  delay = 0,
  className,
  play = true,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  play?: boolean;
}) {
  const reduced = useReducedMotion();
  const { hidden, shown } = rise(reduced ? 0 : 10);

  return (
    <motion.div
      className={cn("will-change-transform", className)}
      initial={hidden}
      animate={play ? shown : hidden}
      transition={{ duration: reduced ? 0 : 0.8, delay: play ? delay : 0, ease: SETTLE }}
    >
      {children}
    </motion.div>
  );
}

function useImagesLoaded(ref: React.RefObject<HTMLElement | null>) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const pending = Array.from(el.querySelectorAll("img")).filter((img) => !img.complete);
    if (pending.length === 0) {
      setLoaded(true);
      return;
    }
    let left = pending.length;
    const done = () => {
      left -= 1;
      if (left <= 0) setLoaded(true);
    };
    pending.forEach((img) => {
      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", done, { once: true });
    });
    const fallback = window.setTimeout(() => setLoaded(true), 4000);
    return () => {
      window.clearTimeout(fallback);
      pending.forEach((img) => {
        img.removeEventListener("load", done);
        img.removeEventListener("error", done);
      });
    };
  }, [ref]);

  return loaded;
}

// Photographs may stay on the compositor: a clip wipe and a scale on an image
// have no glyphs to snap.
export function RevealImage({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, VIEWPORT);
  const loaded = useImagesLoaded(ref);
  const show = inView && loaded;
  const duration = reduced ? 0 : 1.5;

  return (
    <motion.div
      ref={ref}
      className={cn("relative overflow-hidden", className)}
      initial={false}
      animate={{ clipPath: show ? "inset(0% 0% 0% 0%)" : "inset(100% 0% 0% 0%)" }}
      transition={{ duration, delay, ease: EASE }}
    >
      <motion.div
        initial={false}
        animate={{ scale: show ? 1 : 1.14 }}
        transition={{ duration: duration * 1.25, delay, ease: EASE }}
        className="h-full origin-center will-change-transform"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export function Parallax({
  children,
  className,
  amount = 7,
}: {
  children: React.ReactNode;
  className?: string;
  amount?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    reduced ? ["0%", "0%"] : [`-${amount}%`, `${amount}%`],
  );

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)}>
      <motion.div style={{ y }} className="absolute inset-0 scale-[1.16] will-change-transform">
        {children}
      </motion.div>
    </div>
  );
}

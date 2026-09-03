"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "motion/react";

import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;
const VIEWPORT = { once: true, margin: "0px 0px -12% 0px" } as const;

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

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: reduced ? 0 : 1.4, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

// Waits for the photos inside to finish loading, so the wipe never opens on an empty box.
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
  const duration = reduced ? 0 : 1.6;

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
        animate={{ scale: show ? 1 : 1.16 }}
        transition={{ duration: duration * 1.25, delay, ease: EASE }}
        className="h-full origin-center will-change-transform"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

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

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: play ? 1 : 0 }}
      transition={{ duration: reduced ? 0 : 1.1, delay: play ? delay : 0, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

const lineVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const lineChild: Variants = {
  hidden: { y: "112%" },
  show: { y: 0, transition: { duration: 1, ease: EASE } },
};

const staticLineChild: Variants = {
  hidden: { y: "112%" },
  show: { y: 0, transition: { duration: 0 } },
};

export function StaggerLines({
  lines,
  className,
  lineClassName,
  play = true,
}: {
  lines: string[];
  className?: string;
  lineClassName?: string;
  play?: boolean;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.span
      className={className}
      variants={lineVariants}
      initial="hidden"
      animate={play ? "show" : "hidden"}
    >
      {lines.map(line => (
        <span
          key={line}
          className="block overflow-hidden pb-[0.14em] mb-[-0.14em]"
        >
          <motion.span
            variants={reduced ? staticLineChild : lineChild}
            className={`block will-change-transform ${lineClassName ?? ""}`}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </motion.span>
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

"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";

const EASE = [0.16, 1, 0.3, 1] as const;

function useRevealed<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShown(true);
        observer.disconnect();
      },
      { rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, shown };
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
  const { ref, shown } = useRevealed<HTMLDivElement>();

  return (
    <div
      ref={ref}
      data-reveal=""
      data-shown={shown || undefined}
      style={delay ? { transitionDelay: `${delay}s` } : undefined}
      className={className}
    >
      {children}
    </div>
  );
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
  const { ref, shown } = useRevealed<HTMLDivElement>();

  return (
    <div
      ref={ref}
      data-reveal="image"
      data-shown={shown || undefined}
      style={delay ? { transitionDelay: `${delay}s` } : undefined}
      className={className}
    >
      {children}
    </div>
  );
}

export function FadeIn({
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
      initial={reduced ? undefined : { opacity: 0 }}
      animate={reduced ? undefined : { opacity: 1 }}
      transition={{ duration: 1.2, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

const lineVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};

const lineChild: Variants = {
  hidden: { y: "112%" },
  show: { y: 0, transition: { duration: 1.15, ease: EASE } },
};

export function StaggerLines({
  lines,
  className,
  lineClassName,
}: {
  lines: string[];
  className?: string;
  lineClassName?: string;
}) {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <span className={className}>
        {lines.map(line => (
          <span key={line} className={lineClassName}>
            {line}
          </span>
        ))}
      </span>
    );
  }

  return (
    <motion.span
      className={className}
      variants={lineVariants}
      initial="hidden"
      animate="show"
    >
      {lines.map(line => (
        <span
          key={line}
          className="block overflow-hidden pb-[0.14em] mb-[-0.14em]"
        >
          <motion.span
            variants={lineChild}
            className={`block will-change-transform ${lineClassName ?? ""}`}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

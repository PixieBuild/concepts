"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";

const EASE = [0.16, 1, 0.3, 1] as const;
const REVEAL_EASE = [0.33, 0.9, 0.28, 1] as const;
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
      initial={reduced ? undefined : { opacity: 0, y: 20 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: 1.2, delay, ease: REVEAL_EASE }}
    >
      {children}
    </motion.div>
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
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduced ? undefined : { opacity: 0, clipPath: "inset(12% 0% 0% 0%)" }}
      whileInView={reduced ? undefined : { opacity: 1, clipPath: "inset(0% 0% 0% 0%)" }}
      viewport={VIEWPORT}
      transition={{ duration: 1.5, delay, ease: REVEAL_EASE }}
    >
      {children}
    </motion.div>
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

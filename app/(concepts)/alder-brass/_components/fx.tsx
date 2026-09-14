"use client";

import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

const VIEWPORT = { once: true, margin: "0px 0px -10% 0px" } as const;

// A rubber stamp: arrives large and thumps down to size.
export function Stamp({
  children,
  rotate = -7,
  className,
}: {
  children: React.ReactNode;
  rotate?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const at = (scale: number) => `rotate(${rotate}deg) scale(${scale})`;
  return (
    <motion.span
      aria-hidden
      className={cn("stamp", className)}
      initial={{ opacity: 0, transform: at(reduced ? 1 : 1.6) }}
      whileInView={{ opacity: 1, transform: at(1) }}
      viewport={VIEWPORT}
      transition={
        reduced
          ? { duration: 0 }
          : { type: "spring", stiffness: 520, damping: 18, mass: 0.7, delay: 0.35 }
      }
    >
      {children}
    </motion.span>
  );
}

// A pencil note writes itself in, left to right.
export function HandNote({
  children,
  className,
  delay = 0.2,
  play,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  play?: boolean;
}) {
  const reduced = useReducedMotion();
  const shown = { clipPath: "inset(-20% -4% -30% 0%)" };
  const hidden = { clipPath: reduced ? "inset(-20% -4% -30% 0%)" : "inset(-20% 100% -30% 0%)" };
  const transition = { duration: reduced ? 0 : 1.1, delay, ease: "linear" as const };
  const common = { className: cn("hand", className), initial: hidden, transition };
  return play === undefined ? (
    <motion.p {...common} whileInView={shown} viewport={VIEWPORT}>
      {children}
    </motion.p>
  ) : (
    <motion.p {...common} animate={play ? shown : hidden}>
      {children}
    </motion.p>
  );
}

// A sheet pinned to the wall: drops in, settles slightly off-square, then the pin lands.
export function Pinned({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={cn("relative", className)}
      initial={{
        opacity: 0,
        transform: reduced ? "translateY(0px) rotate(-0.6deg)" : "translateY(28px) rotate(1.4deg)",
      }}
      whileInView={{ opacity: 1, transform: "translateY(0px) rotate(-0.6deg)" }}
      viewport={VIEWPORT}
      transition={{ duration: reduced ? 0 : 1.1, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.span
        aria-hidden
        className="absolute -top-2 left-1/2 z-10 size-4 -translate-x-1/2 rounded-full bg-(--brass-soft) shadow-[0_2px_4px_rgba(0,0,0,0.45),inset_0_-2px_3px_rgba(0,0,0,0.25)]"
        initial={{ opacity: 0, transform: `translateX(-50%) scale(${reduced ? 1 : 2.2})` }}
        whileInView={{ opacity: 1, transform: "translateX(-50%) scale(1)" }}
        viewport={VIEWPORT}
        transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 600, damping: 20, delay: 0.75 }}
      />
      {children}
    </motion.div>
  );
}

// The route on the map draws itself from the tram stop to the green door.
export function MapRoute({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 75"
      preserveAspectRatio="none"
      className={cn("pointer-events-none absolute inset-0 size-full", className)}
    >
      <motion.path
        d="M 67 44 C 60 46, 54 49, 47 47 S 38 42, 35 38"
        fill="none"
        stroke="var(--brass)"
        strokeWidth="0.55"
        strokeLinecap="round"
        strokeDasharray="1.2 1.1"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: reduced ? 1 : 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={VIEWPORT}
        transition={{ pathLength: { duration: reduced ? 0 : 1.8, delay: 2.0, ease: "easeInOut" }, opacity: { duration: 0.3, delay: 2.0 } }}
      />
      <motion.circle
        cx="35"
        cy="38"
        r="1.1"
        fill="var(--green)"
        initial={{ opacity: 0, transform: "scale(0)" }}
        whileInView={{ opacity: 1, transform: "scale(1)" }}
        viewport={VIEWPORT}
        style={{ transformOrigin: "35px 38px" }}
        transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 16, delay: 3.7 }}
      />
    </svg>
  );
}

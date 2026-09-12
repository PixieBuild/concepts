"use client";

import { motion, useReducedMotion } from "motion/react";

import { useCupLanded } from "./cup-flight";

// Ticks in the moment the cup touches down.
export function HouseCupLabel({ children }: { children: React.ReactNode }) {
  const landed = useCupLanded();
  const reduced = useReducedMotion();
  return (
    <motion.p
      className="label text-(--brass)"
      initial={false}
      animate={{ clipPath: landed ? "inset(0 0% 0 0)" : reduced ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)" }}
      transition={{ duration: reduced ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.p>
  );
}

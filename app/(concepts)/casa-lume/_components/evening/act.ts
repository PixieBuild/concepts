import { useState } from "react";
import { useMotionValueEvent, type MotionValue } from "motion/react";

import { ACT } from "./timeline";

export type Act = "house" | "climb" | "beyond";

const actAt = (p: number): Act => (p < 0.085 ? "house" : p < ACT.interactive ? "climb" : "beyond");

/** The hero's act as React state, held by the leaves that render it so an act change never re-renders the hero. */
export function useAct(progress: MotionValue<number>) {
  const [act, setAct] = useState<Act>("house");
  useMotionValueEvent(progress, "change", (p) => {
    const next = actAt(p);
    if (next !== act) setAct(next);
  });
  return act;
}

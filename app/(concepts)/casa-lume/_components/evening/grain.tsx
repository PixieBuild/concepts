"use client";

import { memo } from "react";
import { motion, useTransform, type MotionValue } from "motion/react";

import { camera, insetOf, type Geo } from "./timeline";
import { GRAIN } from "@/app/(concepts)/casa-lume/_lib/hero-lights";

/** One still layer of film grain over every photograph on the stage, clipped to the plate while it opens. */
export const Grain = memo(function Grain({ progress, geo }: { progress: MotionValue<number>; geo: MotionValue<Geo | null> }) {
  const clipPath = useTransform(() => {
    // Read before branching: a function transform follows only the values it read when its component last rendered.
    const p = progress.get();
    const g = geo.get();
    return g ? insetOf(camera(p, g).frame, g) : "inset(0px)";
  });

  return (
    <motion.div aria-hidden style={{ clipPath }} className="pointer-events-none absolute inset-0 z-[15] motion-reduce:hidden">
      <div
        className="evening-reveal absolute inset-0 bg-size-[256px_256px]"
        style={{ backgroundImage: `url("${GRAIN.src}")` }}
      />
    </motion.div>
  );
});

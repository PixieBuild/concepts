"use client";

import { motion, useTransform, type MotionValue } from "motion/react";

import { cn } from "@/lib/utils";

export const CHAPTERS = [
  { id: "chapter-bottle", name: "The bottle", short: "Bottle" },
  { id: "chapter-formula", name: "Formula", short: "Formula" },
  { id: "chapter-dose", name: "Dose", short: "Dose" },
  { id: "chapter-results", name: "Results", short: "Results" },
] as const;

/** A tick ruler along the foot of the stage: the marker scrubs with scroll and each label jumps to its chapter. */
export function ChapterRail({ progress, current, className }: { progress: MotionValue<number>; current: number; className?: string }) {
  const at = useTransform(progress, (v) => Math.min(1, Math.max(0, v)));
  const marker = useTransform(at, (v) => `translate3d(${v * 100}%, 0, 0)`);
  const fill = useTransform(at, (v) => `scaleX(${v})`);

  return (
    <nav aria-label="Chapters" className={cn("bg-background", className)}>
      <div className="relative h-3 text-foreground">
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-1.5 opacity-25 [background:repeating-linear-gradient(to_right,currentColor_0_1px,transparent_1px_8px)]" />
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-border" />
        <span aria-hidden className="absolute inset-y-0 left-0 w-3/4">
          <motion.span style={{ transform: fill }} className="absolute inset-x-0 bottom-0 h-px origin-left bg-foreground" />
          <motion.span style={{ transform: marker }} className="absolute inset-0 will-change-transform">
            <span className="absolute inset-y-0 left-0 w-px bg-foreground" />
          </motion.span>
        </span>
        {CHAPTERS.map((chapter, i) => (
          <span key={chapter.id} aria-hidden className="absolute bottom-0 h-full w-px bg-foreground/45" style={{ left: `${(i / CHAPTERS.length) * 100}%` }} />
        ))}
      </div>
      <ol className="grid grid-cols-4">
        {CHAPTERS.map((chapter, i) => (
          <li key={chapter.id}>
            <a
              href={`#${chapter.id}`}
              aria-current={i === current ? "step" : undefined}
              className={cn(
                "label flex min-h-11 items-center gap-2 pr-2 transition-colors duration-500",
                i === current ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span>{String(i + 1).padStart(2, "0")}</span>
              {/* Four labels do not fit a phone's width: there only the current chapter is named. */}
              <span className={cn("sm:hidden", i !== current && "sr-only")}>{chapter.short}</span>
              <span className="hidden sm:inline">{chapter.name}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";
import { Mark, Wordmark } from "./mark";

const Ctx = createContext(false);

export function usePageRevealed() {
  return useContext(Ctx);
}

type Phase = "far" | "landed" | "right" | "bottom" | "open" | "done";

// Seconds from mount. The sheet spins in folded, lands, opens twice, then lifts away.
const AT = { landed: 0.15, right: 1.5, bottom: 2.25, open: 3.0, done: 3.75 };
const SPIN = AT.right - AT.landed - 0.25;
const OPEN = 0.75;
const OPEN_EASE = [0.6, 0, 0.2, 1] as const;

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.1 0 0 0 0 0.12 0 0 0 0 0.1 0 0 0 0.16 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const order: Phase[] = ["far", "landed", "right", "bottom", "open", "done"];
const after = (phase: Phase, target: Phase) => order.indexOf(phase) >= order.indexOf(target);

export function Newspaper({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("far");
  const [fonts, setFonts] = useState(false);
  const revealed = reduced === true || after(phase, "open");

  useEffect(() => {
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) setFonts(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (reduced || !fonts) return;
    // Lock scrolling on the root, not the body: with `scrollbar-gutter: stable` the
    // gutter stays reserved, so nothing shifts when the scrollbar comes back.
    const root = document.documentElement;
    root.style.overflow = "hidden";
    const timers = (Object.keys(AT) as (keyof typeof AT)[]).map((key) =>
      window.setTimeout(() => {
        setPhase(key);
        if (key === "done") root.style.overflow = "";
      }, AT[key] * 1000),
    );
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      root.style.overflow = "";
    };
  }, [fonts, reduced]);

  const rightOpen = after(phase, "right");
  const bottomOpen = after(phase, "bottom");
  const lifting = after(phase, "open");

  // The folded quarter sits in the sheet's top-left; shift the sheet so whatever is
  // currently unfolded stays centred on screen.
  const shiftX = rightOpen ? 0 : 25;
  const shiftY = bottomOpen ? 0 : 25;
  const sheetTransform =
    phase === "far"
      ? `translate(${shiftX}%, ${shiftY}%) scale(0.12) rotateZ(-540deg)`
      : lifting
        ? "translate(0%, -3%) scale(1.06) rotateZ(0deg)"
        : `translate(${shiftX}%, ${shiftY}%) scale(1) rotateZ(0deg)`;

  return (
    <Ctx.Provider value={revealed}>
      <motion.div
        initial={false}
        animate={{ transform: reduced || lifting ? "scale(1)" : "scale(0.96)" }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className="origin-top"
      >
        {children}
      </motion.div>

      <AnimatePresence>
        {!reduced && phase !== "done" && (
          <motion.div
            aria-hidden
            initial={{ opacity: 1 }}
            animate={{ opacity: lifting ? 0 : 1 }}
            transition={{ duration: AT.done - AT.open, ease: [0.4, 0, 0.6, 1] }}
            className="pointer-events-none fixed inset-0 z-[70] overflow-hidden bg-[#141b17] [perspective:1700px]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(232,226,210,0.14),rgba(0,0,0,0)_60%)]" />

            <motion.div
              initial={{ opacity: 0, transform: sheetTransform, filter: "blur(14px)" }}
              animate={{
                opacity: fonts ? 1 : 0,
                transform: sheetTransform,
                filter: phase === "far" ? "blur(14px)" : "blur(0px)",
              }}
              transition={
                phase === "landed"
                  ? { transform: { duration: SPIN, ease: [0.2, 0.8, 0.2, 1] }, filter: { duration: SPIN * 0.8 }, opacity: { duration: 0.3 } }
                  : lifting
                    ? { transform: { duration: AT.done - AT.open, ease: [0.4, 0, 0.6, 1] } }
                    : { transform: { duration: OPEN, ease: OPEN_EASE } }
              }
              className="absolute inset-0 [transform-style:preserve-3d] will-change-transform"
            >
              {/* Folded panels come first in the DOM so the fixed faces paint over them
                  while they sit flat behind; once open they no longer overlap. */}
              <Fold open={rightOpen} axis="y" className="top-0 left-1/2 h-full w-1/2">
                <Fold open={bottomOpen} axis="x" className="inset-x-0 top-1/2 h-1/2">
                  <Quarter />
                </Fold>
                <div className="absolute inset-x-0 top-0 h-1/2 [transform-style:preserve-3d]">
                  <Quarter />
                </div>
              </Fold>

              <div className="absolute top-0 left-0 h-full w-1/2 [transform-style:preserve-3d]">
                <Fold open={bottomOpen} axis="x" className="inset-x-0 top-1/2 h-1/2">
                  <Quarter />
                </Fold>
                <div className="absolute inset-x-0 top-0 h-1/2 [transform-style:preserve-3d]">
                  <Quarter nameplate />
                </div>
              </div>

              <Crease open={rightOpen} className="top-0 left-1/2 h-full w-px" />
              <Crease open={bottomOpen} className="top-1/2 left-0 h-px w-full" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  );
}

// A hinged panel: folded flat behind its neighbour, then swung open on the crease.
function Fold({
  open,
  axis,
  className,
  children,
}: {
  open: boolean;
  axis: "x" | "y";
  className: string;
  children: React.ReactNode;
}) {
  const closed = axis === "y" ? "rotateY(180deg) translateZ(6px)" : "rotateX(-180deg) translateZ(6px)";
  return (
    <motion.div
      initial={false}
      animate={{ transform: open ? `rotate${axis.toUpperCase()}(0deg) translateZ(0px)` : closed }}
      transition={{ duration: OPEN, ease: OPEN_EASE }}
      className={cn(
        "absolute [transform-style:preserve-3d] will-change-transform",
        axis === "y" ? "origin-left" : "origin-top",
        className,
      )}
    >
      {children}
      <motion.div
        initial={false}
        animate={{ opacity: open ? 0 : 1 }}
        transition={{ duration: OPEN * 0.8, ease: "easeOut" }}
        className={cn(
          "pointer-events-none absolute inset-0 [backface-visibility:hidden]",
          axis === "y"
            ? "bg-[linear-gradient(to_right,rgba(0,0,0,0.42),rgba(0,0,0,0)_55%)]"
            : "bg-[linear-gradient(to_bottom,rgba(0,0,0,0.42),rgba(0,0,0,0)_55%)]",
        )}
      />
    </motion.div>
  );
}

// One quarter of the sheet: paper front, paper back, and the nameplate on the folded face.
function Quarter({ nameplate = false }: { nameplate?: boolean }) {
  return (
    <div className="absolute inset-0 [transform-style:preserve-3d]">
      <div className="absolute inset-0 overflow-hidden bg-[#eceae3] [backface-visibility:hidden]">
        <div className="absolute inset-0 opacity-60" style={{ backgroundImage: GRAIN }} />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.28),rgba(255,255,255,0)_45%,rgba(0,0,0,0.05))]" />
        {nameplate ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-[#182019] sm:gap-4">
            <Mark className="size-9 sm:size-12" />
            <Wordmark className="text-[clamp(1.3rem,4.6vw,3.4rem)]" />
            <p className="label text-[#5e665f] sm:tracking-[0.24em]">Portland · since 2009</p>
            <span className="mt-1 h-[5px] w-24 border-y border-[#182019] sm:w-40" />
          </div>
        ) : (
          <div className="absolute inset-x-[12%] inset-y-[14%] opacity-[0.14] [background:repeating-linear-gradient(0deg,#182019_0_1px,transparent_1px_10px)]" />
        )}
      </div>
      <div className="absolute inset-0 bg-[#e6e2d8] [backface-visibility:hidden] [transform:rotateY(180deg)]">
        <div className="absolute inset-0 opacity-70" style={{ backgroundImage: GRAIN }} />
        <div className="absolute inset-[12%] opacity-[0.07] [background:repeating-linear-gradient(0deg,#182019_0_1px,transparent_1px_10px)]" />
      </div>
    </div>
  );
}

function Crease({ open, className }: { open: boolean; className: string }) {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: open ? 0.18 : 0 }}
      transition={{ duration: OPEN, ease: "easeOut" }}
      className={cn("pointer-events-none absolute bg-[#182019] [backface-visibility:hidden]", className)}
    />
  );
}

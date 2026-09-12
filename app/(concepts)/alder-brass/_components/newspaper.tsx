"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { Mark, Wordmark } from "./mark";

const Ctx = createContext(false);

export function usePageRevealed() {
  return useContext(Ctx);
}

const HOLD = 0.9;
const TURN = 1.5;

// The site arrives under a printed sheet that is turned away like the front
// page of a paper. Entrances elsewhere wait for `usePageRevealed`.
export function Newspaper({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<"hold" | "turn" | "done">("hold");
  const [fonts, setFonts] = useState(false);
  const revealed = reduced === true || phase !== "hold";

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
    if (reduced) return;
    if (!fonts) return;
    document.body.style.overflow = "hidden";
    const turn = window.setTimeout(() => setPhase("turn"), HOLD * 1000);
    const done = window.setTimeout(() => {
      setPhase("done");
      document.body.style.overflow = "";
    }, (HOLD + TURN) * 1000);
    return () => {
      window.clearTimeout(turn);
      window.clearTimeout(done);
      document.body.style.overflow = "";
    };
  }, [fonts, reduced]);

  return (
    <Ctx.Provider value={revealed}>
      {children}
      <AnimatePresence>
        {!reduced && phase !== "done" && (
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 z-[70] overflow-hidden [perspective:2200px] [perspective-origin:50%_50%]"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: phase === "turn" ? 0 : 0.45 }}
              transition={{ duration: phase === "turn" ? TURN * 0.7 : 0.4, ease: "easeOut" }}
              className="absolute inset-0 bg-[#182019]"
            />
            <motion.div
              initial={{ transform: "rotateY(0deg)" }}
              animate={{ transform: phase === "turn" ? "rotateY(-168deg)" : "rotateY(0deg)" }}
              transition={{ duration: TURN, ease: [0.7, 0, 0.2, 1] }}
              className="absolute inset-0 origin-left [transform-style:preserve-3d] will-change-transform"
            >
              <Sheet fonts={fonts} />
              <div className="absolute inset-0 bg-[#e6e2d8] [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <div className="absolute inset-0 opacity-[0.07] [background:repeating-linear-gradient(0deg,#182019_0_1px,transparent_1px_9px)]" />
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: phase === "turn" ? 0.35 : 0 }}
                transition={{ duration: TURN * 0.5, ease: "easeIn" }}
                className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.5),rgba(0,0,0,0)_45%)] [backface-visibility:hidden]"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  );
}

// The front page: masthead, date line, and columns of grey type.
function Sheet({ fonts }: { fonts: boolean }) {
  const column =
    "h-full flex-1 opacity-[0.16] [background:repeating-linear-gradient(0deg,#182019_0_2px,transparent_2px_11px)]";
  return (
    <div className="absolute inset-0 flex flex-col bg-[#eceae3] text-[#182019] [backface-visibility:hidden]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: fonts ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto flex w-full max-w-[80rem] flex-1 flex-col px-5 sm:px-8 lg:px-10 2xl:max-w-[100rem] 2xl:px-14"
      >
        <div className="label flex justify-between border-b border-current pt-5 pb-3 text-[#5e665f] sm:pt-6">
          <span>Vol. XVII · No. 41</span>
          <span className="hidden sm:inline">Portland, Oregon · Friday morning</span>
          <span>Free with a cup</span>
        </div>
        <div className="flex flex-col items-center pt-8 text-center sm:pt-12">
          <Mark className="size-10 sm:size-12" />
          <Wordmark className="mt-4 text-[clamp(1.9rem,7.4vw,4.9rem)] 2xl:text-[6rem]" />
          <p className="label mt-3 text-[#5e665f] sm:mt-4 sm:tracking-[0.24em]">
            Coffee house &amp; roastery · since 2009
          </p>
          <div className="mt-5 h-[5px] w-full border-y border-current" />
        </div>
        <div className="flex flex-1 gap-8 py-8 sm:gap-12 sm:py-10">
          <div className={column} />
          <div className="hidden sm:block h-full flex-[1.4] border border-current" />
          <div className={column} />
          <div className="hidden lg:block h-full flex-1 opacity-[0.16] [background:repeating-linear-gradient(0deg,#182019_0_2px,transparent_2px_11px)]" />
        </div>
      </motion.div>
    </div>
  );
}

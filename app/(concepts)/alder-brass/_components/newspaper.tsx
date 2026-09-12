"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { Mark, Wordmark } from "./mark";
import { IMAGES, LOTS, MENU, TIMELINE } from "../_lib/content";

const Ctx = createContext(false);

export function usePageRevealed() {
  return useContext(Ctx);
}

type Phase = "lay" | "hold" | "peek" | "turn" | "done";

const AT = { hold: 0.7, peek: 1.7, turn: 2.25, done: 4.0 };
const TURN = AT.done - AT.turn;
const TURN_EASE = [0.65, 0, 0.25, 1] as const;

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.1 0 0 0 0 0.12 0 0 0 0 0.1 0 0 0 0.18 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

// The site sits under a printed front page. The sheet is laid down, a corner is
// lifted, and the page is turned away. Entrances elsewhere wait for `usePageRevealed`.
export function Newspaper({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("lay");
  const [fonts, setFonts] = useState(false);
  const revealed = reduced === true || phase === "turn" || phase === "done";
  const turning = phase === "turn" || phase === "done";

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

  const sheet = {
    lay: "translateX(0px) rotateY(0deg) rotateZ(0deg)",
    hold: "translateX(0px) rotateY(0deg) rotateZ(0deg)",
    peek: "translateX(0px) rotateY(-14deg) rotateZ(0deg)",
    turn: "translateX(-6%) rotateY(-176deg) rotateZ(-3deg)",
    done: "translateX(-6%) rotateY(-176deg) rotateZ(-3deg)",
  }[phase];

  return (
    <Ctx.Provider value={revealed}>
      <motion.div
        initial={false}
        animate={{ transform: reduced || turning ? "scale(1)" : "scale(0.965)" }}
        transition={{ duration: TURN * 0.9, ease: TURN_EASE }}
        className="origin-top"
      >
        {children}
      </motion.div>

      <AnimatePresence>
        {!reduced && phase !== "done" && (
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 z-[70] overflow-hidden [perspective:1800px] [perspective-origin:20%_50%]"
          >
            <motion.div
              initial={{ opacity: 0.55 }}
              animate={{ opacity: turning ? 0 : 0.55 }}
              transition={{ duration: TURN * 0.8, ease: "easeOut" }}
              className="absolute inset-0 bg-[#141b17]"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: turning ? 0.5 : 0 }}
              transition={{ duration: TURN * 0.45, ease: "easeIn" }}
              className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.55),rgba(0,0,0,0)_38%)]"
            />

            <motion.div
              initial={{ opacity: 0, transform: "translateX(0px) rotateY(0deg) rotateZ(0deg) scale(1.015)" }}
              animate={{ opacity: phase === "turn" ? [1, 1, 0] : 1, transform: `${sheet} scale(1)` }}
              transition={
                phase === "lay"
                  ? { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
                  : phase === "peek"
                    ? { type: "spring", stiffness: 140, damping: 14, mass: 0.9 }
                    : { transform: { duration: TURN, ease: TURN_EASE }, opacity: { duration: TURN, times: [0, 0.82, 1] } }
              }
              className="absolute inset-0 origin-left [transform-style:preserve-3d] will-change-transform"
            >
              <Sheet fonts={fonts} />
              <div className="absolute inset-0 bg-[#e8e4da] [backface-visibility:hidden] [transform:rotateY(180deg)]">
                <div className="absolute inset-0 opacity-[0.08] [background:repeating-linear-gradient(0deg,#182019_0_1px,transparent_1px_9px)]" />
                <div className="absolute inset-0 opacity-70" style={{ backgroundImage: GRAIN }} />
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: turning ? 0.55 : phase === "peek" ? 0.12 : 0 }}
                transition={{ duration: phase === "peek" ? 0.4 : TURN * 0.5, ease: "easeIn" }}
                className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0)_30%,rgba(0,0,0,0.5))] [backface-visibility:hidden]"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  );
}

const NOTES_COLUMN = [
  ...TIMELINE.map((t) => `${t.year}. ${t.text}`),
  ...LOTS.map((l) => `No. ${l.no}, ${l.origin}. ${l.process}, ${l.altitude}. In the cup: ${l.cup}.`),
];
const COUNTER_COLUMN = MENU.flatMap((g) => g.items.map((i) => `${i.name}, ${i.price}${i.desc ? `. ${i.desc}` : ""}.`));

// The front page: dateline, masthead, a headline, a photograph and the day's columns.
function Sheet({ fonts }: { fonts: boolean }) {
  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden bg-[#eceae3] text-[#182019] [backface-visibility:hidden]">
      <div className="pointer-events-none absolute inset-0 opacity-60" style={{ backgroundImage: GRAIN }} />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.35),rgba(255,255,255,0)_40%,rgba(0,0,0,0.05))]" />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: fonts ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        className="relative mx-auto flex w-full max-w-[80rem] flex-1 flex-col px-5 sm:px-8 lg:px-10 2xl:max-w-[100rem] 2xl:px-14"
      >
        <div className="label flex justify-between border-b border-current pt-5 pb-3 text-[#5e665f] sm:pt-6">
          <span>Vol. XVII · No. 41</span>
          <span className="hidden sm:inline">Portland, Oregon · Friday morning</span>
          <span>Free with a cup</span>
        </div>

        <div className="flex flex-col items-center pt-6 text-center sm:pt-9">
          <Mark className="size-9 sm:size-11" />
          <Wordmark className="mt-3 text-[clamp(1.9rem,7.4vw,4.9rem)] 2xl:text-[6rem]" />
          <p className="label mt-3 text-[#5e665f] sm:tracking-[0.24em]">
            Coffee house &amp; roastery · since 2009 · low sun, 11°
          </p>
          <div className="mt-4 h-[5px] w-full border-y border-current" />
        </div>

        <div className="grid flex-1 grid-cols-1 gap-x-8 gap-y-6 pt-6 sm:grid-cols-[1.2fr_1fr] sm:pt-8 lg:grid-cols-[1.25fr_1fr_0.8fr] lg:gap-x-10">
          <div className="min-w-0">
            <h2 className="poster text-[clamp(1.6rem,4.2vw,3rem)] leading-[1.02] font-medium tracking-[0.04em] uppercase 2xl:text-[3.6rem]">
              The first batch is out.
            </h2>
            <p className="mt-3 max-w-[48ch] font-heading text-[0.95rem] italic text-[#5e665f] sm:text-base 2xl:text-[1.35rem]">
              Twelve kilos of Huila, roasted by ear at a quarter past seven. Cups from seven, bags from Friday.
            </p>
            <div className="mt-4 columns-2 gap-6 text-justify text-[0.6rem] leading-[1.55] text-[#182019]/70 sm:text-[0.66rem] 2xl:text-[0.95rem] 2xl:leading-[1.6]">
              {NOTES_COLUMN.map((story) => (
                <p key={story} className="mb-2 break-inside-avoid">
                  {story}
                </p>
              ))}
            </div>
          </div>

          <figure className="m-0 hidden sm:block">
            <div className="border border-current p-1">
              <div className="relative aspect-[4/3] border border-current">
                <Image src={IMAGES.archive.src} alt="" fill sizes="40vw" className="object-cover" priority />
              </div>
            </div>
            <figcaption className="mt-2 font-heading text-[0.8rem] italic 2xl:text-[0.95rem]">
              Mara &amp; Tomas behind the new counter, opening day, 2009.
            </figcaption>
            <div className="mt-4 text-justify text-[0.66rem] leading-[1.55] text-[#182019]/70 2xl:text-[0.95rem] 2xl:leading-[1.6]">
              {COUNTER_COLUMN.slice(0, 7).map((story) => (
                <p key={story} className="mb-2">
                  {story}
                </p>
              ))}
            </div>
          </figure>

          <div className="hidden min-w-0 lg:block">
            <p className="label border-b border-current pb-2 text-[#5e665f]">On the counter today</p>
            <div className="mt-3 text-[0.66rem] leading-[1.55] text-[#182019]/70 2xl:text-[0.95rem] 2xl:leading-[1.6]">
              {COUNTER_COLUMN.slice(7).map((story) => (
                <p key={story} className="mb-2 border-b border-dotted border-[#182019]/25 pb-1.5">
                  {story}
                </p>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(to_top,#eceae3,rgba(236,234,227,0))]" />
    </div>
  );
}

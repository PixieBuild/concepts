"use client";

import { useRef, useState } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "motion/react";

import { COMPANY, HERO, ROUTE, TERMS } from "../_lib/content";
import { TerrainClient } from "./terrain.client";

const OUT = [0.22, 1, 0.36, 1] as const;
const between = (v: number, from: number, to: number) => Math.min(1, Math.max(0, (v - from) / (to - from)));
const metres = (value: number) => `${String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} m`;

// The camera walks the route between 18% and 72% of the track; the readout follows it.
const altitudeAt = (p: number) => {
  const walked = between(p, 0.18, 0.72) * (ROUTE.length - 1);
  const index = Math.min(ROUTE.length - 2, Math.floor(walked));
  const t = walked - index;
  return ROUTE[index].altitude + (ROUTE[index + 1].altitude - ROUTE[index].altitude) * t;
};

export function Stage() {
  const track = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const { scrollYProgress: p } = useScroll({ target: track, offset: ["start start", "end end"] });

  const openingOpacity = useTransform(p, (v) => 1 - between(v, 0.08, 0.2));
  const openingShift = useTransform(p, (v) => `translateY(${-40 * between(v, 0.08, 0.22)}px)`);
  const captionOpacity = useTransform(p, (v) => between(v, 0.2, 0.28) * (1 - between(v, 0.78, 0.88)));
  const readout = useTransform(p, (v) => metres(altitudeAt(v)));
  const rail = useTransform(p, (v) => `scaleY(${between(v, 0.18, 0.72)})`);

  useMotionValueEvent(p, "change", (v) => {
    const walked = Math.round(between(v, 0.18, 0.72) * (ROUTE.length - 1));
    setStep((current) => (current === walked ? current : walked));
  });

  const waypoint = ROUTE[step];

  return (
    <section ref={track} className="relative h-[400svh] bg-[#070c14]">
      <div className="sticky top-0 h-svh overflow-hidden">
        <TerrainClient progress={p} />

        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(185deg,rgba(7,12,20,0.7)_0%,rgba(7,12,20,0.44)_40%,rgba(7,12,20,0.12)_70%,rgba(7,12,20,0)_100%)] lg:bg-[linear-gradient(100deg,rgba(7,12,20,0.9)_0%,rgba(7,12,20,0.64)_30%,rgba(7,12,20,0.2)_56%,rgba(7,12,20,0)_78%)]" />

        {/* The slanted veil clears the foot of the screen, where the caption and altimeter sit on small viewports. */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[48svh] bg-[linear-gradient(to_top,rgba(7,12,20,0.86)_0%,rgba(7,12,20,0.48)_45%,rgba(7,12,20,0)_100%)] lg:hidden" />

        <motion.div
          style={{ opacity: openingOpacity, transform: openingShift }}
          className="absolute inset-x-6 top-1/2 max-w-[46rem] -translate-y-1/2 sm:inset-x-10 lg:inset-x-14"
        >
          <motion.h1
            initial={{ opacity: 0, transform: "translateY(18px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            transition={{ duration: reduced ? 0 : 1.1, delay: reduced ? 0 : 0.35, ease: OUT }}
            className="flex flex-col"
          >
            <span className="w-expanded text-[clamp(3.1rem,7.2vw,7.6rem)] leading-[0.9] font-black tracking-[-0.038em] text-white">
              {HERO.lead}
            </span>
            <span className="w-condensed mt-2 text-[clamp(1.7rem,3.5vw,3.6rem)] leading-[1] font-light tracking-[-0.01em] text-(--glacier)">
              {HERO.trail}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduced ? 0 : 1, delay: reduced ? 0 : 0.5, ease: OUT }}
            className="data mt-5 flex items-center gap-3 text-[0.82rem] text-white/60"
          >
            <span aria-hidden className="h-px w-8 bg-(--hazard)" />
            {HERO.place}
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduced ? 0 : 1, delay: reduced ? 0 : 0.6, ease: OUT }}
            className="mt-7 max-w-[44ch] text-[1.06rem] leading-[1.6] text-white/75"
          >
            {HERO.standfirst}
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduced ? 0 : 1, delay: reduced ? 0 : 0.8, ease: OUT }}
            className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-3"
          >
            <a
              href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}
              className="bg-(--hazard) px-7 py-4 text-[0.98rem] font-medium text-white transition-colors hover:bg-white hover:text-(--ink)"
            >
              {HERO.primary}
            </a>
            <a href="#objectives" className="border-b border-white/70 pb-1 text-[0.98rem] text-white">
              {HERO.secondary}
            </a>
          </motion.div>

          <motion.dl
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduced ? 0 : 1, delay: reduced ? 0 : 1, ease: OUT }}
            className="mt-12 hidden gap-x-10 border-t border-white/15 pt-6 sm:flex"
          >
            {TERMS.slice(0, 3).map((term) => (
              <div key={term.label}>
                <dt className="data text-[1.45rem] leading-none font-semibold text-white">
                  {term.value}
                  {term.unit && <span className="w-condensed ml-1.5 text-[0.78rem] font-medium text-white/55">{term.unit}</span>}
                </dt>
                <dd className="w-condensed mt-2 max-w-[18ch] text-[0.82rem] leading-snug text-white/55">{term.label}</dd>
              </div>
            ))}
          </motion.dl>
        </motion.div>

        <motion.div style={{ opacity: captionOpacity }} className="absolute inset-x-6 bottom-28 max-w-[34rem] sm:inset-x-10 sm:bottom-12 lg:inset-x-14">
          <p className="data text-[0.92rem] text-(--hazard)">{waypoint.at}</p>
          <p className="w-expanded mt-2 text-[clamp(1.4rem,2.4vw,2.1rem)] leading-[1.08] font-semibold text-white">{waypoint.place}</p>
          <p className="mt-3 max-w-[46ch] text-[1rem] leading-relaxed text-white/70">{waypoint.note}</p>
        </motion.div>

        <motion.div
          style={{ opacity: openingOpacity }}
          className="absolute inset-x-0 bottom-9 hidden justify-center lg:flex"
        >
          <span className="w-condensed flex flex-col items-center gap-3 text-[0.78rem] text-white/55">
            Scroll to climb
            <span aria-hidden className="h-10 w-px bg-white/30" />
          </span>
        </motion.div>

        <div className="absolute right-6 bottom-8 flex items-end gap-5 text-right sm:right-10 sm:bottom-10 lg:right-14">
          <div>
            <motion.p className="data text-[clamp(1.9rem,3.6vw,3.2rem)] leading-[0.85] font-semibold text-white">{readout}</motion.p>
            <p className="w-condensed mt-2 text-[0.85rem] text-white/55">Mont Blanc by the Goûter</p>
          </div>
          <div className="relative hidden h-[22vh] w-px bg-white/20 sm:block">
            <motion.span style={{ transform: rail }} className="absolute inset-0 origin-bottom bg-(--hazard)" />
          </div>
        </div>
      </div>
    </section>
  );
}

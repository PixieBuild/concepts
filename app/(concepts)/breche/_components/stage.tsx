"use client";

import { useEffect, useRef, useState } from "react";
import { preload } from "react-dom";
import { motion, useInView, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "motion/react";

import "./hero-motion.css";
import { CHAPTERS, INK_FROM, OPENING_END, altitudeAt, captionAt, chapterAt, type Moment } from "../_lib/chapters";
import { COMPANY, HERO, ROUTE, TERRAIN } from "../_lib/content";
import { between, metres, smooth, telHref } from "../_lib/format";
import { onAnchorClick } from "../_lib/scroll";
import { TerrainClient } from "./terrain.client";

const FLOOR = 1000;
const TOP = ROUTE[ROUTE.length - 1].altitude;
const share = (altitude: number) => (altitude - FLOOR) / (TOP - FLOOR);
const SUMMIT = ROUTE[ROUTE.length - 1];
const POSTCARD = {
  at: `${SUMMIT.at} · Mont Blanc, from the north`,
  kicker: "The same dome you will point at from the office window.",
};
const HANDOFF = {
  line: "Half of this job is knowing when to turn round.",
  cue: "Back down to the office",
};
const POSTCARD_INDEX = CHAPTERS.findIndex((chapter) => chapter.id === "postcard");
const HANDOFF_INDEX = CHAPTERS.length - 1;
/** The page's own copy waits this long for the first terrain frame before entering regardless. */
const SCENE_WAIT = 3500;

/** The hero's type and instruments share the page's centred column, so they line up with the header and every section. */
const shell = "pointer-events-none absolute inset-0 mx-auto max-w-[104rem]";
const gutters = "inset-x-6 sm:inset-x-10 lg:inset-x-14";
const textBlock = `absolute ${gutters} top-[clamp(5rem,16svh,11rem)]`;
/** Between the top bar and the instrument band; on a phone, the sky above the massif. */
const openingSpace = `absolute ${gutters} top-18 bottom-[46svh] flex flex-col sm:top-[clamp(5rem,12svh,9rem)] sm:bottom-[clamp(5rem,12svh,9rem)] [@media(max-height:480px)]:bottom-14`;
const band = "absolute inset-x-6 bottom-6 sm:right-20 sm:left-10 sm:bottom-[clamp(1.75rem,6svh,3.5rem)] lg:left-14 min-[1800px]:right-14";
/** Captions sit on open sky that brightens through the dawn chapters; an ink halo keeps every glyph's edge. */
const halo = "[text-shadow:0_0_2px_rgba(15,23,36,0.6),0_0_18px_rgba(15,23,36,0.7)]";

function Caption({ chapter }: { chapter: number }) {
  const { id, waypoint } = CHAPTERS[chapter];
  if (id === "postcard") {
    return (
      <div className={`max-w-136 ${halo}`}>
        <p className="data flex items-center gap-3 text-white">
          <span aria-hidden className="tick" />
          {POSTCARD.at}
        </p>
        <p className="hero-summit mt-4 text-white">{metres(SUMMIT.altitude)}</p>
        <p className="body mt-4 max-w-[36ch] text-white [@media(max-height:480px)]:hidden">{POSTCARD.kicker}</p>
      </div>
    );
  }
  if (waypoint === null) return null;
  const stop = ROUTE[waypoint];
  return (
    <div className={`max-w-136 ${halo}`}>
      <p className="data flex items-center gap-3 text-white">
        <span aria-hidden className="tick" />
        {stop.at}
      </p>
      <p className="display-3 mt-3 text-white">{stop.place}</p>
      <p className="body mt-3 max-w-[40ch] text-white [@media(max-height:480px)]:hidden">{stop.note}</p>
    </div>
  );
}

export function Stage({ snowLine }: { snowLine: number }) {
  preload(TERRAIN.file, { as: "fetch", crossOrigin: "anonymous" });

  const track = useRef<HTMLElement>(null);
  const reduced = useReducedMotion() ?? false;
  const running = useInView(track);
  const { scrollYProgress: p } = useScroll({
    target: track,
    offset: ["start start", "end end"],
  });
  const [moment] = useState<Moment>(() => ({ from: 0, to: 0, t: 0, drift: 0 }));
  const [caption, setCaption] = useState(0);
  const [openingLive, setOpeningLive] = useState(true);
  const [sceneReady, setSceneReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSceneReady(true), SCENE_WAIT);
    return () => window.clearTimeout(timer);
  }, []);

  // Under reduced motion the camera cuts to the nearest held shot, so the instruments read that shot too.
  const shown = (v: number) => {
    const m = chapterAt(v, moment);
    if (!reduced) return m;
    const nearest = m.t < 0.5 ? m.from : m.to;
    m.from = nearest;
    m.to = nearest;
    m.t = 0;
    return m;
  };
  const visible = (v: number, index: number) => {
    const c = captionAt(chapterAt(v, moment));
    return c.chapter === index ? c.opacity : 0;
  };

  const openingOpacity = useTransform(p, (v) => 1 - between(v, CHAPTERS[0].hold[1], OPENING_END));
  const openingShift = useTransform(p, (v) => `translateY(${(-32 * between(v, CHAPTERS[0].hold[1], OPENING_END)).toFixed(2)}px)`);
  const promptOpacity = useTransform(p, (v) => 1 - between(v, 0.002, 0.02));
  const captionOpacity = useTransform(p, (v) => {
    const c = captionAt(chapterAt(v, moment));
    return c.chapter === HANDOFF_INDEX ? 0 : c.opacity;
  });
  const captionShift = useTransform(captionOpacity, (o) => `translateY(${((1 - o) * 12).toFixed(2)}px)`);
  const handoffOpacity = useTransform(p, (v) => visible(v, HANDOFF_INDEX));
  const handoffShift = useTransform(handoffOpacity, (o) => `translateY(${((1 - o) * 18).toFixed(2)}px)`);
  // Past the summit the ink rises and the altimeter runs back down to the office, where the page continues.
  const altitude = useTransform(p, (v) => {
    const high = altitudeAt(shown(v));
    return high + (COMPANY.geo.altitude - high) * smooth(between(v, INK_FROM, 1));
  });
  const readout = useTransform(altitude, (a) => metres(a));
  const readoutOpacity = useTransform(p, (v) => 1 - visible(v, POSTCARD_INDEX));
  const railUp = useTransform(altitude, (a) => `scaleY(${share(a).toFixed(4)})`);
  const railAcross = useTransform(altitude, (a) => `scaleX(${share(a).toFixed(4)})`);
  const ink = useTransform(p, (v) => between(v, INK_FROM, 0.97));

  useMotionValueEvent(p, "change", (v) => {
    const next = captionAt(chapterAt(v, moment)).chapter;
    setCaption((current) => (current === next ? current : next));
    setOpeningLive(v < OPENING_END);
  });

  const [lead, ...rest] = HERO.lead.split(" ");
  const handoffLive = caption === HANDOFF_INDEX;

  return (
    <section ref={track} aria-labelledby="climb-title" className="relative h-[500svh] bg-(--ink)">
      <div data-scene={sceneReady ? "ready" : "loading"} className="hero-sky sticky top-0 h-svh overflow-hidden">
        <TerrainClient snowLine={snowLine} progress={p} reduced={reduced} running={running} onReady={() => setSceneReady(true)} />

        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(130%_100%_at_50%_45%,transparent_55%,rgba(15,23,36,0.42)_100%)]" />

        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[clamp(10rem,32svh,22rem)] bg-[linear-gradient(to_top,rgba(15,23,36,0.62),rgba(15,23,36,0.28)_45%,rgba(15,23,36,0))]"
        />
        <motion.div aria-hidden style={{ opacity: openingOpacity }} className="hero-pool pointer-events-none absolute inset-0" />

        <motion.div
          aria-hidden
          style={{ opacity: ink }}
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,var(--ink)_0%,var(--ink)_30%,rgba(15,23,36,0.82)_46%,rgba(15,23,36,0.35)_64%,rgba(15,23,36,0.1)_100%)]"
        />

        <div className={shell}>
          <div className={openingSpace}>
            <motion.div style={{ opacity: openingOpacity, transform: openingShift }} className="pointer-events-auto my-auto max-w-184">
              <h1 id="climb-title" className="text-white">
                <span className="display-1 block">
                  <span className="mt-[-0.1em] block overflow-hidden pt-[0.1em]">
                    <span className="hero-rise block">{lead}</span>
                  </span>{" "}
                  <span className="mt-[-0.1em] block overflow-hidden pt-[0.1em]">
                    <span className="hero-rise block [animation-delay:90ms]">{rest.join(" ")}</span>
                  </span>
                </span>{" "}
                <span className="display-1-trail mt-2 block overflow-hidden pb-[0.08em] text-(--glacier)">
                  <span className="hero-rise block [animation-delay:220ms]">{HERO.trail}</span>
                </span>
              </h1>
              <p className="lead hero-enter mt-5 max-w-[30ch] text-white [animation-delay:560ms] sm:mt-7 [@media(max-height:560px)]:hidden">{HERO.standfirst}</p>
              <div className="hero-enter hero-wait mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 [animation-delay:200ms] [@media(max-height:480px)]:mt-5">
                <a
                  href={telHref(COMPANY.phone)}
                  tabIndex={openingLive ? 0 : -1}
                  className="inline-flex min-h-12 items-center bg-(--signal) px-6 text-[1rem] font-medium text-white transition-colors hover:bg-white hover:text-(--ink)"
                >
                  {HERO.primary}
                </a>
                <a
                  href="#objectives"
                  onClick={onAnchorClick}
                  tabIndex={openingLive ? 0 : -1}
                  className="inline-flex min-h-11 items-center border-b border-white/70 text-[1rem] text-white transition-colors hover:border-(--signal)"
                >
                  {HERO.secondary}
                </a>
              </div>
            </motion.div>
          </div>

          <motion.div aria-hidden={caption === 0 || handoffLive} style={{ opacity: captionOpacity, transform: captionShift }} className={textBlock}>
            <Caption chapter={caption} />
          </motion.div>

          <motion.div
            aria-hidden={!handoffLive}
            style={{ opacity: handoffOpacity, transform: handoffShift }}
            className={`absolute ${gutters} bottom-24 sm:bottom-[calc(clamp(1.75rem,6svh,3.5rem)-0.75rem)] ${handoffLive ? "pointer-events-auto" : ""}`}
          >
            <p className="hero-handoff max-w-[17ch] text-white">{HANDOFF.line}</p>
            <a
              href="#after-hero"
              onClick={onAnchorClick}
              tabIndex={handoffLive ? 0 : -1}
              className="data group mt-6 inline-flex min-h-11 items-center gap-3 text-white/85 transition-colors hover:text-white sm:mt-8"
            >
              <span aria-hidden className="tick transition-[width] duration-300 group-hover:w-8" />
              {HANDOFF.cue} · {metres(COMPANY.geo.altitude)}
              <span aria-hidden>↓</span>
            </a>
          </motion.div>

          <div aria-hidden className={band}>
            <div className="hero-enter hero-wait flex items-baseline justify-between gap-6 [animation-delay:500ms] sm:items-end">
              <motion.p style={{ opacity: promptOpacity }} className="label flex items-end gap-3 text-white [@media(max-height:480px)]:invisible">
                <span className="relative mb-0.5 h-4 w-px overflow-hidden bg-white/25 sm:h-10">
                  <span className="absolute inset-0 bg-white motion-safe:animate-[breche-cue_1.8s_ease-in-out_infinite]" />
                </span>
                Scroll to climb
              </motion.p>

              <div className="flex items-end gap-6">
                <motion.div style={{ opacity: readoutOpacity }} className="text-right">
                  <motion.p className="readout hero-readout text-white">{readout}</motion.p>
                  <p className="label mt-2 hidden text-white sm:block [@media(max-height:480px)]:hidden">Altitude on the Goûter route</p>
                </motion.div>
                <div className="relative hidden h-[clamp(7rem,28svh,15rem)] w-px bg-white/30 sm:block [@media(max-height:480px)]:hidden">
                  <motion.span style={{ transform: railUp }} className="absolute inset-0 origin-bottom bg-(--signal)" />
                  {ROUTE.map((stop) => (
                    <span
                      key={stop.place}
                      className="absolute -left-1.5 h-px w-3 bg-white/80"
                      style={{
                        bottom: `${(share(stop.altitude) * 100).toFixed(2)}%`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="hero-enter hero-wait relative mt-4 h-px bg-white/30 [animation-delay:500ms] sm:hidden">
              <motion.span style={{ transform: railAcross }} className="absolute inset-0 origin-left bg-(--signal)" />
              {ROUTE.map((stop) => (
                <span
                  key={stop.place}
                  className="absolute -top-1.5 h-3 w-px bg-white/80"
                  style={{
                    left: `${(share(stop.altitude) * 100).toFixed(2)}%`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <ol className="sr-only">
        {ROUTE.map((stop) => (
          <li key={stop.place}>
            {stop.at}: {stop.place}, {metres(stop.altitude)}. {stop.note}
          </li>
        ))}
      </ol>
    </section>
  );
}

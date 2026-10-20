"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";

import { Caption } from "./evening/caption";
import { HousePlate } from "./evening/house-plate";
import { Inside } from "./evening/inside";
import { StillInside } from "./evening/still-inside";
import { Grain } from "./evening/grain";
import { createLamps, useLitCount, withId, withoutId, type Lamps } from "./evening/lamps";
import { ACT, band, camera, clamp01, easeInOut, type Geo, type Range } from "./evening/timeline";
import { Shell } from "./section";
import { getRoom } from "@/app/(concepts)/casa-lume/_lib/content";
import { HOUSE, SUITE, TALL_MEDIA, WINDOWS, type HouseWindow } from "@/app/(concepts)/casa-lume/_lib/hero-lights";
import { path } from "@/app/(concepts)/casa-lume/site";

const EASE = [0.16, 1, 0.3, 1] as const;
const LINES = ["Seventeen rooms,", "ninety steps", "above the sea."];
const ALL_LIT = new Set(WINDOWS.map((w) => w.id));

type Phase = "wait" | "ready" | "dusk" | "night";

const GOLDEN_HOLD = 1800;
const SUNSET = 3200;

const noop = () => () => {};

function decode(img: HTMLImageElement | null) {
  return img ? img.decode().catch(() => undefined) : Promise.resolve();
}

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

function useHydrated() {
  return useSyncExternalStore(noop, () => true, () => false);
}

function useEvening(reduced: boolean, progress: MotionValue<number>) {
  const golden = useRef<HTMLImageElement>(null);
  const dusk = useRef<HTMLImageElement>(null);
  const lit = useRef<HTMLImageElement>(null);
  const [phase, setPhase] = useState<Phase>("wait");
  const [typeReady, setTypeReady] = useState(false);
  const [lamps] = useState(createLamps);
  const refs = useMemo(() => ({ golden, dusk, lit }), []);

  const readyAt = useRef(0);

  useEffect(() => {
    if (reduced) return;
    let alive = true;
    // The headline only waits for its font; the photograph gets a little longer before the evening starts anyway.
    Promise.race([document.fonts.ready, wait(600)]).then(() => alive && setTypeReady(true));
    (async () => {
      await Promise.race([Promise.all([document.fonts.ready, decode(golden.current)]), wait(1500)]);
      if (!alive) return;
      readyAt.current = performance.now();
      setPhase("ready");
    })();
    return () => {
      alive = false;
    };
  }, [reduced]);

  // The dusk and lit plates mount with the ready phase; golden hour holds while they decode.
  const started = phase !== "wait";
  useEffect(() => {
    if (reduced || !started) return;
    let alive = true;
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(() => alive && fn(), ms));

    // Someone moving through the house: now and then a lamp goes out and another comes on.
    let away: string | null = null;
    const idle = () => {
      if (!document.hidden && progress.get() < 0.04) {
        if (away) {
          const back = away;
          lamps.update((s) => ({ ...s, off: withoutId(s.off, back), relit: withId(s.relit, back) }));
        }
        const candidates = WINDOWS.filter((w) => w.id !== SUITE.window && w.id !== away);
        const next = candidates[Math.floor(Math.random() * candidates.length)].id;
        away = next;
        later(() => {
          lamps.update((s) => ({ ...s, relit: withoutId(s.relit, next), off: withId(s.off, next) }));
        }, 1400 + Math.random() * 1400);
      }
      later(idle, 8000 + Math.random() * 4000);
    };

    (async () => {
      await Promise.all([decode(dusk.current), decode(lit.current)]);
      if (!alive) return;
      later(() => {
        setPhase("dusk");
        for (const w of WINDOWS) later(() => lamps.update((s) => ({ ...s, on: withId(s.on, w.id) })), w.on * 1000 + 140);
        // Once the sky has turned, the dusk plate drops its mask so the camera moves a plain layer.
        later(() => setPhase("night"), SUNSET + 50);
        later(idle, 10000);
      }, Math.max(0, GOLDEN_HOLD - (performance.now() - readyAt.current)));
    })();

    return () => {
      alive = false;
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [reduced, started, progress, lamps]);

  if (reduced) return { phase: "dusk" as Phase, typeReady: true, lamps, refs };
  return { phase, typeReady, lamps, refs };
}

function useGeometry(stage: React.RefObject<HTMLDivElement | null>, slot: React.RefObject<HTMLDivElement | null>) {
  const geo = useMotionValue<Geo | null>(null);
  const [tall, setTall] = useState(false);

  useEffect(() => {
    const stageEl = stage.current;
    const slotEl = slot.current;
    if (!stageEl || !slotEl) return;
    const query = window.matchMedia(TALL_MEDIA);
    const measure = () => {
      const s = stageEl.getBoundingClientRect();
      const r = slotEl.getBoundingClientRect();
      const isTall = query.matches;
      const img = isTall ? HOUSE.golden.tall : HOUSE.golden.wide;
      const aspect = img.width / img.height;
      const layerW = Math.max(s.width, s.height * aspect);
      // Budget for 2x screens: past that the extra pixels are not visible at reading distance.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      geo.set({
        width: s.width,
        height: s.height,
        tall: isTall,
        slot: { l: r.left - s.left, t: r.top - s.top, r: r.right - s.left, b: r.bottom - s.top },
        layerW,
        layerH: layerW / aspect,
        zoom: Math.min(1.6, Math.max(1, img.width / (layerW * dpr))),
      });
      setTall(isTall);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stageEl);
    observer.observe(slotEl);
    query.addEventListener("change", measure);
    return () => {
      observer.disconnect();
      query.removeEventListener("change", measure);
    };
  }, [geo, stage, slot]);

  return { geo, tall };
}

export function Hero() {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const slot = useRef<HTMLDivElement>(null);
  const pointer = useRef<string>("mouse");
  // Reduced motion is only known on the client, so it applies from the first render after hydration.
  const hydrated = useHydrated();
  const reduced = useReducedMotion() === true && hydrated;

  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  const progress = useTransform(scrollYProgress, (v) => (reduced ? 0 : clamp01(v)));
  const { geo, tall } = useGeometry(stage, slot);
  const evening = useEvening(reduced, progress);

  const [hover, setHoverState] = useState<HouseWindow | null>(null);
  const hoverAt = useRef(0);
  const hoverClear = useRef(0);
  const setHover = useCallback(
    (w: HouseWindow | null) => {
      window.clearTimeout(hoverClear.current);
      hoverAt.current = progress.get();
      setHoverState(w);
    },
    [progress],
  );
  // Leaving a window keeps its preview a moment, so the pointer can travel to the caption's link.
  const releaseHover = useCallback(() => {
    window.clearTimeout(hoverClear.current);
    hoverClear.current = window.setTimeout(() => setHoverState(null), 400);
  }, []);
  const holdHover = useCallback(() => window.clearTimeout(hoverClear.current), []);
  useEffect(() => () => window.clearTimeout(hoverClear.current), []);
  const [pinned, setPinned] = useState<HouseWindow | null>(null);
  const [focusRoom, setFocusRoom] = useState<string | null>(null);

  // The act lives in the caption and the window targets; the hero itself only drops a chosen window once it is past them.
  useMotionValueEvent(progress, "change", (p) => {
    if (reduced) return;
    if (p >= ACT.interactive && (hover || pinned)) {
      setHover(null);
      setPinned(null);
    }
    // A mouse hover only survives while the pointer is still; scrolling moves the house out from under it.
    if (hover && Math.abs(p - hoverAt.current) > 0.004) setHover(null);

    // The header steps back while the plate opens under it and returns inverted once the plate is full-bleed.
    const g = geo.get();
    const top = g ? camera(p, g).frame.t : Infinity;
    const room = p < 0.03 ? "false" : top > 1 ? "opening" : "true";
    if (section.current && section.current.dataset.room !== room) section.current.dataset.room = room;
  });

  // Without motion the room sits below the house, so the header inverts while it is under it.
  const still = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = still.current;
    if (!reduced || !el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (section.current) section.current.dataset.room = entry.isIntersecting ? "true" : "false";
      },
      { rootMargin: "0px 0px -92% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reduced]);

  useEffect(() => {
    if (!pinned) return;
    const release = (e: PointerEvent) => {
      const target = e.target as Element;
      if (!target.closest("[data-window-hit]") && !target.closest("[data-preview-link]")) setPinned(null);
    };
    document.addEventListener("pointerdown", release);
    return () => document.removeEventListener("pointerdown", release);
  }, [pinned]);

  const onTap = useCallback(
    (w: HouseWindow, event: React.MouseEvent) => {
      if (pointer.current === "mouse" || event.detail === 0) return;
      if (pinned?.id !== w.id) {
        event.preventDefault();
        setPinned(w);
      }
    },
    [pinned],
  );

  const onReserveFocus = useCallback(() => {
    const el = section.current;
    if (!el || progress.get() >= ACT.ready[1]) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + (ACT.ready[1] + 0.03) * (el.offsetHeight - window.innerHeight) });
  }, [progress]);

  const chosen = pinned ?? hover;
  const previewSlug = chosen?.room ?? focusRoom;
  const previewRoom = previewSlug ? (getRoom(previewSlug) ?? null) : null;

  return (
    <section
      id="hero"
      ref={section}
      data-room="false"
      className="group/hero relative h-[740svh] motion-reduce:h-auto"
    >
      <div
        ref={stage}
        data-evening={evening.phase === "wait" ? undefined : evening.phase}
        className="sticky top-0 h-svh min-h-[34rem] overflow-clip motion-reduce:relative [@media(max-height:32rem)_and_(min-aspect-ratio:4/3)_and_(max-width:63.99rem)]:min-h-0"
        onPointerDownCapture={(e) => {
          pointer.current = e.pointerType;
        }}
      >
        {/* On a landscape phone (short and wide) the copy and the plate sit side by side, as on desktop. */}
        <Shell
          className="pointer-events-none relative z-20 flex h-full flex-col pt-24 sm:pt-28 lg:grid lg:grid-cols-12 lg:gap-x-10 lg:pt-28 [@media(max-height:32rem)_and_(min-aspect-ratio:4/3)_and_(max-width:63.99rem)]:grid [@media(max-height:32rem)_and_(min-aspect-ratio:4/3)_and_(max-width:63.99rem)]:grid-cols-12 [@media(max-height:32rem)_and_(min-aspect-ratio:4/3)_and_(max-width:63.99rem)]:gap-x-8 [@media(max-height:32rem)_and_(min-aspect-ratio:4/3)_and_(max-width:63.99rem)]:pt-20"
        >
          <Copy progress={progress} play={evening.typeReady} lamps={evening.lamps} reduced={reduced} tall={tall} />
          <div
            className="mt-6 flex min-h-0 flex-1 flex-col sm:mt-8 lg:col-span-7 lg:mt-0 lg:h-full [@media(max-height:32rem)_and_(min-aspect-ratio:4/3)_and_(max-width:63.99rem)]:col-span-7 [@media(max-height:32rem)_and_(min-aspect-ratio:4/3)_and_(max-width:63.99rem)]:mt-0 [@media(max-height:32rem)_and_(min-aspect-ratio:4/3)_and_(max-width:63.99rem)]:h-full"
          >
            <div ref={slot} aria-hidden className="min-h-0 flex-1" />
            <Caption
              room={previewRoom}
              progress={progress}
              tall={tall}
              onPreviewEnter={holdHover}
              onPreviewLeave={releaseHover}
              className="h-16 lg:h-[4.5rem] lg:pr-14"
            />
          </div>
        </Shell>

        {/* After the copy in the DOM so the tab order reads headline first; the copy still stacks above it. */}
        <HousePlate
          progress={progress}
          geo={geo}
          tall={tall}
          lamps={evening.lamps}
          hotId={chosen?.id ?? null}
          focusRoom={focusRoom}
          evening={evening.phase !== "wait" || reduced}
          imgRefs={evening.refs}
          onHover={setHover}
          onHoverEnd={releaseHover}
          onFocusRoom={setFocusRoom}
          onTap={onTap}
        />

        <Inside progress={progress} geo={geo} onReserveFocus={onReserveFocus} />
        <Grain progress={progress} geo={geo} />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-[15] h-36 bg-[linear-gradient(to_bottom,rgb(16_11_8/0.45),transparent)] opacity-0 transition-opacity duration-700 ease-out group-data-[room=true]/hero:opacity-100 motion-reduce:hidden"
        />
      </div>

      <StillInside ref={still} />
    </section>
  );
}

const Copy = memo(function Copy({
  progress,
  play,
  lamps,
  reduced,
  tall,
}: {
  progress: MotionValue<number>;
  play: boolean;
  lamps: Lamps;
  reduced: boolean;
  tall: boolean;
}) {
  const fade = useTransform(progress, (p) => 1 - band(p, [0, 0.035]));
  const lift = useTransform(progress, (p) => `translate3d(0, ${(-16 * band(p, [0, 0.04])).toFixed(2)}px, 0)`);
  const shown = play ? 1 : 0;

  return (
    <div className="lg:col-span-5 lg:flex lg:flex-col lg:justify-center lg:pb-24 xl:pr-8 [@media(max-height:32rem)_and_(min-aspect-ratio:4/3)_and_(max-width:63.99rem)]:col-span-5 [@media(max-height:32rem)_and_(min-aspect-ratio:4/3)_and_(max-width:63.99rem)]:flex [@media(max-height:32rem)_and_(min-aspect-ratio:4/3)_and_(max-width:63.99rem)]:flex-col [@media(max-height:32rem)_and_(min-aspect-ratio:4/3)_and_(max-width:63.99rem)]:justify-center [@media(max-height:32rem)_and_(min-aspect-ratio:4/3)_and_(max-width:63.99rem)]:pb-16">
      <motion.div style={{ opacity: fade, transform: lift }} className="[@media(max-height:32rem)_and_(min-aspect-ratio:4/3)_and_(max-width:63.99rem)]:hidden">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: shown }}
          transition={{ duration: reduced ? 0 : 1.1, delay: 0.05, ease: EASE }}
          className="eyebrow flex flex-wrap items-center gap-x-4 gap-y-2.5 text-[0.625rem] text-muted-foreground sm:text-[0.6875rem] lg:flex-nowrap lg:gap-x-3 lg:whitespace-nowrap"
        >
          <span className="hidden sm:inline lg:hidden min-[112rem]:inline">44°08′ N, 9°39′ E</span>
          <span aria-hidden className="hidden h-px w-6 bg-border sm:block lg:hidden min-[112rem]:block" />
          <span>Monterosso, Liguria</span>
          <span aria-hidden className="h-px w-6 bg-border" />
          <span>April to November</span>
        </motion.p>
      </motion.div>

      <h1 className="mt-5 font-heading text-[clamp(2.4rem,min(4.9vw,8.8vh),4.9rem)] leading-[1.04] font-normal tracking-[-0.01em] sm:mt-7 lg:mt-9 [@media(max-height:32rem)_and_(min-aspect-ratio:4/3)_and_(max-width:63.99rem)]:mt-0">
        {LINES.map((line, i) => (
          <HeadlineLine key={line} index={i} progress={progress} play={play} reduced={reduced} tall={tall}>
            {line}
            {i === 0 && <Tally lamps={lamps} reduced={reduced} />}
          </HeadlineLine>
        ))}
      </h1>

      <motion.div style={{ opacity: fade, transform: lift }} className="pointer-events-auto hidden sm:block [@media(max-height:32rem)_and_(min-aspect-ratio:4/3)_and_(max-width:63.99rem)]:hidden!">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: shown }}
          transition={{ duration: reduced ? 0 : 1.1, delay: 0.5, ease: EASE }}
          className="mt-8 flex items-end justify-between gap-10 lg:mt-11 lg:flex-col lg:items-start lg:gap-7"
        >
          <p className="max-w-[23rem] text-[1.0625rem] leading-relaxed text-muted-foreground">
            A family house on the terraces between Monterosso and Punta Mesco. Long lunches, cold water, and nothing
            that needs doing.
          </p>
          <Link
            href={path("/rooms")}
            className="group relative inline-flex shrink-0 items-center gap-3.5 pb-3 text-[0.8125rem] tracking-[0.16em] text-foreground uppercase focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            Enter the house
            <ArrowRight className="size-4 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1.5" />
            <span aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-foreground/25" />
            <span
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-foreground transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
            />
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
});

// Lines leave upward through their own mask, each a beat after the last.
function HeadlineLine({
  children,
  index,
  progress,
  play,
  reduced,
  tall,
}: {
  children: React.ReactNode;
  index: number;
  progress: MotionValue<number>;
  play: boolean;
  reduced: boolean;
  tall: boolean;
}) {
  // On portrait screens the plate rises toward the headline, so every line has gone before its edge arrives.
  const exitBand = (): Range =>
    tall ? [0.002 + index * 0.007, 0.03 + index * 0.007] : [0.006 + index * 0.011, 0.055 + index * 0.011];
  const exit = useTransform(progress, (p) => {
    const k = easeInOut(band(p, exitBand()));
    return `translate3d(0, ${(-175 * k).toFixed(2)}%, 0)`;
  });
  // Fades while it rises, so the comma's low ink never lingers alone in the mask.
  const fade = useTransform(progress, (p) => {
    const [a, b] = exitBand();
    return 1 - band(p, [a + 0.2 * (b - a), a + 0.55 * (b - a)]);
  });

  return (
    <span className="-mb-[0.3em] block overflow-x-visible overflow-y-clip pb-[0.3em]">
      <motion.span style={{ transform: exit, opacity: fade }} className="block will-change-transform">
        <motion.span
          initial={{ transform: "translateY(140%)" }}
          animate={{ transform: play ? "translateY(0%)" : "translateY(140%)" }}
          transition={{ duration: reduced ? 0 : 1.3, delay: reduced ? 0 : 0.1 + index * 0.11, ease: EASE }}
          className="block whitespace-nowrap will-change-transform"
        >
          {children}
        </motion.span>
      </motion.span>
    </span>
  );
}

function Tally({ lamps, reduced }: { lamps: Lamps; reduced: boolean }) {
  const lit = useLitCount(lamps);
  const count = reduced ? ALL_LIT.size : lit;
  return (
    <span
      aria-hidden
      className={`ml-[0.2em] inline-flex items-baseline gap-[0.18em] align-[0.7em] font-heading text-[max(0.3em,0.8125rem)] leading-none tracking-normal text-primary italic transition-opacity duration-700 ${count ? "opacity-100" : "opacity-0"}`}
    >
      <span className="tabular-nums">{String(count).padStart(2, "0")}</span>
      lit
    </span>
  );
}

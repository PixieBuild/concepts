"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  frame,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";

import { cn } from "@/lib/utils";
import { EASE } from "./motion";
import { IMAGES } from "../_lib/content";

type Box = { x: number; y: number; w: number; h: number };
type Flight = { from: Box; to: Box; end: number };

type Slots = {
  from: React.RefObject<HTMLDivElement | null>;
  to: React.RefObject<HTMLDivElement | null>;
  landed: boolean;
  still: boolean;
  steam: MotionValue<number>;
};

const Ctx = createContext<Slots | null>(null);

function useSlots() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("CupOrigin and CupLanding must sit inside CupFlight");
  return ctx;
}

export function useCupLanded() {
  const { landed, still } = useSlots();
  return landed || still;
}

// Two wisps rising off the cup while it rests on the plate.
function Steam({ opacity }: { opacity: MotionValue<number> }) {
  return (
    <motion.span aria-hidden style={{ opacity }} className="pointer-events-none absolute inset-x-0 -top-[22%] h-[46%]">
      <span className="steam steam-a" />
      <span className="steam steam-b" />
    </motion.span>
  );
}

function measure(el: HTMLElement): Box {
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top + window.scrollY, w: r.width, h: r.height };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOut = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

// Until the cutout arrives the stand-in photograph is set as a small round plate,
// in the same double rule as the photographs.
function CupImage({ priority = false }: { priority?: boolean }) {
  return (
    <div
      className={cn(
        "relative size-full",
        !IMAGES.cup.cutout && "rounded-full border border-foreground bg-background p-1.5 sm:p-2",
      )}
    >
      <div
        className={cn(
          "relative size-full",
          !IMAGES.cup.cutout && "overflow-hidden rounded-full border border-foreground",
        )}
      >
        <Image
          src={IMAGES.cup.src}
          alt={IMAGES.cup.alt}
          fill
          priority={priority}
          quality={90}
          sizes="(min-width: 1024px) 30vw, 60vw"
          className={IMAGES.cup.cutout ? "object-contain" : "object-cover"}
        />
      </div>
    </div>
  );
}

// The cup sits in the hero, then rides an absolutely positioned layer down the page
// and hands off to the real slot on the board once it arrives. Absolute, not fixed:
// the page scrolls the flyer natively, so only the flight progress reads the scroll
// value, which runs a frame behind.
export function CupFlight({ children }: { children: React.ReactNode }) {
  const stage = useRef<HTMLDivElement>(null);
  const from = useRef<HTMLDivElement>(null);
  const to = useRef<HTMLDivElement>(null);
  const [flight, setFlight] = useState<Flight | null>(null);
  const [landed, setLanded] = useState(false);
  const reduced = useReducedMotion();
  const still = reduced === true;

  useEffect(() => {
    const s = stage.current;
    const a = from.current;
    const b = to.current;
    if (!s || !a || !b) return;
    const update = () =>
      frame.read(() => {
        const origin = measure(s);
        const f = measure(a);
        const t = measure(b);
        // The cup arrives once its landing slot is vertically centred in the viewport.
        const rest = Math.max(112, (window.innerHeight - t.h) / 2);
        setFlight({
          from: { ...f, x: f.x - origin.x, y: f.y - origin.y },
          to: { ...t, x: t.x - origin.x, y: t.y - origin.y },
          end: Math.max(1, t.y - rest),
        });
      });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(s);
    observer.observe(a);
    observer.observe(b);
    observer.observe(document.body);
    document.fonts.ready.then(update);
    return () => observer.disconnect();
  }, []);

  const { scrollY } = useScroll();
  const progress = useTransform(scrollY, (sy) =>
    flight ? easeInOut(Math.min(1, Math.max(0, sy / flight.end))) : 0,
  );
  const steam = useTransform(progress, [0, 0.12], [1, 0]);
  const stillSteam = useMotionValue(1);
  // One transform string so the compositor interpolates the whole flight as floats.
  const transform = useTransform(progress, (p) => {
    if (!flight) return "translate3d(0px, 0px, 0) scale(1)";
    const x = lerp(flight.from.x, flight.to.x, p);
    const y = lerp(flight.from.y, flight.to.y, p);
    const s = lerp(1, flight.to.w / flight.from.w, p) * (1 + 0.06 * Math.sin(p * Math.PI));
    const r = lerp(-8, 0, p);
    return `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${s.toFixed(4)}) rotate(${r.toFixed(2)}deg)`;
  });

  useMotionValueEvent(progress, "change", (p) => {
    if (p >= 0.995) setLanded(true);
    else if (p < 0.97) setLanded(false);
  });

  return (
    <Ctx.Provider value={{ from, to, landed, still, steam: still ? stillSteam : steam }}>
      <div ref={stage} className="relative">
        {children}
        {!still && (
          <motion.div
            aria-hidden
            style={{
              transform,
              width: flight?.from.w ?? 0,
              height: flight?.from.h ?? 0,
              transformOrigin: "0 0",
              opacity: landed ? 0 : 1,
            }}
            className="pointer-events-none absolute top-0 left-0 z-30 will-change-transform"
          >
            <motion.div
              initial={{ opacity: 0, transform: "scale(0.94)" }}
              animate={{ opacity: flight ? 1 : 0, transform: flight ? "scale(1)" : "scale(0.94)" }}
              transition={{ duration: 1.4, delay: 0.5, ease: EASE }}
              className="size-full"
            >
              <CupImage priority />
              <Steam opacity={steam} />
            </motion.div>
          </motion.div>
        )}
      </div>
    </Ctx.Provider>
  );
}

export function CupOrigin({ className }: { className?: string }) {
  const { from, still, steam } = useSlots();
  return (
    <div ref={from} className={cn("relative", className)}>
      {still && (
        <>
          <CupImage priority />
          <Steam opacity={steam} />
        </>
      )}
    </div>
  );
}

// The cup arrives a touch large and settles onto the saucer.
export function CupLanding({ className }: { className?: string }) {
  const { to, landed, still } = useSlots();
  const reduced = useReducedMotion();
  const shown = landed || still;
  return (
    <div ref={to} className={cn("relative", className)}>
      <motion.div
        className="absolute inset-0"
        style={{ opacity: shown ? 1 : 0 }}
        initial={false}
        animate={{ transform: shown || reduced ? "scale(1)" : "scale(1.035)" }}
        transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 13, mass: 0.9 }}
      >
        <CupImage />
      </motion.div>
    </div>
  );
}

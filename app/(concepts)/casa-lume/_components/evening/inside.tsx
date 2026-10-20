"use client";

import { memo, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useMotionValueEvent, useTransform, type MotionValue } from "motion/react";

import { Shell } from "../section";
import { PlatePicture } from "./plate-picture";
import { RoomKey } from "./room-key";
import {
  ACT,
  apertureBox,
  apertureOf,
  band,
  camera,
  clamp01,
  easeInOut,
  easeOut,
  insetOf,
  suiteBox,
  type Geo,
  type Range,
} from "./timeline";
import { WelcomeCard } from "./welcome-card";
import { formatCurrency } from "@/app/(concepts)/casa-lume/_lib/booking";
import { getRoom } from "@/app/(concepts)/casa-lume/_lib/content";
import { ROOM_NIGHT, SUITE } from "@/app/(concepts)/casa-lume/_lib/hero-lights";
import { path } from "@/app/(concepts)/casa-lume/site";

export const SERVICE_NOTES = [
  { time: "19:30", note: "The boat from Monterosso pier. Marco brings a blanket." },
  { time: "20:00", note: "Prosecco on your terrace, poured as you arrive." },
  { time: "21:00", note: "Turndown. Shutters open, lamps low." },
];

const GLOW: Range = [ACT.aperture[0], ACT.aperture[0] + 0.07];

const suite = getRoom(SUITE.room)!;
export const SUITE_NAME = suite.name;
export const RESERVE_HREF = `${path("/booking")}?room=${suite.slug}`;
export const RESERVE_LABEL = `Reserve ${suite.name}`;
export const RESERVE_PRICE = `from ${formatCurrency(suite.priceFrom)} a night`;

/** Opacity and a vertical drift as a transform string, never Motion's `y`, so text glides. */
function useEnter(progress: MotionValue<number>, enter: Range, leave?: Range, lift = 18) {
  const opacity = useTransform(progress, (p) => {
    const inn = easeOut(band(p, enter));
    return leave ? inn * (1 - band(p, leave)) : inn;
  });
  const transform = useTransform(progress, (p) => {
    const inn = easeOut(band(p, enter));
    const out = leave ? easeInOut(band(p, leave)) : 0;
    return `translate3d(0, ${((1 - inn) * lift - out * lift * 0.6).toFixed(2)}px, 0)`;
  });
  return { opacity, transform };
}

type Props = {
  progress: MotionValue<number>;
  geo: MotionValue<Geo | null>;
  onReserveFocus: () => void;
};

const MOUNT_AT = 0.18;

/** Renders its children once the scroll has passed `at`, so only this leaf re-renders. */
function Reached({ progress, at, children }: { progress: MotionValue<number>; at: number; children: React.ReactNode }) {
  const [reached, setReached] = useState(false);
  useMotionValueEvent(progress, "change", (p) => {
    if (!reached && p > at) setReached(true);
  });
  return reached ? children : null;
}

export const Inside = memo(function Inside({ progress, geo, onReserveFocus }: Props) {
  const clipPath = useTransform(() => {
    // Read before branching: a function transform follows only the values it read when its component last rendered.
    const p = progress.get();
    const g = geo.get();
    return g ? insetOf(apertureBox(p, g), g) : "inset(50%)";
  });
  // The room is solid while the opening is still the window's size; the warm glow carries the arrival.
  const roomOpacity = useTransform(progress, (p) => band(p, [ACT.aperture[0] - 0.012, ACT.aperture[0] + 0.004]));
  const roomVisibility = useTransform(progress, (p) => (p < ACT.aperture[0] - 0.013 ? "hidden" : "visible"));
  const anchor = useRoomAnchor(geo);
  const origin = useTransform(anchor, (a) => (a ? `${a.x.toFixed(1)}px ${a.y.toFixed(1)}px` : "50% 50%"));
  // The room starts with its focus under the window and settles into its own framing as the aperture opens.
  const roomTransform = useTransform(() => {
    const a = anchor.get();
    const k = apertureOf(progress.get());
    const s = 1.18 - 0.18 * k;
    const dx = a ? a.dx * s * (1 - k) : 0;
    const dy = a ? a.dy * s * (1 - k) : 0;
    return `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) scale(${s.toFixed(4)})`;
  });
  const scrim = useTransform(progress, (p) => 0.35 + 0.65 * band(p, ACT.card));
  const glow = useTransform(progress, (p) => 1 - easeOut(band(p, GLOW)));
  const glowDisplay = useTransform(progress, (p) => (p < GLOW[1] ? "block" : "none"));

  const tonight = useEnter(progress, [ACT.tonight[0], ACT.tonight[1]], [ACT.tonight[2], ACT.tonight[3]]);
  const card = useCard(progress);
  const keyLabel = useEnter(progress, [ACT.key[1] - 0.01, ACT.key[1] + 0.03], ACT.notesOut, 8);
  // The key stays through the hand-off but steps back, so the last line owns the frame.
  const keyShade = useTransform(progress, (p) => 0.55 * band(p, ACT.keyDim));
  const keyOpacity = useTransform(progress, (p) => 1 - 0.4 * band(p, ACT.keyDim));
  const notesHead = useEnter(progress, [ACT.notes[0], ACT.notes[0] + 0.035], ACT.notesOut);
  const ready = useEnter(progress, ACT.ready, undefined, 26);
  const reserve = useEnter(progress, [ACT.ready[0] + 0.025, ACT.ready[1] + 0.02], undefined, 14);

  return (
    <>
      <motion.div
        style={tonight}
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 text-background motion-reduce:hidden"
      >
        <Shell className="pb-24 sm:pb-28 lg:pb-32 [@media(max-height:32rem)_and_(min-aspect-ratio:4/3)_and_(max-width:63.99rem)]:pb-8">
          <p className="eyebrow text-background/70">Room {SUITE.number} · the whole top floor</p>
          <p className="mt-5 max-w-[16ch] font-heading text-[clamp(2.1rem,4.2vw,4.25rem)] leading-[1.04] font-light [@media(max-height:32rem)_and_(min-aspect-ratio:4/3)_and_(max-width:63.99rem)]:mt-3 [@media(max-height:32rem)_and_(min-aspect-ratio:4/3)_and_(max-width:63.99rem)]:max-w-[22ch] [@media(max-height:32rem)_and_(min-aspect-ratio:4/3)_and_(max-width:63.99rem)]:text-[clamp(1.75rem,min(4.2vw,10svh),4.25rem)]">
            Tonight, one light stays on for you.
          </p>
        </Shell>
      </motion.div>

      <motion.div
        aria-hidden
        style={{ clipPath, opacity: roomOpacity, visibility: roomVisibility }}
        className="absolute inset-0 z-10 overflow-hidden bg-[oklch(0.2_0.02_60)] will-change-[clip-path] motion-reduce:hidden"
      >
        <motion.div
          style={{ transform: roomTransform, transformOrigin: origin }}
          className="absolute inset-0 will-change-transform"
        >
          <Reached progress={progress} at={MOUNT_AT}>
            <RoomPhoto />
          </Reached>
        </motion.div>
        <motion.div
          style={{ opacity: glow, display: glowDisplay }}
          className="absolute inset-0 bg-[radial-gradient(closest-side,rgb(255_200_140/0.62),rgb(255_170_100/0.4)_60%,rgb(214_124_70/0.26))]"
        />
        <motion.div
          style={{ opacity: scrim }}
          className="absolute inset-0 bg-[linear-gradient(to_top,rgb(16_11_8/0.74),rgb(16_11_8/0.16)_45%,rgb(16_11_8/0.3))] lg:bg-[linear-gradient(90deg,rgb(16_11_8/0.66),rgb(16_11_8/0.12)_48%,rgb(16_11_8/0)_70%),linear-gradient(to_top,rgb(16_11_8/0.5),transparent_40%)]"
        />
      </motion.div>

      <ApertureFrame progress={progress} geo={geo} />

      <div className="pointer-events-none absolute inset-0 z-20 text-background motion-reduce:hidden">
        <div className="relative mx-auto h-full max-w-[100rem]">
          <motion.div
            style={card}
            className="absolute top-[44%] left-1/2 w-[min(84vw,26rem)] -translate-x-1/2 sm:top-[36%] [@media(max-height:720px)_and_(max-width:639px)]:top-[27%] [@media(max-height:720px)_and_(max-width:639px)]:left-5 [@media(max-height:720px)_and_(max-width:639px)]:w-[min(64vw,15.5rem)] [@media(max-height:720px)_and_(max-width:639px)]:translate-x-0 lg:top-[29%] lg:left-12 lg:w-[clamp(20rem,min(30vw,54svh),34rem)] lg:translate-x-0 xl:left-16 2xl:left-24 [@media(max-height:32rem)_and_(min-aspect-ratio:4/3)_and_(max-width:63.99rem)]:top-[22%] [@media(max-height:32rem)_and_(min-aspect-ratio:4/3)_and_(max-width:63.99rem)]:left-[5vw] [@media(max-height:32rem)_and_(min-aspect-ratio:4/3)_and_(max-width:63.99rem)]:w-[min(38vw,62svh)] [@media(max-height:32rem)_and_(min-aspect-ratio:4/3)_and_(max-width:63.99rem)]:translate-x-0"
          >
            <WelcomeCard progress={progress} />
          </motion.div>

          {/* The key emerges below the header, so its cord never crosses the navigation. */}
          <motion.div
            style={{ opacity: keyOpacity }}
            className="absolute top-0 right-[9vw] w-[clamp(5.5rem,25vw,8rem)] [--cord:5.5rem] sm:[--cord:5rem] [@media(max-height:720px)_and_(max-width:639px)]:[--cord:3.5rem] lg:right-[19%] lg:w-[clamp(6rem,min(11.5vw,21svh),15rem)] lg:[--cord:5rem] [@media(max-height:32rem)_and_(min-aspect-ratio:4/3)_and_(max-width:63.99rem)]:right-auto [@media(max-height:32rem)_and_(min-aspect-ratio:4/3)_and_(max-width:63.99rem)]:left-[37vw] [@media(max-height:32rem)_and_(min-aspect-ratio:4/3)_and_(max-width:63.99rem)]:w-[4.5rem] [@media(max-height:32rem)_and_(min-aspect-ratio:4/3)_and_(max-width:63.99rem)]:[--cord:5rem]"
          >
            <div className="[mask-image:linear-gradient(to_bottom,transparent_4.5rem,#000_6.5rem)] lg:[mask-image:linear-gradient(to_bottom,transparent_5rem,#000_7rem)]">
              <Reached progress={progress} at={MOUNT_AT}>
                <RoomKey progress={progress} shade={keyShade} />
              </Reached>
            </div>
            <motion.p
              style={keyLabel}
              className="absolute top-(--cord) right-[calc(100%-var(--fob-left)+14px)] mt-[109.8%] -translate-y-1/2 text-right whitespace-nowrap [--fob-left:34.4%] [@media(max-height:32rem)_and_(min-aspect-ratio:4/3)_and_(max-width:63.99rem)]:right-auto [@media(max-height:32rem)_and_(min-aspect-ratio:4/3)_and_(max-width:63.99rem)]:left-[calc(100%-var(--fob-left)+14px)] [@media(max-height:32rem)_and_(min-aspect-ratio:4/3)_and_(max-width:63.99rem)]:text-left"
            >
              <KeyLabel />
            </motion.p>
          </motion.div>

          <div className="absolute inset-x-5 bottom-[max(1.5rem,4svh)] sm:inset-x-8 lg:right-12 lg:bottom-[11svh] lg:left-auto lg:w-[25rem] xl:right-16 xl:w-[27rem] 2xl:right-24 2xl:w-[31rem] [@media(max-height:32rem)_and_(min-aspect-ratio:4/3)_and_(max-width:63.99rem)]:inset-x-auto [@media(max-height:32rem)_and_(min-aspect-ratio:4/3)_and_(max-width:63.99rem)]:right-[5vw] [@media(max-height:32rem)_and_(min-aspect-ratio:4/3)_and_(max-width:63.99rem)]:bottom-4 [@media(max-height:32rem)_and_(min-aspect-ratio:4/3)_and_(max-width:63.99rem)]:w-[44vw]">
            <motion.div style={notesHead} className="flex items-center gap-4">
              <p className="eyebrow text-background/70">This evening</p>
              <span aria-hidden className="h-px flex-1 bg-(--gilt)/60" />
            </motion.div>
            <ul className="mt-4 flex flex-col gap-2.5 sm:mt-5 sm:gap-3.5 [@media(max-height:32rem)_and_(min-aspect-ratio:4/3)_and_(max-width:63.99rem)]:mt-3 [@media(max-height:32rem)_and_(min-aspect-ratio:4/3)_and_(max-width:63.99rem)]:gap-1.5">
              {SERVICE_NOTES.map((item, i) => (
                <ServiceNote key={item.time} progress={progress} index={i} {...item} />
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 text-background motion-reduce:hidden">
        <Shell className="pb-[max(2.5rem,7svh)] lg:pb-[13svh]">
          <motion.h2
            style={ready}
            className="font-heading text-[clamp(2.75rem,6.4vw,7.5rem)] leading-[0.98] font-light tracking-[-0.01em] [@media(max-height:32rem)_and_(min-aspect-ratio:4/3)_and_(max-width:63.99rem)]:text-[clamp(2rem,min(6.4vw,14svh),7.5rem)]"
          >
            Your room is ready.
          </motion.h2>
          <motion.div style={reserve} className="mt-8 lg:mt-11 [@media(max-height:32rem)_and_(min-aspect-ratio:4/3)_and_(max-width:63.99rem)]:mt-4">
            <ReserveLink progress={progress} onFocus={onReserveFocus} />
          </motion.div>
        </Shell>
      </div>
    </>
  );
});

// Decoded as soon as it mounts, well before the window opens, so the room's first frame never waits on it.
function RoomPhoto() {
  const img = useRef<HTMLImageElement>(null);
  useEffect(() => {
    img.current?.decode().catch(() => undefined);
  }, []);
  return (
    <PlatePicture
      wide={ROOM_NIGHT.wide}
      tall={ROOM_NIGHT.tall}
      alt={ROOM_NIGHT.alt}
      wideSizes="(max-aspect-ratio: 3/2) 150vh, 100vw"
      tallSizes="(max-aspect-ratio: 4/5) 81vh, 100vw"
      imgRef={img}
      className="absolute inset-0 size-full object-cover"
    />
  );
}

function ReserveLink({ progress, onFocus }: { progress: MotionValue<number>; onFocus: () => void }) {
  const [live, setLive] = useState(false);
  useMotionValueEvent(progress, "change", (p) => {
    const isLive = p > ACT.ready[0];
    if (isLive !== live) setLive(isLive);
  });

  return (
    // Always in the tab order: focusing it scrolls the hand-off into view.
    <Link
      href={RESERVE_HREF}
      onFocus={onFocus}
      className={`group relative inline-flex min-h-11 items-center gap-x-4 gap-y-1 pb-3 text-[0.8125rem] tracking-[0.16em] uppercase focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-background max-sm:flex-wrap ${live ? "pointer-events-auto" : ""}`}
    >
      <span>{RESERVE_LABEL}</span>
      <span className="font-heading text-[1.15rem] tracking-normal normal-case italic opacity-85">{RESERVE_PRICE}</span>
      <ArrowRight className="size-4 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1.5" />
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-(--gilt)/50" />
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-(--gilt) transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
      />
    </Link>
  );
}

/** Where the suite's window sits at the start of the aperture, and how far the room's focus is from it. */
function useRoomAnchor(geo: MotionValue<Geo | null>) {
  return useTransform(geo, (g) => {
    if (!g) return null;
    const box = suiteBox(camera(ACT.aperture[0], g), g);
    const x = (box.l + box.r) / 2;
    const y = (box.t + box.b) / 2;
    const img = g.tall ? ROOM_NIGHT.tall : ROOM_NIGHT.wide;
    const [fx, fy] = g.tall ? ROOM_NIGHT.focus.tall : ROOM_NIGHT.focus.wide;
    const s = Math.max(g.width / img.width, g.height / img.height);
    const w = img.width * s;
    const h = img.height * s;
    // Clamped so the photograph always covers the opening aperture.
    const dx = Math.min(box.l, Math.max(box.r - g.width, x - ((g.width - w) / 2 + fx * w)));
    const dy = Math.min(box.t, Math.max(box.b - g.height, y - ((g.height - h) / 2 + fy * h)));
    return { x, y, dx, dy };
  });
}

// The gilt hairline is drawn around the suite's window and rides the aperture's edge as it opens.
function ApertureFrame({ progress, geo }: { progress: MotionValue<number>; geo: MotionValue<Geo | null> }) {
  // Outside its act the frame is fully transparent, so its path holds still instead of repainting every frame.
  const d = useTransform(() => {
    const g = geo.get();
    const p = progress.get();
    if (!g || p < ACT.frame[0] || apertureOf(p) >= 0.95) return "M0 0";
    const { l, t, r, b } = apertureBox(p, g);
    const o = 8;
    return `M${(l - o).toFixed(1)} ${(t - o).toFixed(1)}H${(r + o).toFixed(1)}V${(b + o).toFixed(1)}H${(l - o).toFixed(1)}Z`;
  });
  const pathLength = useTransform(progress, (p) => easeInOut(band(p, ACT.frame)));
  const opacity = useTransform(progress, (p) => (p < ACT.frame[0] ? 0 : 1 - band(apertureOf(p), [0.6, 0.95])));

  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 z-10 size-full overflow-visible motion-reduce:hidden">
      <motion.path d={d} fill="none" stroke="var(--gilt)" strokeWidth={1} style={{ pathLength, opacity }} />
    </svg>
  );
}

// Paper is never see-through: it is opaque almost at once, and travel and turn carry the entrance.
function useCard(progress: MotionValue<number>) {
  const opacity = useTransform(progress, (p) => clamp01(band(p, ACT.card) * 4) * (1 - band(p, ACT.cardFade)));
  const transform = useTransform(progress, (p) => {
    const inn = easeOut(band(p, ACT.card));
    const out = easeInOut(band(p, ACT.cardOut));
    const rotate = -2.2 - (1 - inn) * 2.5 + out * 1.2;
    return `translate3d(0, calc(${((1 - inn) * 46).toFixed(2)}px - ${(out * 4).toFixed(2)}svh), 0) rotate(${rotate.toFixed(3)}deg)`;
  });
  return { opacity, transform };
}

export function KeyLabel() {
  return (
    <>
      <span className="font-heading text-[1.9rem] leading-none font-light italic">{SUITE.number}</span>
      <span className="eyebrow ml-2.5 text-background/80">· {SUITE_NAME}</span>
    </>
  );
}

function ServiceNote({ progress, index, time, note }: { progress: MotionValue<number>; index: number; time: string; note: string }) {
  const start = ACT.notes[0] + 0.01 + index * 0.02;
  const style = useEnter(progress, [start, start + 0.035], ACT.notesOut, 12);
  return (
    <motion.li style={style} className="grid grid-cols-[3.25rem_1fr] items-baseline gap-3 sm:grid-cols-[3.75rem_1fr]">
      <span className="text-[0.75rem] tracking-[0.08em] text-background/65 tabular-nums">{time}</span>
      <span className="font-heading text-[1.06rem] leading-snug text-pretty italic sm:text-[1.2rem] 2xl:text-[1.35rem] [@media(max-height:32rem)_and_(min-aspect-ratio:4/3)_and_(max-width:63.99rem)]:text-[0.95rem]">
        {note}
      </span>
    </motion.li>
  );
}

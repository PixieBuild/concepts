"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { motion, useTransform, type MotionStyle, type MotionValue } from "motion/react";

import { useAct } from "./act";
import { useLamp, type Lamps } from "./lamps";
import { PlatePicture } from "./plate-picture";
import { ACT, band, camera, easeInOut, insetOf, type Geo } from "./timeline";
import { getRoom } from "@/app/(concepts)/casa-lume/_lib/content";
import {
  HOUSE,
  LANTERNS,
  SUITE,
  lanternScale,
  WINDOWS,
  inFrame,
  toFrame,
  type HouseWindow,
  type Rect,
} from "@/app/(concepts)/casa-lume/_lib/hero-lights";
import { path } from "@/app/(concepts)/casa-lume/site";

const WIDE_SIZES = "(max-aspect-ratio: 3/2) 150vh, 100vw";
const TALL_SIZES = "(max-aspect-ratio: 4/5) 80vh, 100vw";
// The evening plates are the ones the camera pushes into, so they are fetched for the deepest zoom.
const WIDE_ZOOM_SIZES = "(max-aspect-ratio: 3/2) 240vh, 160vw";
const TALL_ZOOM_SIZES = "(max-aspect-ratio: 4/5) 128vh, 160vw";

// Windows go dark in this order as the house settles for the night.
const DIM_ORDER = ["m2", "g1", "t0", "x2", "m4", "t2", "g4", "t3", "m1", "x1", "g3", "t1", "m3"];

type PlateRefs = {
  golden: React.RefObject<HTMLImageElement | null>;
  dusk: React.RefObject<HTMLImageElement | null>;
  lit: React.RefObject<HTMLImageElement | null>;
};

type Props = {
  progress: MotionValue<number>;
  geo: MotionValue<Geo | null>;
  tall: boolean;
  lamps: Lamps;
  /** The window the pointer or a tap has chosen. */
  hotId: string | null;
  /** The room whose window has keyboard focus. */
  focusRoom: string | null;
  /** The evening has begun, so the dusk and lit plates may load. */
  evening: boolean;
  imgRefs: PlateRefs;
  onHover: (w: HouseWindow | null) => void;
  onHoverEnd: () => void;
  onFocusRoom: (room: string | null) => void;
  onTap: (w: HouseWindow, event: React.MouseEvent) => void;
};

const pct = (v: number) => `${(v * 100).toFixed(3)}%`;

function boxStyle([l, t, r, b]: Rect): React.CSSProperties {
  return { left: pct(l), top: pct(t), width: pct(r - l), height: pct(b - t) };
}

// Each light is a window-sized box showing the lit plate behind it, so nothing re-measures.
function litBackground([l, t, r, b]: Rect, url: string | null): React.CSSProperties {
  const w = r - l;
  const h = b - t;
  return {
    backgroundImage: url ? `url("${url}")` : undefined,
    backgroundSize: `${pct(1 / w)} ${pct(1 / h)}`,
    backgroundPosition: `${pct(l / (1 - w))} ${pct(t / (1 - h))}`,
  };
}

export const HousePlate = memo(function HousePlate({
  progress,
  geo,
  tall,
  lamps,
  hotId,
  focusRoom,
  evening,
  imgRefs,
  onHover,
  onHoverEnd,
  onFocusRoom,
  onTap,
}: Props) {
  const [litUrl, setLitUrl] = useState<string | null>(null);

  // The lit plate can finish loading before hydration attaches onLoad.
  useEffect(() => {
    const img = imgRefs.lit.current;
    if (!img) return;
    let live = true;
    img.decode().then(
      () => live && setLitUrl(img.currentSrc),
      () => undefined,
    );
    return () => {
      live = false;
    };
  }, [imgRefs.lit, tall, evening]);
  const onLitLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => setLitUrl(e.currentTarget.currentSrc), []);

  const plateClip = useTransform(() => {
    // Read before branching: a function transform follows only the values it read when its component last rendered.
    const p = progress.get();
    const g = geo.get();
    return g ? insetOf(camera(p, g).frame, g) : "inset(0px)";
  });
  const layerTransform = useTransform(() => {
    const p = progress.get();
    const g = geo.get();
    if (!g) return "none";
    const { x, y, s } = camera(p, g);
    return `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${s.toFixed(4)})`;
  });
  const layerSize = useTransform(() => geo.get());
  const width = useTransform(layerSize, (g) => (g ? g.layerW : "100%"));
  const height = useTransform(layerSize, (g) => (g ? g.layerH : "100%"));
  const layerStyle = { width, height, transform: layerTransform };
  const visibility = useTransform(progress, (p) => (p > ACT.aperture[1] + 0.01 ? "hidden" : "visible"));
  // The house sinks further into the night as the room opens out of it.
  const night = useTransform(progress, (p) => 0.42 * easeInOut(band(p, ACT.dim)) + 0.33 * band(p, ACT.aperture));
  const footShade = useTransform(
    progress,
    (p) => band(p, [0.05, 0.1]) * (1 - band(p, [ACT.tonight[2], ACT.tonight[3]])),
  );

  return (
    <motion.div style={{ clipPath: plateClip, visibility }} className="absolute inset-0 will-change-[clip-path]">
      <div className="evening-reveal absolute inset-0 overflow-hidden bg-[oklch(0.25_0.03_270)]">
        <motion.div style={layerStyle} className="absolute top-0 left-0 origin-top-left will-change-transform">
          <Plates evening={evening} imgRefs={imgRefs} onLitLoad={onLitLoad} />
          <motion.div aria-hidden style={{ opacity: night }} className="absolute inset-0 bg-[oklch(0.12_0.03_268)]" />

          {LANTERNS.map((lantern, i) => (
            <Lantern key={lantern.id} index={i} at={lantern.at} tall={tall} url={litUrl} progress={progress} />
          ))}

          {WINDOWS.map((w) => (
            <WindowLight
              key={w.id}
              w={w}
              tall={tall}
              url={litUrl}
              progress={progress}
              lamps={lamps}
              hot={hotId ? hotId === w.id : focusRoom !== null && w.room === focusRoom}
            />
          ))}

          <HitTargets
            progress={progress}
            geo={geo}
            tall={tall}
            onHover={onHover}
            onHoverEnd={onHoverEnd}
            onFocusRoom={onFocusRoom}
            onTap={onTap}
          />
        </motion.div>
      </div>
      <motion.div
        aria-hidden
        style={{ opacity: footShade }}
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[45svh] bg-[linear-gradient(to_top,rgb(10_10_20/0.62),rgb(10_10_20/0.3)_45%,transparent)] lg:h-64"
      />
    </motion.div>
  );
});

type HitProps = Pick<Props, "progress" | "geo" | "tall" | "onHover" | "onHoverEnd" | "onFocusRoom" | "onTap">;

// Holds the act itself, so the house turning inert re-renders only these targets.
const HitTargets = memo(function HitTargets({ progress, geo, tall, onHover, onHoverEnd, onFocusRoom, onTap }: HitProps) {
  const interactive = useAct(progress) !== "beyond";
  // Past the interactive act the targets no longer take a pointer, so their scale can rest.
  const scale = useTransform(() => {
    const p = Math.min(progress.get(), ACT.interactive);
    const g = geo.get();
    return g ? camera(p, g).s : 1;
  });
  // Exposed so tap targets inside the scaled plate can stay 44px on screen.
  const hitStyle = { "--plate-scale": scale } as MotionStyle;

  const shown = WINDOWS.filter((w) => w.room && inFrame(w.rect, tall));
  const firstOfRoom = new Set<string>();
  const seen = new Set<string>();
  for (const w of shown) {
    if (w.room && !seen.has(w.room)) {
      seen.add(w.room);
      firstOfRoom.add(w.id);
    }
  }

  return (
    <motion.div
      style={hitStyle}
      className={interactive ? "absolute inset-0" : "pointer-events-none absolute inset-0"}
      onPointerLeave={onHoverEnd}
    >
      {shown.map((w) => {
        const room = getRoom(w.room!)!;
        const [l, t, r, b] = toFrame(w.rect, tall);
        const focusable = interactive && firstOfRoom.has(w.id);
        return (
          <a
            key={w.id}
            data-window-hit
            href={path(`/rooms/${room.slug}`)}
            aria-label={`${room.name}: ${room.tagline.toLowerCase()}, from €${room.priceFrom.toLocaleString("en-GB")} a night`}
            aria-hidden={focusable ? undefined : true}
            tabIndex={focusable ? 0 : -1}
            onPointerEnter={(e) => e.pointerType === "mouse" && onHover(w)}
            onPointerLeave={(e) => e.pointerType === "mouse" && onHoverEnd()}
            onFocus={() => onFocusRoom(room.slug)}
            onBlur={() => onFocusRoom(null)}
            onClick={(e) => onTap(w, e)}
            style={{
              left: pct((l + r) / 2),
              top: pct((t + b) / 2),
              width: `max(${pct(r - l)}, calc(44px / var(--plate-scale, 1)))`,
              height: `max(${pct(b - t)}, calc(44px / var(--plate-scale, 1)))`,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer outline-none [-webkit-tap-highlight-color:transparent] focus-visible:after:absolute focus-visible:after:-inset-1 focus-visible:after:border focus-visible:after:border-background/90"
          />
        );
      })}
    </motion.div>
  );
});

// The lit plate is never seen whole: it is the source the window lights sample, so it stays invisible.
const Plates = memo(function Plates({
  evening,
  imgRefs,
  onLitLoad,
}: {
  evening: boolean;
  imgRefs: PlateRefs;
  onLitLoad: React.ReactEventHandler<HTMLImageElement>;
}) {
  return (
    <>
      <PlatePicture
        wide={HOUSE.golden.wide}
        tall={HOUSE.golden.tall}
        alt={HOUSE.alt}
        wideSizes={WIDE_SIZES}
        tallSizes={TALL_SIZES}
        fetchPriority="high"
        preload
        imgRef={imgRefs.golden}
        className="evening-golden absolute inset-0 size-full object-cover"
      />
      {evening && (
        <>
          <div className="evening-dusk absolute inset-0" aria-hidden>
            <PlatePicture
              wide={HOUSE.dusk.wide}
              tall={HOUSE.dusk.tall}
              alt=""
              wideSizes={WIDE_ZOOM_SIZES}
              tallSizes={TALL_ZOOM_SIZES}
              fetchPriority="low"
              imgRef={imgRefs.dusk}
              className="absolute inset-0 size-full object-cover"
            />
          </div>
          <div aria-hidden className="invisible absolute inset-0 opacity-0 motion-reduce:visible motion-reduce:opacity-100">
            <PlatePicture
              wide={HOUSE.lit.wide}
              tall={HOUSE.lit.tall}
              alt=""
              wideSizes={WIDE_ZOOM_SIZES}
              tallSizes={TALL_ZOOM_SIZES}
              fetchPriority="low"
              imgRef={imgRefs.lit}
              onLoad={onLitLoad}
              className="absolute inset-0 size-full object-cover"
            />
          </div>
        </>
      )}
    </>
  );
});

const WindowLight = memo(function WindowLight({
  w,
  tall,
  url,
  progress,
  lamps,
  hot,
}: {
  w: HouseWindow;
  tall: boolean;
  url: string | null;
  progress: MotionValue<number>;
  lamps: Lamps;
  hot: boolean;
}) {
  const { off, relit } = useLamp(lamps, w.id);
  const rect = toFrame(w.rect, tall);
  const order = DIM_ORDER.indexOf(w.id);
  const stays = w.id === SUITE.window;
  const opacity = useTransform(progress, (p) => {
    if (stays) return 1;
    const [a, b] = ACT.dim;
    const start = a + ((b - a - 0.02) * order) / DIM_ORDER.length;
    return 1 - band(p, [start, start + 0.02]);
  });

  return (
    <motion.div aria-hidden style={{ ...boxStyle(rect), opacity }} className="pointer-events-none absolute">
      <div
        className="evening-light absolute top-1/2 left-1/2 h-[260%] w-[320%] -translate-x-1/2 -translate-y-[40%] bg-[radial-gradient(closest-side,rgb(255_176_102/0.22),rgb(255_150_74/0.08)_50%,transparent_80%)]"
        style={{ "--on": `${w.on}s` } as React.CSSProperties}
        data-off={off || undefined}
        data-relit={relit || undefined}
      />
      <div
        className="evening-light absolute inset-0"
        style={
          {
            ...litBackground(rect, url),
            "--on": `${w.on}s`,
          } as React.CSSProperties
        }
        data-off={off || undefined}
        data-relit={relit || undefined}
        data-hot={hot || undefined}
      />
      <div
        className={`absolute -inset-1.5 border border-[oklch(0.97_0.02_85/0.85)] transition-opacity duration-500 ${hot ? "opacity-100" : "opacity-0"}`}
      />
    </motion.div>
  );
});

// A filament catching: a flare past full, then it settles.
function warm(t: number) {
  if (t <= 0) return 0;
  if (t < 0.2) return 1.15 * Math.pow(t / 0.2, 0.8);
  if (t < 0.42) return 1.15 - ((t - 0.2) / 0.22) * 0.22;
  return Math.min(1, 0.93 + ((t - 0.42) / 0.58) * 0.07);
}

const Lantern = memo(function Lantern({
  index,
  at,
  tall,
  url,
  progress,
}: {
  index: number;
  at: readonly [number, number];
  tall: boolean;
  url: string | null;
  progress: MotionValue<number>;
}) {
  const k = lanternScale(at);
  const glow = toFrame([at[0] - 0.06 * k, at[1] - 0.09 * k, at[0] + 0.06 * k, at[1] + 0.09 * k], tall);
  // The lit plate is cut out only around the lantern and its pool, so nearby windows keep their own state.
  const lit = toFrame([at[0] - 0.035 * k, at[1] - 0.045 * k, at[0] + 0.035 * k, at[1] + 0.035 * k], tall);
  const at01 = (index + 1) / LANTERNS.length - 0.07;
  const level = (p: number) => warm(band(band(p, ACT.climb), [at01, at01 + 0.12]));
  const opacity = useTransform(progress, (p) => Math.min(1, level(p)));
  const flare = useTransform(progress, (p) => Math.max(0, (level(p) - 1) / 0.15));

  return (
    <>
      <motion.div
        aria-hidden
        style={{ ...boxStyle(lit), ...litBackground(lit, url), opacity }}
        className="pointer-events-none absolute [mask-image:radial-gradient(closest-side,#000_55%,transparent)]"
      />
      <motion.div aria-hidden style={{ ...boxStyle(glow), opacity }} className="pointer-events-none absolute">
        <div className="absolute inset-[22%_30%_38%] bg-[radial-gradient(closest-side,rgb(255_196_120/0.4),rgb(255_150_70/0.1)_45%,transparent_80%)]" />
        <div className="absolute inset-[44%_14%_8%] bg-[radial-gradient(closest-side,rgb(255_168_90/0.22),rgb(255_140_60/0.06)_55%,transparent)]" />
        <motion.div
          style={{ opacity: flare }}
          className="absolute inset-[36%_40%_48%] bg-[radial-gradient(closest-side,rgb(255_226_170/0.75),transparent)]"
        />
      </motion.div>
    </>
  );
});

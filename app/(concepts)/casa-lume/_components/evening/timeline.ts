import { FOCUS, SUITE, WINDOWS, pointToFrame, toFrame, type Point, type Rect } from "@/app/(concepts)/casa-lume/_lib/hero-lights";

/** Scroll progress through the pinned hero, act by act. */
export const ACT = {
  open: [0, 0.09],
  climbIn: [0.1, 0.2],
  climb: [0.12, 0.33],
  steps: [0.1, 0.355],
  interactive: 0.3,
  approach: [0.34, 0.47],
  dim: [0.35, 0.43],
  frame: [0.385, 0.45],
  tonight: [0.37, 0.41, 0.455, 0.48],
  aperture: [0.465, 0.59],
  card: [0.575, 0.615],
  ink: [0.6, 0.76],
  key: [0.63, 0.7],
  notes: [0.72, 0.805],
  cardOut: [0.79, 0.835],
  cardFade: [0.81, 0.835],
  notesOut: [0.835, 0.855],
  keyDim: [0.83, 0.865],
  ready: [0.86, 0.925],
} as const;

export type Range = readonly [number, number];

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const band = (p: number, [a, b]: Range) => clamp01((p - a) / (b - a));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeSlow = (t: number) => (t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2);

export type Box = { l: number; t: number; r: number; b: number };

export type Geo = {
  width: number;
  height: number;
  tall: boolean;
  slot: Box;
  layerW: number;
  layerH: number;
  /** Extra scale the master photograph can take before it would be upscaled. */
  zoom: number;
};

const lerpBox = (a: Box, b: Box, t: number): Box => ({
  l: lerp(a.l, b.l, t),
  t: lerp(a.t, b.t, t),
  r: lerp(a.r, b.r, t),
  b: lerp(a.b, b.b, t),
});

const lerpPoint = (a: Point, b: Point, t: number): Point => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

const suiteRect = WINDOWS.find((w) => w.id === SUITE.window)!.rect;
const suiteCenter: Point = [(suiteRect[0] + suiteRect[2]) / 2, (suiteRect[1] + suiteRect[3]) / 2];

export type Camera = { frame: Box; x: number; y: number; s: number };

/** Where the plate's clip sits and how its photograph is placed, for a scroll position. */
export function camera(p: number, g: Geo): Camera {
  const open = easeInOut(band(p, ACT.open));
  // The edge beside the headline waits until its lines have left through their masks.
  const lead = easeInOut(band(p, g.tall ? [0.035, 0.1] : [0.03, 0.09]));
  const climbIn = easeInOut(band(p, ACT.climbIn));
  const climb = easeInOut(band(p, ACT.climb));
  const approach = easeSlow(band(p, ACT.approach));
  const through = easeOut(band(p, ACT.aperture));
  const frame = {
    l: lerp(g.slot.l, 0, g.tall ? open : lead),
    t: lerp(g.slot.t, 0, g.tall ? lead : open),
    r: lerp(g.slot.r, g.width, open),
    b: lerp(g.slot.b, g.height, open),
  };

  let focus = lerpPoint(FOCUS.house, FOCUS.stairFoot, open);
  focus = lerpPoint(focus, FOCUS.door, climb);
  focus = lerpPoint(focus, suiteCenter, approach);
  const [fx, fy] = pointToFrame(focus, g.tall);

  // At rest the whole plate fits the slot; opening grows it to cover the stage.
  const rest = Math.min(1, 1.08 * Math.max((g.slot.r - g.slot.l) / g.layerW, (g.slot.b - g.slot.t) / g.layerH));
  const extra = g.zoom - 1;
  // Push in on the foot of the stair, crane up to the door, ease back to find the top floor, then commit through the window.
  const s = lerp(rest, 1, open) * (1 + extra * (0.15 * open + 0.85 * climbIn - 0.55 * approach + 0.55 * through));
  const w = g.layerW * s;
  const h = g.layerH * s;
  const x = Math.min(frame.l, Math.max(frame.r - w, (frame.l + frame.r) / 2 - fx * w));
  const y = Math.min(frame.t, Math.max(frame.b - h, (frame.t + frame.b) / 2 - fy * h));
  return { frame, x, y, s };
}

/** The suite's window on screen, for a given camera. */
export function suiteBox(cam: Camera, g: Geo): Box {
  const [l, t, r, b] = toFrame(suiteRect as Rect, g.tall);
  const w = g.layerW * cam.s;
  const h = g.layerH * cam.s;
  return { l: cam.x + l * w, t: cam.y + t * h, r: cam.x + r * w, b: cam.y + b * h };
}

/** How far the suite's window has opened into the room, 0 to 1. */
export const apertureOf = (p: number) => easeOut(band(p, ACT.aperture)) ** 1.6;

/** The aperture on screen: the suite's window growing to the whole stage. */
export function apertureBox(p: number, g: Geo): Box {
  const from = suiteBox(camera(p, g), g);
  return lerpBox(from, { l: 0, t: 0, r: g.width, b: g.height }, apertureOf(p));
}

export const insetOf = (box: Box, g: Geo) =>
  `inset(${box.t.toFixed(2)}px ${(g.width - box.r).toFixed(2)}px ${(g.height - box.b).toFixed(2)}px ${box.l.toFixed(2)}px)`;

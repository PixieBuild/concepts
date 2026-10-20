import { IMAGE_BASE } from "./content";

// Final photography swaps in by keeping these file names and re-measuring the fractions below.
// `${name}.webp` is the full-resolution master; `${name}-${width}.webp` are its cut-downs.

const BASE = `${IMAGE_BASE}/evening/lights`;

export type HeroImage = {
  src: string;
  width: number;
  height: number;
  variants: readonly number[];
};

type Framed = { wide: HeroImage; tall: HeroImage };

function image(name: string, width: number, height: number, variants: number[]): HeroImage {
  return { src: `${BASE}/${name}.webp`, width, height, variants };
}

function framed(name: string): Framed {
  return {
    wide: image(name, 3520, 2352, [1600, 2400]),
    tall: image(`${name}-mobile`, 1881, 2352, [1240]),
  };
}

/** Portrait screens get the tall 4:5 crops. */
export const TALL_MEDIA = "(max-aspect-ratio: 1/1)";

/** The three matched house plates: the same frame at golden hour, at dusk, and lit. */
export const HOUSE = {
  golden: framed("house-golden"),
  dusk: framed("house-dusk"),
  lit: framed("house-lit"),
  alt: "Casa Lume from the lemon terrace in the evening: a three-storey ochre house with grey-green shutters, a stone stair climbing through the lemon trees, and the sea and Punta Mesco beyond",
  /** Where the tall crop sits inside the wide frame: [left, top, right, bottom]. */
  tallCrop: [0.23, 0, 0.7645, 1] as Rect,
} as const;

/** The Signature Suite at night, seen from inside once the window opens. */
export const ROOM_NIGHT = {
  wide: image("room-night", 3520, 2352, [1600, 2400]),
  tall: image("room-night-mobile", 1664, 2080, [1240]),
  /** The point of each frame that first shows through the suite's window: the near bedside lamp. */
  focus: { wide: [0.663, 0.45] as Point, tall: [0.661, 0.48] as Point },
  alt: "The Signature Suite at night, lamps low, the glass doors open onto the roof terrace and the dark gulf",
} as const;

/** A still tile of film grain laid over every photograph in the hero. */
export const GRAIN = { src: `${BASE}/grain.png`, size: 256 } as const;

export const ROOM_KEY = {
  ...image("key", 880, 1580, []),
  alt: "The brass key to room seven, hung on a terracotta silk tassel",
} as const;

/** [left, top, right, bottom] as fractions of the wide frame. */
export type Rect = readonly [number, number, number, number];
export type Point = readonly [number, number];

export type HouseWindow = {
  id: string;
  /** Room slug in content.ts, or null for a light that belongs to no bookable room. */
  room: string | null;
  rect: Rect;
  /** Seconds into the evening when this window comes on. Uneven on purpose. */
  on: number;
};

export const WINDOWS: readonly HouseWindow[] = [
  { id: "t4", room: "signature-suite", rect: [0.5747, 0.2568, 0.6037, 0.3299], on: 1.4 },
  { id: "m3", room: "sea-view-suite", rect: [0.4804, 0.4162, 0.5151, 0.4957], on: 1.88 },
  { id: "g3", room: "garden-suite", rect: [0.4804, 0.5893, 0.5148, 0.6705], on: 2.42 },
  { id: "m1", room: "sea-view-suite", rect: [0.2994, 0.4077, 0.3403, 0.4945], on: 2.83 },
  { id: "t1", room: "signature-suite", rect: [0.2991, 0.216, 0.3403, 0.301], on: 3.21 },
  { id: "x2", room: "garden-suite", rect: [0.5804, 0.7568, 0.6, 0.7985], on: 3.34 },
  { id: "m4", room: "sea-view-suite", rect: [0.5778, 0.4218, 0.6094, 0.4962], on: 3.74 },
  { id: "x1", room: "garden-suite", rect: [0.5216, 0.7751, 0.5366, 0.8312], on: 3.92 },
  { id: "g4", room: "garden-suite", rect: [0.5778, 0.5855, 0.6094, 0.6616], on: 4.18 },
  { id: "t2", room: "signature-suite", rect: [0.3991, 0.23, 0.4344, 0.3116], on: 4.29 },
  { id: "g1", room: "garden-suite", rect: [0.3, 0.5999, 0.3395, 0.6454], on: 4.66 },
  { id: "t0", room: "olive-room", rect: [0.1844, 0.2543, 0.1929, 0.29], on: 4.88 },
  { id: "m2", room: "sea-view-suite", rect: [0.3994, 0.4116, 0.4341, 0.4375], on: 5.12 },
  { id: "t3", room: "signature-suite", rect: [0.4892, 0.2436, 0.5202, 0.3206], on: 5.71 },
];

/** Stair lanterns in the order they light: from the sea up to the door. */
/** Each `at` is where the lantern's foot meets the stone: a tread, or the landing at the top. */
export const LANTERNS: readonly { id: string; at: Point }[] = [
  { id: "s3", at: [0.4097, 0.9987] },
  { id: "s4", at: [0.4196, 0.9426] },
  { id: "s5", at: [0.4332, 0.8788] },
  { id: "s6", at: [0.4446, 0.8202] },
  { id: "porch", at: [0.4517, 0.7666] },
];

/** Lanterns nearer the camera, lower in the frame, are drawn larger. */
export const lanternScale = ([, y]: Point) => 0.95 + 0.3 * Math.min(1, Math.max(0, (y - 0.77) / 0.23));

export const STAIR_STEPS = 90;

/** Where the camera looks, as points in the wide frame. */
export const FOCUS = {
  house: [0.46, 0.45] as Point,
  stairFoot: [0.43, 0.93] as Point,
  door: [0.43, 0.65] as Point,
};

/** The room that keeps its light on, and the window that becomes the way in. */
export const SUITE = {
  room: "signature-suite",
  window: "t4",
  number: 7,
};

/** Maps a wide-frame rectangle into the frame actually shown. */
export function toFrame(rect: Rect, tall: boolean): Rect {
  if (!tall) return rect;
  const [cl, ct, cr, cb] = HOUSE.tallCrop;
  const w = cr - cl;
  const h = cb - ct;
  return [(rect[0] - cl) / w, (rect[1] - ct) / h, (rect[2] - cl) / w, (rect[3] - ct) / h];
}

/** Whether a wide-frame rectangle is at least half inside the frame actually shown. */
export function inFrame(rect: Rect, tall: boolean): boolean {
  const [l, , r] = toFrame(rect, tall);
  return (l + r) / 2 > 0 && (l + r) / 2 < 1;
}

export function pointToFrame(point: Point, tall: boolean): Point {
  const [x, y] = toFrame([point[0], point[1], point[0], point[1]], tall);
  return [x, y];
}

/** Serves the pre-cut variant just wide enough for the requested width. */
export function variantLoader(img: HeroImage) {
  return ({ width }: { width: number }) => {
    const fit = img.variants.find((w) => w >= width);
    return fit ? img.src.replace(/\.webp$/, `-${fit}.webp`) : img.src;
  };
}

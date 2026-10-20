import type { Rect } from "./manifest";

// The homepage camera path and dropper choreography the sequence was rendered with
// (scripts/cuvette/blender/cameras.json): keep the two in step when either changes.
type Lens = { eye: number[]; look: number[]; fov: number; shift: number[] };

const PATH: Lens[] = [
  { eye: [0, 1.72, 11.6], look: [0, 1.72, 0], fov: 26, shift: [0.1, 0.03] },
  { eye: [0, 0.95, 3.7], look: [0, 0.93, 0], fov: 26, shift: [0.14, 0] },
  { eye: [0.55, 2.1, 11], look: [0.55, 1.95, 0], fov: 26, shift: [0.14, 0.02] },
  { eye: [3.6, 0.85, 10], look: [0.55, 1.4, 0.2], fov: 26, shift: [0.16, 0] },
];

const DROPPER = {
  lift: 2.35,
  lower: 1.65,
  hang: [0.98, 0, 0.34],
  phases: { lift: [0.42, 0.52], shift: [0.52, 0.57], lower: [0.57, 0.62], raise: [0.8, 0.84], back: [0.84, 0.88], seat: [0.88, 0.94] },
} as const;

const BULB = 3.3;
const BULB_RADIUS = 0.3;
const BOTTLE_RADIUS = 0.62;

const between = (v: number, lo: number, hi: number) => Math.min(1, Math.max(0, (v - lo) / (hi - lo)));
const smooth = (v: number) => v * v * (3 - 2 * v);
const sub = (a: number[], b: number[]) => a.map((v, i) => v - b[i]);
const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0);
const cross = (a: number[], b: number[]) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: number[]) => {
  const n = Math.hypot(...a);
  return a.map((v) => v / n);
};

function lens(p: number): Lens {
  const scaled = Math.min(1, Math.max(0, p)) * (PATH.length - 1);
  const i = Math.min(PATH.length - 2, Math.floor(scaled));
  const t = smooth(scaled - i);
  const [a, c] = [PATH[i], PATH[i + 1]];
  const mix = (x: number[], y: number[]) => x.map((v, j) => v + (y[j] - v) * t);
  return { eye: mix(a.eye, c.eye), look: mix(a.look, c.look), fov: a.fov + (c.fov - a.fov) * t, shift: mix(a.shift, c.shift) };
}

/** A scene point in frame pixels, as Blender's shift lens renders it (shift is a fraction of the wider side). */
function project(L: Lens, point: number[], [w, h]: [number, number]): [number, number] {
  const forward = unit(sub(L.look, L.eye));
  const right = unit(cross(forward, [0, 1, 0]));
  const up = cross(right, forward);
  const v = sub(point, L.eye);
  const z = dot(v, forward);
  const t = Math.tan((L.fov * Math.PI) / 360);
  const aspect = w / h;
  const big = Math.max(w, h);
  const x = dot(v, right) / z / t;
  const y = dot(v, up) / z / t;
  return [(0.5 + (x * 0.5) / aspect + (L.shift[0] * w) / big / aspect) * w, (0.5 - y * 0.5 - (L.shift[1] * h) / big) * h];
}

function dropper(p: number) {
  const ph = DROPPER.phases;
  const e = (k: keyof typeof ph) => smooth(between(p, ph[k][0], ph[k][1]));
  const height = DROPPER.lift * e("lift") * (1 - e("seat")) - DROPPER.lower * e("lower") * (1 - e("raise"));
  const side = e("shift") * (1 - e("back"));
  return { x: DROPPER.hang[0] * side, z: DROPPER.hang[2] * side, height, out: e("lift") * (1 - e("seat")) };
}

/** Where the bottle's axis falls at progress p: its foot and its shoulder, in frame pixels. */
export function axisAt(p: number, size: [number, number]) {
  const L = lens(p);
  return { foot: project(L, [0, 0.3, 0], size), shoulder: project(L, [0, 2.0, 0], size) };
}

/**
 * The phone's 4:5 window on the wide frame at progress p: around the bottle and, once it is out, the dropper; while
 * the dropper is up it drops below the header, the rows above the frame repeating its top edge.
 */
export function compactCrop(p: number, size: [number, number], aspect: number, safeTop: number): Rect {
  const [w, h] = size;
  const cw = Math.round(h * aspect);
  const L = lens(p);
  const d = dropper(p);
  const xs = [project(L, [-BOTTLE_RADIUS, 1, 0], size)[0], project(L, [BOTTLE_RADIUS, 1, 0], size)[0]];
  if (d.x > 0) xs.push(project(L, [d.x + BULB_RADIUS, d.height + BULB, d.z], size)[0]);
  const centre = (Math.min(...xs) + Math.max(...xs)) / 2;
  const x = Math.min(w - cw, Math.max(0, centre - cw / 2));
  const top = project(L, [d.x, d.height + BULB, d.z], size)[1];
  // Only while the bulb is in or near the frame: a bulb far above it would gain nothing.
  const near = smooth(between(top, -0.25 * h, 0));
  const drop = d.out * near * Math.min(safeTop, Math.max(0, safeTop - top));
  return [Math.round(x), -Math.round(drop), cw, h];
}

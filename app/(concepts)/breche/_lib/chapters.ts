import { ROUTE } from "./content";
import { between, smooth } from "./format";

/** A composed camera position, described the way a photographer would: what, from where, how wide. */
type Shot = {
  /** The point the camera aims at: latitude, longitude, metres. */
  at: readonly [number, number, number];
  /** Compass bearing the camera faces, in degrees. */
  heading: number;
  /** Degrees below the horizontal. */
  pitch: number;
  /** Kilometres from the camera to `at`. */
  distance: number;
  fov: number;
  /** Where `at` lands on screen in NDC, so the subject can sit low and leave the sky for type. */
  frame: readonly [number, number];
  tall: { frame: readonly [number, number]; distance: number; fov: number };
};

export type Light = {
  /** `wisps`: high cloud catching the light, 0–1. `band`: how high the horizon colour climbs (sine of
      elevation), kept low at dawn so the captions above it stay on dark sky. */
  sky: { top: string; horizon: string; glow: string; glowStrength: number; wisps: number; band: number };
  /** Compass azimuth and elevation in degrees. */
  sun: { azimuth: number; elevation: number; colour: string; intensity: number };
  /** Terrain below this many metres gets no direct sun: the ranges to the east still shade it. */
  sunline: number;
  hemi: { sky: string; ground: string; intensity: number };
  fog: { colour: string; density: number };
  cloud: { lit: string; shade: string; cover: number };
  stars: number;
};

export type Chapter = {
  id: string;
  /** The scroll range (0–1 of the track) where the camera rests on this shot. */
  hold: readonly [number, number];
  /** ROUTE index the caption describes, if any. */
  waypoint: number | null;
  altitude: number;
  /** How much of the route is drawn, in waypoints: 2.5 is halfway from the Grand Couloir to the hut. */
  route: number;
  shot: Shot;
  /** How far the camera drifts across the hold. */
  drift: { heading: number; distance: number; pitch: number };
  light: Light;
  /** Where the light has got to by the end of the hold, when time passes during it. */
  lightEnd?: Light;
};

// Late afternoon from the west-south-west: the north-west faces and the Bossons and Taconnaz
// glaciers catch the light, so the massif models instead of standing against the sun.
const OPENING: Light = {
  sky: { top: "#13264a", horizon: "#a99aa2", glow: "#ffd2ac", glowStrength: 0.5, wisps: 0.7, band: 0.15 },
  sun: { azimuth: 252, elevation: 16, colour: "#ffdcbd", intensity: 2.7 },
  sunline: -1000,
  hemi: { sky: "#8295bd", ground: "#343a4e", intensity: 0.5 },
  fog: { colour: "#76809c", density: 0.012 },
  cloud: { lit: "#f3e3d6", shade: "#7d88a3", cover: 0.3 },
  stars: 0,
};

const DAY: Light = {
  sky: { top: "#12203c", horizon: "#5b7193", glow: "#d5dde6", glowStrength: 0.14, wisps: 0.35, band: 0.24 },
  sun: { azimuth: 128, elevation: 52, colour: "#fff4ea", intensity: 2.5 },
  sunline: -1000,
  hemi: { sky: "#9fb2d6", ground: "#3a4256", intensity: 0.75 },
  fog: { colour: "#5b7193", density: 0.011 },
  cloud: { lit: "#eef1f5", shade: "#8a99b0", cover: 0.3 },
  stars: 0,
};

const NOON: Light = {
  ...DAY,
  sun: { azimuth: 178, elevation: 60, colour: "#fff1e4", intensity: 2.6 },
};

const AFTERNOON: Light = {
  ...DAY,
  sky: { top: "#132240", horizon: "#65728f", glow: "#e6d9cc", glowStrength: 0.2, wisps: 0.4, band: 0.24 },
  sun: { azimuth: 236, elevation: 40, colour: "#ffe9d6", intensity: 2.4 },
};

const NIGHT: Light = {
  sky: { top: "#0a1226", horizon: "#2b3a5e", glow: "#8fa8cf", glowStrength: 0.12, wisps: 0, band: 0.24 },
  sun: { azimuth: 200, elevation: 34, colour: "#9fb4d8", intensity: 0.5 },
  sunline: -1000,
  hemi: { sky: "#41558a", ground: "#121827", intensity: 0.55 },
  fog: { colour: "#26334f", density: 0.018 },
  cloud: { lit: "#5f7096", shade: "#1a2440", cover: 0.62 },
  stars: 1,
};

const FIRST_LIGHT: Light = {
  sky: { top: "#14203c", horizon: "#e2a29c", glow: "#ffd2b0", glowStrength: 0.7, wisps: 0.25, band: 0.08 },
  sun: { azimuth: 70, elevation: 4, colour: "#f2b49a", intensity: 4.2 },
  sunline: 3650,
  hemi: { sky: "#5f6f98", ground: "#20263a", intensity: 0.42 },
  fog: { colour: "#4a5272", density: 0.015 },
  cloud: { lit: "#c9b0bc", shade: "#2a3550", cover: 0.78 },
  stars: 0.25,
};

const SUMMIT: Light = {
  sky: { top: "#1a2a4c", horizon: "#d2a39a", glow: "#ffd9b8", glowStrength: 0.42, wisps: 0.35, band: 0.07 },
  sun: { azimuth: 84, elevation: 11, colour: "#f8d8bc", intensity: 3.4 },
  sunline: 2700,
  hemi: { sky: "#93a6cc", ground: "#343c54", intensity: 0.7 },
  fog: { colour: "#7d7f98", density: 0.014 },
  cloud: { lit: "#f2d6c8", shade: "#5a6282", cover: 0.74 },
  stars: 0,
};

// The last frame dims the massif to a silhouette so the hand-off line can sit over the mountain it names.
const DUSK: Light = {
  ...SUMMIT,
  sky: { top: "#0f1724", horizon: "#58546a", glow: "#e9b49a", glowStrength: 0.45, wisps: 0.2, band: 0.16 },
  sun: { ...SUMMIT.sun, intensity: 2.2 },
  hemi: { ...SUMMIT.hemi, intensity: 0.4 },
  fog: { colour: "#3d4259", density: 0.016 },
};

const at = (index: number) => [ROUTE[index].lat, ROUTE[index].lon, ROUTE[index].altitude] as const;
const still = { heading: 0, distance: 0, pitch: 0 };

export const CHAPTERS: Chapter[] = [
  {
    id: "opening",
    hold: [0, 0.04],
    waypoint: null,
    altitude: ROUTE[0].altitude,
    route: 0,
    shot: { at: [45.88, 6.85, 2000], heading: 86, pitch: 5, distance: 14, fov: 38, frame: [0.08, -0.38], tall: { frame: [0.4, -0.34], distance: 12, fov: 44 } },
    drift: { heading: 2, distance: -0.6, pitch: 0 },
    light: OPENING,
  },
  {
    id: "chamonix",
    hold: [0.1, 0.17],
    waypoint: 0,
    altitude: ROUTE[0].altitude,
    route: 0,
    shot: { at: at(0), heading: 68, pitch: 16, distance: 13, fov: 42, frame: [-0.05, -0.35], tall: { frame: [0, -0.32], distance: 13, fov: 54 } },
    drift: { heading: 4, distance: -0.5, pitch: 0 },
    light: DAY,
  },
  {
    id: "nid",
    hold: [0.22, 0.29],
    waypoint: 1,
    altitude: ROUTE[1].altitude,
    route: 1,
    shot: { at: [ROUTE[1].lat, ROUTE[1].lon, 2700], heading: 112, pitch: 12, distance: 16, fov: 36, frame: [0.12, -0.25], tall: { frame: [0, -0.25], distance: 20, fov: 50 } },
    drift: { heading: 4, distance: -0.8, pitch: 0 },
    light: DAY,
  },
  {
    id: "couloir",
    hold: [0.34, 0.41],
    waypoint: 2,
    altitude: ROUTE[2].altitude,
    route: 2,
    shot: { at: at(2), heading: 64, pitch: 19, distance: 13, fov: 34, frame: [0.12, -0.26], tall: { frame: [0, -0.26], distance: 16, fov: 50 } },
    drift: { heading: 5, distance: -0.7, pitch: 0 },
    light: NOON,
  },
  {
    id: "hut",
    hold: [0.46, 0.54],
    waypoint: 3,
    altitude: ROUTE[3].altitude,
    route: 3,
    shot: { at: at(3), heading: 104, pitch: 12, distance: 12, fov: 36, frame: [0.12, -0.24], tall: { frame: [0, -0.24], distance: 15, fov: 50 } },
    drift: { heading: 5, distance: -0.4, pitch: 0 },
    light: AFTERNOON,
    lightEnd: NIGHT,
  },
  {
    id: "dome",
    hold: [0.59, 0.67],
    waypoint: 4,
    altitude: ROUTE[4].altitude,
    route: 4,
    shot: { at: at(4), heading: 196, pitch: 6, distance: 11.5, fov: 34, frame: [0.14, -0.22], tall: { frame: [0, -0.32], distance: 16, fov: 50 } },
    drift: { heading: 4, distance: -0.7, pitch: 0 },
    light: NIGHT,
    lightEnd: FIRST_LIGHT,
  },
  {
    id: "summit",
    hold: [0.72, 0.79],
    waypoint: 5,
    altitude: ROUTE[5].altitude,
    route: 5,
    shot: { at: at(5), heading: 142, pitch: 6, distance: 11.5, fov: 34, frame: [0.14, -0.2], tall: { frame: [0, -0.32], distance: 16, fov: 50 } },
    drift: { heading: 5, distance: -0.4, pitch: 0 },
    light: FIRST_LIGHT,
    lightEnd: SUMMIT,
  },
  {
    id: "postcard",
    hold: [0.84, 0.9],
    waypoint: null,
    altitude: ROUTE[5].altitude,
    route: 5,
    shot: { at: [45.842, 6.845, 3900], heading: 178, pitch: 5, distance: 21, fov: 30, frame: [0.1, -0.3], tall: { frame: [0, -0.3], distance: 27, fov: 44 } },
    drift: { heading: 3, distance: -0.8, pitch: 0 },
    light: SUMMIT,
  },
  {
    id: "handoff",
    hold: [0.955, 1],
    waypoint: null,
    altitude: ROUTE[5].altitude,
    route: 5,
    shot: { at: [45.842, 6.845, 3900], heading: 182, pitch: 6, distance: 22, fov: 30, frame: [0.1, 0.12], tall: { frame: [0, 0.2], distance: 28, fov: 44 } },
    drift: still,
    light: DUSK,
  },
];

/** Where the opening text has gone, and where the ink rises from the foot of the frame. */
export const OPENING_END = CHAPTERS[0].hold[1] + 0.035;
export const INK_FROM = 0.9;

export type Moment = {
  /** The chapter the camera leaves, and the one it is heading for (the same one during a hold). */
  from: number;
  to: number;
  /** Eased 0–1 between the two holds. */
  t: number;
  /** 0–1 across the hold of `from`, or of `to` once it is reached. */
  drift: number;
};

/** The single clock: every instrument, the camera, the route and the light read the climb from here. */
export function chapterAt(p: number, out: Moment = { from: 0, to: 0, t: 0, drift: 0 }): Moment {
  const last = CHAPTERS.length - 1;
  for (let i = 0; i <= last; i++) {
    const [start, end] = CHAPTERS[i].hold;
    if (p <= end || i === last) {
      if (p >= start || i === 0) {
        out.from = i;
        out.to = i;
        out.t = 0;
        out.drift = between(p, start, end);
        return out;
      }
      const previous = CHAPTERS[i - 1].hold[1];
      out.from = i - 1;
      out.to = i;
      out.t = smooth(between(p, previous, start));
      out.drift = 1;
      return out;
    }
  }
  return out;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function altitudeAt(m: Moment): number {
  return lerp(CHAPTERS[m.from].altitude, CHAPTERS[m.to].altitude, m.t);
}

export function routeAt(m: Moment): number {
  return lerp(CHAPTERS[m.from].route, CHAPTERS[m.to].route, m.t);
}

/** The caption on screen and how visible it is: it fades out, swaps at the midpoint, fades back in. */
export function captionAt(m: Moment): { chapter: number; opacity: number } {
  if (m.from === m.to) return { chapter: m.from, opacity: 1 };
  return m.t < 0.5 ? { chapter: m.from, opacity: 1 - m.t * 2 } : { chapter: m.to, opacity: m.t * 2 - 1 };
}

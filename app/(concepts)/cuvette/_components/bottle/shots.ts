import type { Shot } from "../../_lib/product";
import type { Rect, TemplateManifest } from "./manifest";

/** Where a page shot comes from in the template: a rendered still by name, or a chapter frame of the sequence. */
export type ShotSource = { kind: "still"; name: string } | { kind: "sequence"; chapter: number; compact: boolean };

const STILLS: Record<Shot, string[]> = {
  "hero-wide": [],
  "hero-tall": [],
  pack: ["pack", "three-quarter"],
  "three-quarter": ["three-quarter", "pack"],
  label: ["label"],
  "label-wide": ["label-wide"],
  drop: ["drop", "drop-macro"],
  "drop-stone": ["drop-stone"],
  carton: ["carton"],
  thumb: ["pack", "three-quarter"],
  group: ["group"],
  "group-wide": ["group-wide", "group"],
};

// Tighter than the packshot's own square, so the bottle still reads at bag-line size.
const THUMB: Rect = [0.07, 0.165, 0.86, 0.688];

/** The part of a composited still a shot shows, in its pixels; null shows all of it. Baked and live stills share it. */
export function cropFor(manifest: TemplateManifest, source: ShotSource, shot: Shot): Rect | null {
  if (source.kind !== "still") return null;
  const still = manifest.stills[source.name];
  const [w, h] = still.size;
  if (shot === "thumb" && still.owners === 1) return [THUMB[0] * w, THUMB[1] * h, THUMB[2] * w, THUMB[3] * h].map(Math.round) as Rect;
  return still.crops?.[shot] ?? null;
}

/** The template picture a page shot is composited from, for a shot of `bottles` bottles; null when none exists. */
export function sourceFor(manifest: TemplateManifest, shot: Shot, bottles = 1): ShotSource | null {
  if (shot === "hero-wide" || shot === "hero-tall") return manifest.sequence ? { kind: "sequence", chapter: 0, compact: shot === "hero-tall" } : null;
  const fits = (name: string) => {
    const still = manifest.stills[name];
    return still && (bottles === 1 ? still.owners === 1 || shot === "group" || shot === "group-wide" : still.owners === bottles);
  };
  const names = bottles === 2 ? ["set", ...STILLS[shot]] : STILLS[shot];
  const name = names.find(fits) ?? Object.keys(manifest.stills).find((n) => manifest.stills[n].owners === bottles);
  return name ? { kind: "still", name } : null;
}

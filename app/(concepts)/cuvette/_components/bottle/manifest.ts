import { IMAGE_BASE } from "../../_lib/content";

// The product-free template renders (manifest version 2, written by scripts/cuvette/blender/pack_lean.py).
export const TEMPLATE_BASE = `${IMAGE_BASE}/template`;

export type Rect = [number, number, number, number];

export type Tile = { file: "data" | "light"; x: number; y: number; channels: string[] };

/** One rendered picture: its full size, the rect around the bottles its data covers, and where each plane sits. */
export type Picture = { size: [number, number]; rect: Rect; tiles: Tile[] };

export type TemplateStill = Picture & { base: string; light: string; data: string; owners: number; layout?: "single" | "pair" | "trio"; crops?: Record<string, Rect> };

export type SequenceItem = { frame: number; progress: number; rect: Rect; crop: Rect; tiles: Tile[] };

/** Every frame again at a fraction of the size (scripts/cuvette/pack-proxies.mjs): small enough to hold all of them,
 * so a fast scroll always has a picture to show while its full frames load. */
export type ProxySequence = {
  size: [number, number];
  path: { base: string; light: string; data: string };
  items: { frame: number; rect: Rect; tiles: Tile[] }[];
};

export type TemplateSequence = {
  frames: number;
  path: { wide: string; compact: string; light: string; data: string; pad: number };
  size: [number, number];
  compact: { aspect: number };
  chapters: { progress: number; frame: number }[];
  items: SequenceItem[];
  proxy?: ProxySequence;
};

export type TemplateManifest = {
  version: number;
  /** Where the manifest was loaded from; its file paths are relative to it. */
  base: string;
  updated?: string;
  label: { arc: number; radius: number; height: number; y: number };
  encoding: {
    tone: { table: number[] };
    "depth.k": { max: number };
    coc: { perByte: number };
    owner: { step: number };
  };
  sequence: TemplateSequence | null;
  stills: Record<string, TemplateStill>;
};

const pending = new Map<string, Promise<TemplateManifest>>();

export function loadManifest(base = TEMPLATE_BASE): Promise<TemplateManifest> {
  let p = pending.get(base);
  if (!p) {
    p = fetch(`${base}/manifest.json`, { cache: "no-cache" }).then(async (r) => {
      if (!r.ok) throw new Error(`template manifest ${r.status}`);
      const manifest = (await r.json()) as Omit<TemplateManifest, "base">;
      if (manifest.version !== 2) throw new Error(`template manifest version ${manifest.version}`);
      return { ...manifest, sequence: manifest.sequence?.items?.length ? manifest.sequence : null, stills: manifest.stills ?? {}, base };
    });
    p.catch(() => pending.delete(base));
    pending.set(base, p);
  }
  return p;
}

export type PictureUrls = { base: string; light: string; data: string };

/** A version stamp, so finals that overwrite drafts under the same names are never served stale. */
function stamp(manifest: TemplateManifest) {
  return manifest.updated ? `?v=${encodeURIComponent(manifest.updated)}` : "";
}

export function stillUrls(manifest: TemplateManifest, still: TemplateStill): PictureUrls {
  const v = stamp(manifest);
  return { base: `${manifest.base}/${still.base}${v}`, light: `${manifest.base}/${still.light}${v}`, data: `${manifest.base}/${still.data}${v}` };
}

export function proxyUrls(manifest: TemplateManifest, frame: number): PictureUrls {
  const seq = manifest.sequence!;
  const n = String(frame).padStart(seq.path.pad, "0");
  const at = (k: "base" | "light" | "data") => `${manifest.base}/${seq.proxy!.path[k].replace("{frame}", n)}${stamp(manifest)}`;
  return { base: at("base"), light: at("light"), data: at("data") };
}

export function frameUrls(manifest: TemplateManifest, item: SequenceItem, compact: boolean): PictureUrls {
  const seq = manifest.sequence!;
  const n = String(item.frame).padStart(seq.path.pad, "0");
  const at = (k: "wide" | "compact" | "light" | "data") => `${manifest.base}/${seq.path[k].replace("{frame}", n)}${stamp(manifest)}`;
  return { base: at(compact ? "compact" : "wide"), light: at("light"), data: at("data") };
}

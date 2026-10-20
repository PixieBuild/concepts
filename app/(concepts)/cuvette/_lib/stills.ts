import manifest from "@/public/concepts/cuvette/stills/stills.json";

import { isSet, type ProductCard, type Shot, type Slug } from "./product";

/** Products plus the whole range, which owns the group shots. */
export type StillSubject = Slug | "range";

export type StillData = { src: string; width: number; height: number; blurDataURL: string };

const STILLS: Record<string, StillData> = manifest;

export function stillKey(subject: StillSubject, shot: Shot): string {
  return `${subject}-${shot}`;
}

export function hasStill(subject: StillSubject, shot: Shot): boolean {
  return stillKey(subject, shot) in STILLS;
}

/** The exact still, or null when it hasn't been rendered yet. */
export function getStill(subject: StillSubject, shot: Shot): StillData | null {
  return STILLS[stillKey(subject, shot)] ?? null;
}

const FALLBACK: Partial<Record<Shot, Shot[]>> = {
  "label-wide": ["label", "hero-wide"],
  "hero-tall": ["pack"],
  "group-wide": ["group"],
  group: ["group-wide"],
};

/** Local demo products ship pre-baked stills; any other product from Shopify has none and is composited live. */
export function hasBakedStills(subject: StillSubject): boolean {
  return hasStill(subject, subject === "range" ? "group" : "pack");
}

/** The subject's own still for this shot or a close substitute; null when the subject has no baked stills. */
export function findStill(subject: StillSubject, shot: Shot): StillData | null {
  for (const k of [shot, ...(FALLBACK[shot] ?? []), "pack" as const]) {
    const found = getStill(subject, k);
    if (found) return found;
  }
  return null;
}

/** The still to show: the subject's own, else the range group shot. */
export function resolveStill(subject: StillSubject, shot: Shot): StillData {
  return findStill(subject, shot) ?? STILLS["range-group"];
}

// Shots the template composites live for any product (see bottle/shots.ts); the rest exist only as baked stills.
const LIVE: Shot[] = ["pack", "three-quarter", "label", "drop", "thumb", "hero-wide", "hero-tall"];

type Showable = Pick<ProductCard, "slug" | "baked" | "looks">;

/** Whether a page can show this shot of the product: baked for demo products, composited live when it has a bottle. */
export function canShow(product: Showable, shot: Shot): boolean {
  if (product.baked) return hasStill(product.slug, shot);
  return product.looks.length > 0 && LIVE.includes(shot);
}

/** The homepage sequence's first frame for a product, as baked: exactly what its canvas draws first. Null if not baked. */
export function posterStill(slug: Slug, tall: boolean): StillData | null {
  return STILLS[`${slug}-poster-${tall ? "tall" : "wide"}`] ?? findStill(slug, tall ? "hero-tall" : "hero-wide");
}

/** Gallery frames the product can show as its own picture, so a PDP never shows the same image twice. */
export function galleryShots(product: Pick<ProductCard, "slug" | "baked" | "looks" | "gallery">) {
  return product.gallery.filter((frame) => canShow(product, frame.shot));
}

export type AltSubject = Pick<ProductCard, "title" | "contains" | "separately" | "parts"> | "range";

export function stillAlt(subject: AltSubject, shot: Shot): string {
  if (subject === "range") return "Cuvette dropper bottles side by side on a basalt plinth";
  const p = subject;
  const what = isSet(p) ? `${p.parts.map((part) => part.title).join(" and ")} bottles` : `${p.title} serum in a glass dropper bottle`;
  switch (shot) {
    case "label":
    case "label-wide":
      return `Close-up of the ${p.title} label: lot and strength printed on the glass`;
    case "drop":
      return `A drop of ${p.title} falling from the dropper`;
    case "drop-stone":
      return `A bead of ${p.title} serum on the stone plinth`;
    case "carton":
      return `${p.title} carton beside the bottle`;
    default:
      return `${what} on a basalt plinth under a single light`;
  }
}

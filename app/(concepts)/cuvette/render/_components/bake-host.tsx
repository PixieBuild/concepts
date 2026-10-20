"use client";

import { useEffect } from "react";

import type { Shot, Slug } from "../../_lib/product";
import type { BottleLook } from "../../_lib/product-look";
import { Compositor } from "../../_components/bottle/compositor";
import { fontsReady } from "../../_components/bottle/label";
import { loadManifest } from "../../_components/bottle/manifest";
import { composeStill, planFor } from "../../_components/bottle/render";
import { cropFor, type ShotSource } from "../../_components/bottle/shots";

type Job = { base?: string; source: ShotSource; looks: BottleLook[]; shot?: Shot };

declare global {
  interface Window {
    __bottle?: {
      slugs: readonly Slug[];
      looksOf: (slug: Slug) => BottleLook[];
      fixtures: BottleLook[];
      manifest: (base?: string) => ReturnType<typeof loadManifest>;
      composite: (job: Job) => Promise<{ png: string; ms: number }>;
    };
  }
}

/** Dev-only: lets scripts/cuvette/bake-stills.mjs drive the same compositor the site uses. `looks` comes from the catalogue. */
export function BakeHost({ slugs, looks, fixtures }: { slugs: Slug[]; looks: Record<Slug, BottleLook[]>; fixtures: BottleLook[] }) {
  useEffect(() => {
    window.__bottle = {
      slugs,
      looksOf: (slug) => looks[slug] ?? [],
      fixtures,
      manifest: loadManifest,
      async composite({ base, source, looks, shot }) {
        const started = performance.now();
        const [manifest] = await Promise.all([loadManifest(base), fontsReady()]);
        if (!Compositor.get()) throw new Error("WebGL2 unavailable");
        const bitmap = await composeStill(manifest, planFor(manifest, source), looks);
        const [x, y, w, h] = (shot && cropFor(manifest, source, shot)) || [0, 0, bitmap.width, bitmap.height];
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d")!.drawImage(bitmap, x, y, w, h, 0, 0, w, h);
        return { png: canvas.toDataURL("image/png"), ms: Math.round(performance.now() - started) };
      },
    };
  }, [slugs, looks, fixtures]);
  return <p className="label p-6 text-muted-foreground">Bottle bake host</p>;
}

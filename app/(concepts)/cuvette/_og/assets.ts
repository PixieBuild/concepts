import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

import type { Shot } from "../_lib/product";
import { resolveStill, type StillSubject } from "../_lib/stills";

export const OG_SIZE = { width: 1200, height: 630 };

export const INK = "#0e0f10";
export const PAPER = "#ebebe8";
export const MUTED = "#9a9ea2";

const font = (file: string) => readFile(join(process.cwd(), "app/(concepts)/cuvette/_og", file));

export async function ogFonts() {
  const [light, thin, medium, mono] = await Promise.all([
    font("mona-sans-125-300.ttf"),
    font("mona-sans-125-200.ttf"),
    font("mona-sans-125-500.ttf"),
    font("fragment-mono-400.ttf"),
  ]);
  return [
    { name: "Mona Sans", data: thin, weight: 200 as const, style: "normal" as const },
    { name: "Mona Sans", data: light, weight: 300 as const, style: "normal" as const },
    { name: "Mona Sans", data: medium, weight: 500 as const, style: "normal" as const },
    { name: "Fragment Mono", data: mono, weight: 400 as const, style: "normal" as const },
  ];
}

/** A still cropped to exactly `width × height` (cover, centred) as a JPEG data URI. */
export async function stillDataUri(subject: StillSubject, shot: Shot, width: number, height: number, position: string = "centre") {
  const still = resolveStill(subject, shot);
  const jpeg = await sharp(join(process.cwd(), "public", still.src))
    .resize(width, height, { fit: "cover", position })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
  return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
}

/** A merchant image (Shopify CDN, or the mock store's local placeholder) cropped to `width × height`, or null if unreachable. */
export async function imageDataUri(src: string, width: number, height: number): Promise<string | null> {
  const remote = /^https?:\/\//.test(src);
  const source = remote
    ? await fetch(src)
        .then(async (r) => (r.ok ? Buffer.from(await r.arrayBuffer()) : null))
        .catch(() => null)
    : await readFile(join(process.cwd(), "public", src)).catch(() => null);
  if (!source) return null;
  const jpeg = await sharp(source).resize(width, height, { fit: "cover", position: "centre" }).jpeg({ quality: 88, mozjpeg: true }).toBuffer();
  return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
}

/** Photographic PNGs run to ~500 KB and some apps drop link previews above ~300 KB. */
export async function asJpeg(response: Response, contentType: string) {
  const jpeg = await sharp(Buffer.from(await response.arrayBuffer())).jpeg({ quality: 86, mozjpeg: true }).toBuffer();
  return new Response(new Uint8Array(jpeg), { headers: { "content-type": contentType } });
}

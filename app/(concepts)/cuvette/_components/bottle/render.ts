import { lookKey, type BottleLook } from "../../_lib/product-look";
import { Compositor } from "./compositor";
import { closePicture, decodePicture } from "./frames";
import { frameUrls, stillUrls, type Picture, type PictureUrls, type Rect, type TemplateManifest } from "./manifest";
import type { ShotSource } from "./shots";

export type PicturePlan = { urls: PictureUrls; picture: Picture; origin: [number, number]; owners: number };

export function planFor(manifest: TemplateManifest, source: ShotSource): PicturePlan {
  if (source.kind === "still") {
    const still = manifest.stills[source.name];
    return { urls: stillUrls(manifest, still), picture: still, origin: [0, 0], owners: still.owners };
  }
  const seq = manifest.sequence!;
  const frame = seq.chapters[source.chapter]?.frame ?? seq.items[0].frame;
  const item = seq.items.find((i) => i.frame === frame) ?? seq.items[0];
  return {
    urls: frameUrls(manifest, item, source.compact),
    picture: { size: seq.size, rect: item.rect, tiles: item.tiles },
    origin: source.compact ? [item.crop[0], item.crop[1]] : [0, 0],
    owners: 1,
  };
}

/** Fetches and composites one picture for `looks`, keeping nothing on the GPU after. */
async function compose(manifest: TemplateManifest, plan: PicturePlan, looks: BottleLook[]): Promise<ImageBitmap> {
  const compositor = Compositor.get();
  if (!compositor) throw new Error("WebGL2 unavailable");
  const [images] = await Promise.all([decodePicture(plan.urls), compositor.ready()]);
  const picture = compositor.upload(images, plan.picture, { origin: plan.origin, owners: plan.owners, encoding: manifest.encoding });
  closePicture(images);
  const target = compositor.target(picture.w, picture.h);
  try {
    compositor.composite(picture, looks, target, manifest);
    const canvas = document.createElement("canvas");
    compositor.present(canvas.getContext("2d")!, target);
    return await createImageBitmap(canvas);
  } finally {
    compositor.free(picture);
    compositor.freeTarget(target);
  }
}

const CACHE = 8;
const composed = new Map<string, Promise<ImageBitmap>>();

/** One composite per product and picture, shared by every place that shows it (a page and its bag, say). */
export function composeStill(manifest: TemplateManifest, plan: PicturePlan, looks: BottleLook[]): Promise<ImageBitmap> {
  const key = `${plan.urls.base}|${looks.map(lookKey).join("+")}`;
  let hit = composed.get(key);
  if (hit) composed.delete(key);
  else {
    hit = compose(manifest, plan, looks);
    hit.catch(() => composed.delete(key));
  }
  composed.set(key, hit);
  while (composed.size > CACHE) {
    const [oldest, bitmap] = composed.entries().next().value!;
    composed.delete(oldest);
    bitmap.then((b) => b.close()).catch(() => {});
  }
  return hit;
}

/** Draws a composite (or its `crop`) into a canvas no larger than its box needs at device pixels; CSS covers the rest. */
export function drawCover(canvas: HTMLCanvasElement, bitmap: ImageBitmap, crop: Rect | null = null) {
  const [sx, sy, sw, sh] = crop ?? [0, 0, bitmap.width, bitmap.height];
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const k = Math.min(1, Math.max((rect.width * dpr) / sw, (rect.height * dpr) / sh));
  canvas.width = Math.max(1, Math.round(sw * k));
  canvas.height = Math.max(1, Math.round(sh * k));
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
}

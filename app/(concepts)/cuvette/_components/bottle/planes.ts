import type { Picture } from "./manifest";

export type Blobs = { base: Blob; light: Blob; data: Blob };

/** A picture's planes as tightly packed bytes, one rect-sized layer per tile: what the GPU takes as it is. */
export type Planes = {
  base: { w: number; h: number; bytes: Uint8Array };
  /** R8 layers, one per light tile. */
  light: Uint8Array;
  /** RGBA layers, one per data tile. */
  data: Uint8Array;
};

export type PlaneLayout = Pick<Picture, "rect" | "tiles">;

type Context2D = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

export type MakeContext = (w: number, h: number) => Context2D;

// Byte for byte: the data images are numbers, not colours.
const RAW: ImageBitmapOptions = { premultiplyAlpha: "none", colorSpaceConversion: "none" };

function pixels(bitmap: ImageBitmap, make: MakeContext) {
  const ctx = make(bitmap.width, bitmap.height);
  ctx.drawImage(bitmap, 0, 0);
  const data = ctx.getImageData(0, 0, bitmap.width, bitmap.height, { colorSpace: "srgb" }).data;
  bitmap.close();
  return data;
}

/** Decodes a picture's three files and cuts its atlases into packed layers. */
export async function unpack(blobs: Blobs, layout: PlaneLayout, make: MakeContext): Promise<Planes> {
  const [b, l, d] = await Promise.all([createImageBitmap(blobs.base, RAW), createImageBitmap(blobs.light, RAW), createImageBitmap(blobs.data, RAW)]);
  const [lw, dw] = [l.width, d.width];
  const [bw, bh] = [b.width, b.height];
  const base = pixels(b, make);
  const [, , w, h] = layout.rect;

  const lightTiles = layout.tiles.filter((t) => t.file === "light");
  const atlas = pixels(l, make);
  const light = new Uint8Array(w * h * lightTiles.length);
  lightTiles.forEach((t, layer) => {
    for (let y = 0; y < h; y++) {
      let src = ((t.y + y) * lw + t.x) * 4;
      let dst = (layer * h + y) * w;
      for (let x = 0; x < w; x++, src += 4) light[dst++] = atlas[src];
    }
  });

  const dataTiles = layout.tiles.filter((t) => t.file === "data");
  const sheet = pixels(d, make);
  const data = new Uint8Array(w * h * 4 * dataTiles.length);
  dataTiles.forEach((t, layer) => {
    for (let y = 0; y < h; y++) {
      const src = ((t.y + y) * dw + t.x) * 4;
      data.set(sheet.subarray(src, src + w * 4), (layer * h + y) * w * 4);
    }
  });

  return { base: { w: bw, h: bh, bytes: new Uint8Array(base.buffer, base.byteOffset, base.byteLength) }, light, data };
}

export function transferables(planes: Planes): Transferable[] {
  return [planes.base.bytes.buffer as ArrayBuffer, planes.light.buffer as ArrayBuffer, planes.data.buffer as ArrayBuffer];
}

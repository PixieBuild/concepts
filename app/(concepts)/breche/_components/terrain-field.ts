import { DataTexture, LinearFilter, LinearMipmapLinearFilter, PlaneGeometry, RGBAFormat, UnsignedByteType, Vector3 } from "three";

import { TERRAIN } from "../_lib/content";

/** Heights in metres and the glacier mask (0–1), both rows north to south. */
export type Field = { heights: Float32Array; ice: Float32Array; size: number };

const mercator = (lat: number) => {
  const r = (lat * Math.PI) / 180;
  return Math.log(Math.tan(r) + 1 / Math.cos(r));
};
const NORTH = mercator(TERRAIN.north);
const SOUTH = mercator(TERRAIN.south);

/** Metres become kilometres in x and z (east and south) and an exaggerated kilometre in y. */
export function toWorld(lat: number, lon: number, metres: number, out = new Vector3()): Vector3 {
  const x = ((lon - TERRAIN.west) / (TERRAIN.east - TERRAIN.west) - 0.5) * TERRAIN.span;
  const z = ((NORTH - mercator(lat)) / (NORTH - SOUTH) - 0.5) * TERRAIN.span;
  return out.set(x, (metres / 1000) * TERRAIN.relief, z);
}

export const worldY = (metres: number) => (metres / 1000) * TERRAIN.relief;

/** Bilinear height in metres under a world x/z. */
export function heightAt(field: Field, x: number, z: number): number {
  const { heights, size } = field;
  const gx = Math.min(size - 1, Math.max(0, (x / TERRAIN.span + 0.5) * (size - 1)));
  const gy = Math.min(size - 1, Math.max(0, (z / TERRAIN.span + 0.5) * (size - 1)));
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const x1 = Math.min(size - 1, x0 + 1);
  const y1 = Math.min(size - 1, y0 + 1);
  const fx = gx - x0;
  const fy = gy - y0;
  const top = heights[y0 * size + x0] * (1 - fx) + heights[y0 * size + x1] * fx;
  const bottom = heights[y1 * size + x0] * (1 - fx) + heights[y1 * size + x1] * fx;
  return top * (1 - fy) + bottom * fy;
}

function soften(field: Float32Array, size: number) {
  const pass = (input: Float32Array, dx: number, dy: number) => {
    const output = new Float32Array(input.length);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const ax = Math.max(0, x - dx);
        const ay = Math.max(0, y - dy);
        const bx = Math.min(size - 1, x + dx);
        const by = Math.min(size - 1, y + dy);
        output[y * size + x] = (input[ay * size + ax] + 2 * input[y * size + x] + input[by * size + bx]) / 4;
      }
    }
    return output;
  };
  return pass(pass(field, 1, 0), 0, 1);
}

// Memoised so a remount reuses the one fetch; the page preloads the file, so this usually hits the cache.
let pending: Promise<Field> | null = null;

export function loadField(): Promise<Field> {
  pending ??= decodeField().catch((error: unknown) => {
    pending = null;
    throw error;
  });
  return pending;
}

async function decodeField(): Promise<Field> {
  const response = await fetch(TERRAIN.file);
  if (!response.ok) throw new Error(`Heightmap request failed: ${response.status}`);
  const bitmap = await createImageBitmap(await response.blob(), { colorSpaceConversion: "none", premultiplyAlpha: "none" });
  const { size } = TERRAIN;
  const canvas = new OffscreenCanvas(size, size);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("No 2D context for the heightmap");
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  const { data } = context.getImageData(0, 0, size, size);
  const raw = new Float32Array(size * size);
  const ice = new Float32Array(size * size);
  for (let i = 0; i < raw.length; i++) {
    raw[i] = TERRAIN.min + data[i * 4] * 256 + data[i * 4 + 1];
    ice[i] = data[i * 4 + 2] / 255;
  }
  return { heights: soften(raw, size), ice, size };
}

/** Object-space normals in RGB, normalised height in A; rows flip because the plane's v runs south to north. */
export function surfaceTexture(field: Field): DataTexture {
  const { heights, size } = field;
  const pixels = new Uint8Array(size * size * 4);
  const cell = TERRAIN.span / (size - 1);
  const scale = TERRAIN.relief / 1000 / (2 * cell);
  const range = TERRAIN.max - TERRAIN.min;
  const at = (x: number, y: number) => heights[Math.min(size - 1, Math.max(0, y)) * size + Math.min(size - 1, Math.max(0, x))];

  for (let y = 0; y < size; y++) {
    const row = size - 1 - y;
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * scale;
      const dz = (at(x, y + 1) - at(x, y - 1)) * scale;
      const length = Math.hypot(dx, 1, dz);
      const k = (row * size + x) * 4;
      pixels[k] = Math.round(((-dx / length) * 0.5 + 0.5) * 255);
      pixels[k + 1] = Math.round(((1 / length) * 0.5 + 0.5) * 255);
      pixels[k + 2] = Math.round(((-dz / length) * 0.5 + 0.5) * 255);
      pixels[k + 3] = Math.round(((at(x, y) - TERRAIN.min) / range) * 255);
    }
  }

  const texture = new DataTexture(pixels, size, size, RGBAFormat, UnsignedByteType);
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function boxBlur(input: Float32Array, size: number, radius: number) {
  const pass = (from: Float32Array, horizontal: boolean) => {
    const out = new Float32Array(from.length);
    const width = radius * 2 + 1;
    for (let line = 0; line < size; line++) {
      let sum = 0;
      const at = (i: number) => {
        const c = Math.min(size - 1, Math.max(0, i));
        return horizontal ? from[line * size + c] : from[c * size + line];
      };
      for (let i = -radius; i <= radius; i++) sum += at(i);
      for (let i = 0; i < size; i++) {
        out[horizontal ? line * size + i : i * size + line] = sum / width;
        sum += at(i + radius + 1) - at(i - radius);
      }
    }
    return out;
  };
  return pass(pass(input, true), false);
}

/** Depth below the surroundings broadly (R, ±90 m) and per couloir (B, ±30 m), glacier mask in G.
    Worked out in float so the snow line never terraces into the 8-bit height steps. */
export function detailTexture(field: Field): DataTexture {
  const { heights, ice, size } = field;
  const broad = boxBlur(boxBlur(heights, size, 4), size, 4);
  const near = boxBlur(heights, size, 2);
  const signed = (v: number) => Math.round((Math.min(1, Math.max(-1, v)) * 0.5 + 0.5) * 255);
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    const row = size - 1 - y;
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const k = (row * size + x) * 4;
      pixels[k] = signed((broad[i] - heights[i]) / 90);
      pixels[k + 1] = Math.round(ice[i] * 255);
      pixels[k + 2] = signed((near[i] - heights[i]) / 30);
      pixels[k + 3] = 255;
    }
  }
  const texture = new DataTexture(pixels, size, size, RGBAFormat, UnsignedByteType);
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

export function massifGeometry(field: Field, segments: number): PlaneGeometry {
  const plane = new PlaneGeometry(TERRAIN.span, TERRAIN.span, segments, segments);
  plane.rotateX(-Math.PI / 2);
  const position = plane.attributes.position;
  for (let i = 0; i < position.count; i++) position.setY(i, worldY(heightAt(field, position.getX(i), position.getZ(i))));
  plane.computeVertexNormals();
  plane.computeBoundingSphere();
  return plane;
}

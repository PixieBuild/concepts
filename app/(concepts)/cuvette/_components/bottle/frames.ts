import type { FrameImages } from "./compositor";
import type { PictureUrls } from "./manifest";

/** Decoded off the main thread, byte for byte: the data images are numbers, not colours. */
export async function decode(url: string, signal?: AbortSignal): Promise<ImageBitmap> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`${url} ${response.status}`);
  return decodeBlob(await response.blob());
}

export function decodeBlob(blob: Blob): Promise<ImageBitmap> {
  return createImageBitmap(blob, { premultiplyAlpha: "none", colorSpaceConversion: "none" });
}

export async function decodePicture(urls: PictureUrls, signal?: AbortSignal): Promise<FrameImages> {
  const [base, light, data] = await Promise.all([decode(urls.base, signal), decode(urls.light, signal), decode(urls.data, signal)]);
  return { base, light, data };
}

export function closePicture(images: FrameImages) {
  images.base.close();
  images.light.close();
  images.data.close();
}

type Connection = { saveData?: boolean; effectiveType?: string; downlink?: number };
const connection = () => (navigator as Navigator & { connection?: Connection }).connection;

/** Below this many Mbit/s the full sequence takes too long to fill in: the chapter stills stand in for it. */
export const SLOW_MBPS = 3;

/** Whether the visitor asked for less data, or is on a slow connection. */
export function saveData(): boolean {
  const c = connection();
  return Boolean(c?.saveData) || /(^|-)2g$/.test(c?.effectiveType ?? "");
}

/** Whether the browser already says the link is too slow for the full sequence (Safari never says; see onSlow). */
export function slowLink(): boolean {
  const c = connection();
  return saveData() || c?.effectiveType === "3g" || (Boolean(c?.downlink) && c!.downlink! < SLOW_MBPS);
}

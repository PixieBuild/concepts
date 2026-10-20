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

/** Whether the visitor asked for less data, or is on a slow connection. */
export function saveData(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return Boolean(connection?.saveData) || /(^|-)2g$/.test(connection?.effectiveType ?? "");
}

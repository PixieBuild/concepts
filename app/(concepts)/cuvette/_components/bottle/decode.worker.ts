import { transferables, unpack, type Blobs, type PlaneLayout } from "./planes";

export type DecodeJob = { id: number; blobs: Blobs; layout: PlaneLayout };

type Scope = {
  onmessage: ((e: MessageEvent<DecodeJob>) => void) | null;
  postMessage(message: unknown, transfer?: Transferable[]): void;
};

const scope = self as unknown as Scope;

const make = (w: number, h: number) => {
  const ctx = new OffscreenCanvas(w, h).getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("unsupported");
  return ctx;
};

scope.onmessage = async ({ data: job }) => {
  try {
    if (typeof OffscreenCanvas === "undefined") throw new Error("unsupported");
    const planes = await unpack(job.blobs, job.layout, make);
    scope.postMessage({ id: job.id, planes }, transferables(planes));
  } catch (error) {
    scope.postMessage({ id: job.id, error: String(error), unsupported: String(error).includes("unsupported") });
  }
};

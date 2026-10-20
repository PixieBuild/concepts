import type { DecodeJob } from "./decode.worker";
import { unpack, type Blobs, type PlaneLayout, type Planes } from "./planes";

type Reply = { id: number; planes?: Planes; error?: string; unsupported?: boolean };
type Pending = { job: DecodeJob; resolve: (p: Planes) => void; reject: (e: Error) => void; worker: number };

const makeOnPage = (w: number, h: number) => {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  return canvas.getContext("2d", { willReadFrequently: true })!;
};

/** Decodes and unpacks pictures on worker threads, so a frame's decode never holds up a scroll frame. Where workers
 * cannot draw (no OffscreenCanvas), it falls back to the page's own thread. */
export class PlaneDecoder {
  private workers: Worker[] = [];
  private load: number[] = [];
  private pending = new Map<number, Pending>();
  private next = 1;
  private onPage = false;

  constructor(count: number) {
    try {
      for (let i = 0; i < count; i++) {
        const worker = new Worker(new URL("./decode.worker.ts", import.meta.url), { type: "module" });
        worker.onmessage = (e: MessageEvent<Reply>) => this.reply(e.data);
        worker.onerror = () => this.fallBack();
        this.workers.push(worker);
        this.load.push(0);
      }
    } catch {
      this.fallBack();
    }
  }

  decode(blobs: Blobs, layout: PlaneLayout): Promise<Planes> {
    if (this.onPage || !this.workers.length) return unpack(blobs, layout, makeOnPage);
    return new Promise((resolve, reject) => {
      const job: DecodeJob = { id: this.next++, blobs, layout };
      const worker = this.load.indexOf(Math.min(...this.load));
      this.load[worker]++;
      this.pending.set(job.id, { job, resolve, reject, worker });
      this.workers[worker].postMessage(job);
    });
  }

  private reply({ id, planes, error, unsupported }: Reply) {
    const p = this.pending.get(id);
    if (!p) return;
    this.pending.delete(id);
    this.load[p.worker]--;
    if (planes) p.resolve(planes);
    else if (unsupported) {
      this.fallBack();
      unpack(p.job.blobs, p.job.layout, makeOnPage).then(p.resolve, p.reject);
    } else p.reject(new Error(error));
  }

  private fallBack() {
    if (this.onPage) return;
    this.onPage = true;
    this.workers.forEach((w) => w.terminate());
    this.workers = [];
    const pending = [...this.pending.values()];
    this.pending.clear();
    pending.forEach((p) => unpack(p.job.blobs, p.job.layout, makeOnPage).then(p.resolve, p.reject));
  }

  destroy() {
    this.workers.forEach((w) => w.terminate());
    this.workers = [];
    this.pending.forEach((p) => p.reject(new Error("destroyed")));
    this.pending.clear();
  }
}

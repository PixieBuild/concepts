import { cancelFrame, frame, type FrameData } from "motion";

import { lookKey, type BottleLook } from "../../_lib/product-look";
import { axisAt, compactCrop } from "./camera";
import { Compositor, type GpuPicture, type Ink, type LiveLight, type Warp } from "./compositor";
import { PlaneDecoder } from "./decoder";
import { lightAt } from "./light";
import { frameUrls, proxyUrls, type Picture, type PictureUrls, type Rect, type SequenceItem, type TemplateManifest } from "./manifest";
import type { Blobs, Planes } from "./planes";

export type PlayerOptions = {
  /** The portrait crop, for phones. */
  compact: boolean;
  /** Reduced motion: only the chapter frames, dissolved between as the chapter changes, never warped or relit. */
  keysOnly: boolean;
  /** Save-Data or a slow link: every other frame, a short look-ahead and nothing fetched ahead of need. */
  lean: boolean;
  /** The canvas's box in device pixels, which sets how far past 1x to paint. */
  box: { w: number; h: number };
  onFirstFrame?: () => void;
  onLost?: () => void;
};

const FADE_MS = 450;
const SHARPEN_MS = 60;
// This long without a scroll step is rest: full paint size, a settled dissolve, and nothing blurred on screen.
const REST_MS = 120;
// Proxies stand in only for a jump this far (in progress) past the sharp frames; a smaller gap holds the last sharp one.
// Phones step through every other frame, so the same gap there is half as many frames.
const JUMP = 0.03;
const JUMP_COMPACT = 0.05;
const HOLD_MS = 250;
// A frame held short of the scroll is warped on towards it, up to this many frames, so the camera never stops. A
// phone's frames are twice as far apart, and its swipes outrun the decoders more often.
const LEAD = 1;
const LEAD_COMPACT = 2;
// A glide too fast to load every frame on its way loads every 2nd, 4th or 8th: about this many to where it lands,
// on a fixed lattice, so frames already loading stay wanted as the landing estimate moves.
const PATH = 8;
const PATH_COMPACT = 4;
const MAX_STRIDE = 8;
// Smooth scroll (Lenis at lerp 0.1) eases out exponentially with this time constant: a glide lands its speed times
// this many ms further on. Touch momentum glides longer, so there the landing is a floor.
const GLIDE_MS = 167;
const SAMPLE_MS = 12;
// How long a full frame takes from its files to the GPU, to begin with: each decode then refines it. Frames the
// scroll passes sooner are not waited for.
const READY_MS = 40;
// The same for a proxy, at a quarter of the pixels, to begin with.
const PROXY_READY_MS = 30;
// The last stretch of a glide, in progress, where it is slow enough to read every frame: loaded before the way there.
const TAIL = 0.06;
// Progress per second past which proxies are decoded ahead, in case the scroll outruns the full frames.
const QUICK = 0.25;
// Before the page settles, and around long tasks, slow frames say nothing about the GPU.
const WARM_MS = 3000;
// The site header overlays the top of the phone's stage, in CSS pixels; the dropper's bulb stays below it.
const HEADER = 76;
const EPS = 1e-3;
// Painted pixels per frame, whatever the screen: the frames are 1600 wide, so past this only the type gets sharper
// while the GPU pays for every pixel twice in a crossfade. CSS covers the rest.
const PIXELS = 2.6e6;
const MAX_SCALE = 1.25;
const MIN_SCALE = 0.75;
// A phone's 3x screen shows a coarser paint plainly: there the governor stops at 1x.
const MIN_SCALE_COMPACT = 1;
const STEP = 0.125;
// Between two rendered frames the nearer one shows, warped onto the camera, and passing the middle of the gap cuts to
// the other. Any blend of the two, scrubbed or eased, double-exposes the dropper and the small type while it lasts.
const HYSTERESIS = 0.08;
const SKIP = 0.02;
const PROXIES = 12;
const PROXIES_COMPACT = 8;
const INKS = 4;

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smoothstep = (x: number) => {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
};
const percentile = (xs: number[], p: number) => [...xs].sort((a, b) => a - b)[Math.min(xs.length - 1, Math.floor(p * xs.length))] ?? 0;

type TierName = "full" | "proxy";

/** One resolution of the sequence: its files, what is decoded, and what is on the GPU. */
class Tier {
  blobs = new Map<number, Blobs>();
  loading = new Set<number>();
  failed = new Set<number>();
  decoding = new Set<number>();
  decoded = new Map<number, Planes>();
  pictures = new Map<number, GpuPicture>();
  inks = new Map<string, Ink>();
  spare: Ink[] = [];

  constructor(
    readonly name: TierName,
    readonly picture: (k: number) => Picture,
    readonly urls: (k: number) => PictureUrls,
  ) {}
}

type Job = { tier: Tier; k: number; steps: Generator<void, GpuPicture> };

// Plays the sequence for one product into its canvas: the frames either side of the scroll, warped and crossfaded.
// The screen only moves towards the scroll, never back; while full frames load it shows the proxies, then sharpens.
export class SequencePlayer {
  private frames: SequenceItem[];
  private chapters: number[];
  private compositor: Compositor;
  private decoder: PlaneDecoder;
  /** Proxies decode on their own worker, so a glide's full frames never queue them. */
  private proxyDecoder: PlaneDecoder | null = null;
  private full: Tier;
  private proxy: Tier | null = null;
  private fetching = new Map<number, AbortController>();
  private background = new AbortController();
  private job: Job | null = null;
  private compiled = false;
  private v = 0;
  private direction = 1;
  private moved = false;
  private input = 0;
  /** The fractional frame index on screen, null until the first paint. */
  private shown: number | null = null;
  private onProxy = new Set<number>();
  private mix = { lo: -1, goal: 0 };
  private sharpen = new Map<number, number>();
  private look: BottleLook;
  private key: string;
  private lookFade: { from: BottleLook; start: number } | null = null;
  private keyFade: { from: number; to: number; start: number } | null = null;
  private pointer = { x: 0, y: 0, on: 0, tx: 0, ty: 0, ton: 0, at: 0 };
  private running = false;
  private scheduled = false;
  private dirty = false;
  private first = false;
  private dead = false;
  /** The paint size this frame: the governed level while scrolling, the full size at rest. */
  private scale = 1;
  private top: number;
  private floor: number;
  private level: number;
  private retryAt = 0;
  private raisedAt = -Infinity;
  private backoff = 2000;
  private warmUntil = Infinity;
  private busyUntil = 0;
  private longTasks: PerformanceObserver | null = null;
  private holdSince = 0;
  private speed = 0;
  private sample = { t: 0, v: 0 };
  /** Where the scroll will come to rest, in progress, and its rate in progress per ms. */
  private land = 0;
  private rate = 0;
  private readyMs = READY_MS;
  private step = 1;
  private proxyReadyMs = PROXY_READY_MS;
  private capacity: number;
  private ahead: number;
  private lead: number;
  private decoders: number;
  private safeTop = 0;
  private size: [number, number];
  private ticks: number[] = [];
  private draws: number[] = [];
  private lastTick = 0;
  private lastDraw = 0;
  private cooldown = 0;
  /** The draw gap before the last step down, to check the step helped. */
  private stepped: number | null = null;
  /** Reduced motion, or a GPU too slow to paint every scroll frame: chapter frames only. */
  private keysOnly: boolean;

  constructor(
    private canvas: HTMLCanvasElement,
    private manifest: TemplateManifest,
    look: BottleLook,
    private options: PlayerOptions,
  ) {
    const compositor = Compositor.on(canvas);
    if (!compositor) throw new Error("WebGL2 unavailable");
    this.compositor = compositor;
    this.keysOnly = options.keysOnly || compositor.software;
    const seq = manifest.sequence!;
    const items = [...seq.items].sort((a, b) => a.progress - b.progress);
    const chapterFrames = new Set(seq.chapters.map((c) => c.frame));
    // Phones and slow links take every other frame: the warp and the crossfade carry the camera between them.
    this.frames = this.keysOnly
      ? items.filter((i) => chapterFrames.has(i.frame))
      : options.lean || options.compact
        ? items.filter((i, k) => k % 2 === 0 || chapterFrames.has(i.frame))
        : items;
    if (!this.frames.length) this.frames = items.slice(0, 1);
    this.chapters = seq.chapters.map((c) => this.nearest(c.progress));
    canvas.addEventListener("webglcontextlost", this.onLost);
    this.size = seq.size;

    const item = (k: number) => this.frames[k];
    this.full = new Tier("full", (k) => ({ size: seq.size, rect: item(k).rect, tiles: item(k).tiles }), (k) => frameUrls(manifest, item(k), false));
    const proxy = seq.proxy;
    if (proxy && !this.keysOnly) {
      const byFrame = new Map(proxy.items.map((p) => [p.frame, p]));
      if (this.frames.every((f) => byFrame.has(f.frame))) {
        this.proxy = new Tier(
          "proxy",
          (k) => ({ size: proxy.size, ...byFrame.get(item(k).frame)! }),
          (k) => proxyUrls(manifest, item(k).frame),
        );
      }
    }

    const [w, h] = options.compact ? [Math.round(seq.size[1] * seq.compact.aspect), seq.size[1]] : seq.size;
    const cover = Math.max(options.box.w / w, options.box.h / h);
    const fit = Math.min(cover, Math.sqrt(PIXELS / (w * h)), MAX_SCALE);
    const dpr = window.devicePixelRatio || 1;
    const steps = (x: number) => Math.ceil(x / STEP - 1e-6) * STEP;
    // Software GL only ever paints a chapter frame or a dissolve, so it can afford 1x.
    this.top = options.lean || (this.keysOnly && compositor.software) ? Math.min(1, clamp(steps(fit), MIN_SCALE, MAX_SCALE)) : clamp(steps(fit), MIN_SCALE, MAX_SCALE);
    // The governor never paints the bottle coarser than the CSS pixels it fills.
    this.floor = Math.min(this.top, Math.max(options.compact ? MIN_SCALE_COMPACT : MIN_SCALE, steps(cover / dpr)));
    this.level = this.scale = this.top;
    this.safeTop = (HEADER * dpr) / Math.max(cover, 1e-3);
    // A full frame on the GPU is about 25 MB: desktops hold a longer run of them ahead of the scroll than phones do.
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    this.capacity = this.keysOnly ? this.frames.length : options.lean ? 5 : options.compact ? (memory >= 4 ? 8 : 6) : memory >= 8 ? 12 : 8;
    this.ahead = options.lean ? 4 : options.compact ? 8 : 14;
    this.lead = options.compact ? LEAD_COMPACT : LEAD;
    const workers = options.lean ? 1 : !options.compact && navigator.hardwareConcurrency >= 8 ? 3 : 2;
    this.decoders = workers + 1;
    this.decoder = new PlaneDecoder(workers);
    if (this.proxy) this.proxyDecoder = new PlaneDecoder(1);
    try {
      this.longTasks = new PerformanceObserver((list) => {
        for (const e of list.getEntries()) this.busyUntil = Math.max(this.busyUntil, e.startTime + e.duration + 300);
      });
      this.longTasks.observe({ type: "longtask" });
    } catch {
      this.longTasks = null;
    }
    this.look = look;
    this.key = lookKey(look);
    compositor.ready().then(
      () => {
        this.compiled = true;
        this.request();
      },
      // Shaders that will not compile leave the poster up.
      () => this.destroy(),
    );
  }

  private onLost = () => {
    if (this.dead) return;
    this.dead = true;
    cancelFrame(this.tick);
    this.fetching.forEach((c) => c.abort());
    this.background.abort();
    this.decoder.destroy();
    this.proxyDecoder?.destroy();
    this.longTasks?.disconnect();
    this.options.onLost?.();
  };

  private nearest(v: number) {
    let best = 0;
    this.frames.forEach((f, i) => {
      if (Math.abs(f.progress - v) < Math.abs(this.frames[best].progress - v)) best = i;
    });
    return best;
  }

  /** The fractional frame index at progress v. */
  private indexAt(v: number): number {
    const f = this.frames;
    if (this.keysOnly) return this.chapters[Math.round(clamp(v) * (this.chapters.length - 1))] ?? 0;
    if (v <= f[0].progress) return 0;
    const last = f.length - 1;
    if (v >= f[last].progress) return last;
    let lo = 0;
    let hi = last;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (f[mid].progress <= v) lo = mid;
      else hi = mid;
    }
    const span = f[hi].progress - f[lo].progress;
    return span < 1e-6 ? hi : lo + (v - f[lo].progress) / span;
  }

  private progressAt(i: number): number {
    const lo = Math.floor(i);
    const t = i - lo;
    const a = this.frames[lo].progress;
    return t < EPS ? a : a + (this.frames[Math.min(lo + 1, this.frames.length - 1)].progress - a) * t;
  }

  private get target() {
    return this.indexAt(clamp(this.v));
  }

  /** The full frames on the GPU (read by the QA probes). */
  get pictures() {
    return this.full.pictures;
  }

  setProgress(v: number) {
    if (v !== this.v) {
      const now = performance.now();
      const a = this.sample;
      if (now - this.input > 100) {
        this.rate = this.speed = 0;
        Object.assign(a, { t: now, v: this.v });
      } else if (now - a.t >= SAMPLE_MS) {
        // Scroll steps arrive unevenly, sometimes two in a frame: the rate is taken over a frame or more, and smoothed.
        const rate = (v - a.v) / (now - a.t);
        this.rate = rate * this.rate > 0 ? 0.5 * this.rate + 0.5 * rate : rate;
        this.speed = 0.7 * this.speed + 0.3 * Math.abs(rate) * 1000;
        Object.assign(a, { t: now, v });
      }
      this.land = clamp(v + this.rate * GLIDE_MS);
      this.direction = v > this.v ? 1 : -1;
      this.moved = true;
      this.input = now;
    }
    this.v = v;
    this.pump();
    this.request();
  }

  /** The fractional frame index the scroll is gliding to: where it is, once it rests. */
  private landing(now = performance.now()): number {
    return this.resting(now) ? this.target : this.indexAt(this.land);
  }

  setLook(look: BottleLook) {
    const key = lookKey(look);
    if (key === this.key) return;
    if (this.shown !== null) this.lookFade = { from: this.look, start: 0 };
    this.look = look;
    this.key = key;
    this.request();
  }

  /** The pointer over the stage, -1..1 across it; off when it leaves. Reduced motion and software GL ignore it. */
  setPointer(x: number, y: number, on: boolean) {
    if (this.keysOnly) return;
    const p = this.pointer;
    const [tx, ty, ton] = on ? [clamp(x, -1, 1), clamp(y, -1, 1), 1] : [0, 0, 0];
    if (Math.abs(tx - p.tx) + Math.abs(ty - p.ty) + Math.abs(ton - p.ton) < 2e-3) return;
    Object.assign(p, { tx, ty, ton });
    this.request();
  }

  setRunning(running: boolean) {
    if (running === this.running) return;
    this.running = running;
    if (running) {
      this.pump();
      this.request();
      return;
    }
    cancelFrame(this.tick);
    this.scheduled = false;
    this.fetching.forEach((c) => c.abort());
    this.fetching.clear();
  }

  destroy() {
    this.dead = true;
    cancelFrame(this.tick);
    this.fetching.forEach((c) => c.abort());
    this.background.abort();
    this.decoder.destroy();
    this.proxyDecoder?.destroy();
    this.longTasks?.disconnect();
    this.job?.steps.return(undefined as never);
    this.job = null;
    this.canvas.removeEventListener("webglcontextlost", this.onLost);
    for (const tier of [this.full, this.proxy]) {
      if (!tier) continue;
      if (!this.compositor.isLost) {
        tier.pictures.forEach((p) => this.compositor.free(p));
        [...tier.inks.values(), ...tier.spare].forEach((t) => this.compositor.freeTarget(t));
      }
      tier.pictures.clear();
      tier.decoded.clear();
      tier.inks.clear();
      tier.spare = [];
    }
  }

  /** Frames by priority: the pair at the scroll, then, in a glide, the frames it slows into alongside those on its way,
   * then more ahead than behind, so a swipe from rest has frames waiting and a turn back still has a few. A fast scroll
   * loads a stepped path to where it will land, not everything on the way, so the screen steps along with it. */
  private wanted(): number[] {
    const n = this.frames.length;
    const order: number[] = [];
    const push = (k: number | undefined) => k !== undefined && k >= 0 && k < n && order.push(k);
    if (this.keysOnly) {
      const t = Math.round(this.target);
      push(t);
      this.chapters.forEach(push);
      return [...new Set(order)];
    }
    const x = this.target;
    const travel = this.moved ? this.direction : 1;
    const near = travel > 0 ? Math.floor(x) : Math.ceil(x);
    const edge = travel > 0 ? Math.ceil(x) : Math.floor(x);
    // Frames the scroll passes before they could load go last, even the pair it is on: it cuts past them to the next
    // one up, or shows their proxies.
    const now = performance.now();
    const passed = Math.abs(this.landing(now) - x) * (1 - Math.exp(-this.readyMs / GLIDE_MS));
    const soon = this.resting(now) ? 0 : Math.max(0, Math.floor(passed) - 1);
    if (!soon) {
      push(near);
      push(edge);
    }
    const tail = this.tail(edge, travel);
    const ahead = this.path(edge, travel, soon, this.ahead);
    // The scroll reaches the next frame on its way before the frames it slows into: that one loads first.
    for (let d = 1; d <= 3; d++) {
      push(ahead[2 * d - 2]);
      push(tail[2 * d - 2]);
      push(ahead[2 * d - 1]);
      push(tail[2 * d - 1]);
      if (d <= 2 && !soon) push(near - d * travel);
    }
    tail.slice(6).forEach(push);
    ahead.slice(6).forEach(push);
    for (let d = 3; d <= this.ahead; d++) push(near - d * travel);
    push(near);
    push(edge);
    for (let d = 1; d <= soon; d++) push(edge + d * travel);
    return [...new Set(order)];
  }

  /** Up to `count` frames past `edge` and the `skip` after it, at the stride: every one at a walk, every 2nd, 4th or
   * 8th in a fast glide, half that apart when `fine`. A power of two on a fixed lattice, so a frame chosen stays chosen
   * as the glide slows. */
  private path(edge: number, travel: number, skip: number, count: number, fine = false): number[] {
    const end = this.landing();
    const step = Math.max(1, this.stride(edge, travel) / (fine ? 2 : 1));
    const first = edge + (skip + 1) * travel;
    const ks: number[] = [];
    for (let k = travel > 0 ? Math.ceil(first / step) * step : Math.floor(first / step) * step; ks.length < count && k >= 0 && k < this.frames.length; k += step * travel) {
      // A stepped path ends where the glide does: past it, the next scroll could go either way.
      if (step > 1 && (k - end) * travel >= step) break;
      ks.push(k);
    }
    return ks;
  }

  /** The full frames' spacing along a glide: widened as soon as it is too fast for the last one, narrowed only once
   * well below it, so a speed near the line does not swap one set of frames for the other while they decode. */
  private stride(edge: number, travel: number): number {
    const need = ((this.landing() - edge) * travel) / (this.options.compact ? PATH_COMPACT : PATH);
    const fit = need > 1 ? Math.min(MAX_STRIDE, 2 ** Math.ceil(Math.log2(need))) : 1;
    if (fit > this.step || need < this.step / 3) this.step = fit;
    return this.step;
  }

  /** The frames a glide slows into, from where it lands back towards the scroll: empty unless it lands past `edge`. */
  private tail(edge: number, travel: number): number[] {
    const end = this.landing();
    if ((end - edge) * travel <= 1) return [];
    const stop = travel > 0 ? Math.ceil(end) : Math.floor(end);
    const ks: number[] = [];
    const last = this.frames.length - 1;
    for (let k = clamp(stop, 0, last); (k - edge) * travel > 0; k -= travel) {
      if (ks.length >= 2 && Math.abs(this.frames[k].progress - this.progressAt(end)) > TAIL) break;
      ks.push(k);
    }
    return ks;
  }

  /** The proxies a fast scroll needs, wherever no full frame is up: the pair at the scroll, then a stepped path along
   * a glide too fast to show every frame, so the screen steps along with it rather than holding. */
  private proxyWanted(): number[] {
    if (!this.proxy) return [];
    const x = this.target;
    const travel = this.moved ? this.direction : 1;
    const edge = travel > 0 ? Math.ceil(x) : Math.floor(x);
    const pair = [travel > 0 ? Math.floor(x) : Math.ceil(x), edge];
    // Twice as dense as the full frames' path, so the proxies fall between them; those the glide passes before they
    // could be up are left out, and the pair at the scroll only goes first once nothing is passed.
    const now = performance.now();
    const skip = this.resting(now) ? 0 : Math.floor(Math.abs(this.landing(now) - x) * (1 - Math.exp(-this.proxyReadyMs / GLIDE_MS)));
    const path = this.path(edge, travel, skip, 6, true);
    const ks = skip ? [...path, ...pair] : [...pair, ...path];
    return [...new Set(ks)].filter((k) => k >= 0 && k < this.frames.length && !this.full.pictures.has(k));
  }

  /** Starts the fetches the scroll needs, cancels those it has left behind, and decodes what comes next. */
  private pump() {
    if (!this.running || this.dead) return;
    const full = this.full;
    const wanted = this.wanted();
    const keep = new Set(wanted);
    for (const [k, c] of this.fetching) {
      if (keep.has(k)) continue;
      c.abort();
      this.fetching.delete(k);
    }
    const limit = this.options.lean ? 2 : 4;
    // Until the first frame is up, nothing competes with its three files.
    for (const k of this.first ? wanted : wanted.slice(0, 1)) {
      if (this.fetching.size >= limit) break;
      if (full.blobs.has(k) || full.failed.has(k) || full.loading.has(k)) continue;
      const controller = new AbortController();
      this.fetching.set(k, controller);
      void this.load(full, k, controller.signal, "high").finally(() => {
        if (this.fetching.get(k) === controller) this.fetching.delete(k);
      });
    }
    this.decode(full, wanted.slice(0, this.capacity), this.decoders);
    // A slow scroll leaves the full frames to show every step; a glide that will outrun them gets proxies ahead of it.
    const now = performance.now();
    const quick = !this.resting(now) && (this.speed > QUICK || Math.abs(this.landing(now) - this.target) > 3);
    // One proxy decoding and one queued: a longer queue decodes for where the scroll was.
    if (this.proxy) this.decode(this.proxy, quick || this.jumping(now) ? this.proxyWanted() : [], 2);
    this.job ??= this.ready();
    if (this.job) this.schedule();
  }

  /** Decodes the first of `ks` not yet decoded, up to `slots` at a time; drops decodes the scroll has left. */
  private decode(tier: Tier, ks: number[], slots: number) {
    const keep = new Set(ks);
    for (const k of tier.decoded.keys()) if (!keep.has(k) || tier.pictures.has(k)) tier.decoded.delete(k);
    for (const k of ks) {
      if (tier.decoding.size + tier.decoded.size >= slots) break;
      if (tier.pictures.has(k) || tier.decoded.has(k) || tier.decoding.has(k) || this.uploading(tier, k) || !tier.blobs.has(k)) continue;
      tier.decoding.add(k);
      const start = performance.now();
      (tier === this.proxy && this.proxyDecoder ? this.proxyDecoder : this.decoder)
        .decode(tier.blobs.get(k)!, tier.picture(k))
        .then(
          (planes) => {
            const ms = performance.now() - start + 8;
            if (tier === this.full) this.readyMs = clamp(0.8 * this.readyMs + 0.2 * ms, 20, 150);
            else this.proxyReadyMs = clamp(0.8 * this.proxyReadyMs + 0.2 * ms, 10, 100);
            // A frame that went up meanwhile (or is going up) needs no second copy.
            if (!this.dead && !tier.pictures.has(k) && !this.uploading(tier, k)) tier.decoded.set(k, planes);
          },
          () => {
            if (this.dead) return;
            tier.blobs.delete(k);
            tier.failed.add(k);
          },
        )
        .finally(() => {
          tier.decoding.delete(k);
          this.pump();
        });
    }
  }

  private uploading(tier: Tier, k: number) {
    return this.job?.tier === tier && this.job.k === k;
  }

  private async load(tier: Tier, k: number, signal: AbortSignal, priority: RequestPriority) {
    const urls = tier.urls(k);
    tier.loading.add(k);
    try {
      const get = (url: string) => fetch(url, { signal, priority }).then((r) => (r.ok ? r.blob() : Promise.reject(new Error(url))));
      const [base, light, data] = await Promise.all([get(urls.base), get(urls.light), get(urls.data)]);
      tier.blobs.set(k, { base, light, data });
    } catch {
      // Cancelled, or failed: a failed frame is skipped and the screen holds on its neighbour.
      if (!signal.aborted) tier.failed.add(k);
    } finally {
      tier.loading.delete(k);
      this.pump();
    }
  }

  /** After the first paint: every proxy, then (on a fast enough link) every full frame, nearest the scroll first, at
   * low priority so the files fetch and decode are the only waits left. */
  private async prefetch() {
    const connection = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
    const fast = !connection?.effectiveType || connection.effectiveType === "4g";
    const queue: [Tier, number][] = [];
    const byDistance = () => this.frames.map((_, k) => k).sort((a, b) => Math.abs(a - this.target) - Math.abs(b - this.target));
    if (this.proxy) byDistance().forEach((k) => queue.push([this.proxy!, k]));
    if (fast && !this.options.lean && !this.keysOnly) byDistance().forEach((k) => queue.push([this.full, k]));
    const signal = this.background.signal;
    const worker = async () => {
      for (let next = queue.shift(); next && !signal.aborted; next = queue.shift()) {
        const [tier, k] = next;
        if (tier.blobs.has(k) || tier.failed.has(k) || tier.loading.has(k)) continue;
        await this.load(tier, k, signal, "low");
      }
    };
    await Promise.all([worker(), worker(), worker()]);
  }

  /** The next picture to put on the GPU: proxies first while the scroll jumps past the full frames, then the full window. */
  private ready(): Job | null {
    if (this.proxy && this.jumping(performance.now())) {
      for (const k of this.proxyWanted()) {
        if (!this.proxy.decoded.has(k) || this.proxy.pictures.has(k)) continue;
        if (this.room(this.proxy, this.options.compact ? PROXIES_COMPACT : PROXIES, this.proxyWanted(), k)) return this.start(this.proxy, k);
      }
    }
    const window = this.wanted().slice(0, this.capacity);
    const k = window.find((i) => !this.full.pictures.has(i) && this.full.decoded.has(i));
    if (k === undefined || !this.room(this.full, this.capacity, window, k)) return null;
    return this.start(this.full, k);
  }

  private start(tier: Tier, k: number): Job {
    const planes = tier.decoded.get(k)!;
    tier.decoded.delete(k);
    return { tier, k, steps: this.compositor.uploadPlanes(planes, tier.picture(k)) };
  }

  /** Makes room in `tier` for frame k: evicts what the scroll has left, else, since the frames on screen hold places
   * outside the window, the window's least needed frame ranked below k. False when everything resident is needed. */
  private room(tier: Tier, capacity: number, window: number[], k: number): boolean {
    if (tier.pictures.size < capacity) return true;
    const keep = new Set(window);
    const pinned = this.pinned();
    const victim =
      [...tier.pictures.keys()].filter((i) => !keep.has(i) && !pinned.has(i)).sort((a, b) => Math.abs(b - this.target) - Math.abs(a - this.target))[0] ??
      window.slice(window.indexOf(k) + 1).findLast((i) => tier.pictures.has(i) && !pinned.has(i));
    if (victim === undefined) return false;
    this.evict(tier, victim);
    return true;
  }

  /** Uploads in bands until the deadline; true while there is more to do. */
  private work(deadline: number): boolean {
    while (performance.now() < deadline) {
      this.job ??= this.ready();
      const job = this.job;
      if (!job) return false;
      const step = job.steps.next();
      if (!step.done) continue;
      this.job = null;
      job.tier.pictures.set(job.k, step.value);
      // A frame on screen as its proxy sharpens into the full one rather than popping.
      if (job.tier === this.full && this.onProxy.has(job.k)) this.sharpen.set(job.k, 0);
      this.dirty = true;
      this.pump();
    }
    return true;
  }

  /** The frames on screen, which stay until something replaces them. */
  private pinned(): Set<number> {
    const set = new Set<number>();
    if (this.shown !== null) {
      set.add(Math.floor(this.shown));
      if (this.shown % 1 > EPS) set.add(Math.floor(this.shown) + 1);
    }
    if (this.keyFade) set.add(this.keyFade.from).add(this.keyFade.to);
    return set;
  }

  private evict(tier: Tier, k: number) {
    const p = tier.pictures.get(k);
    if (!p) return;
    tier.pictures.delete(k);
    for (const [id, ink] of tier.inks) {
      if (!id.startsWith(`${k}|`)) continue;
      tier.inks.delete(id);
      tier.spare.push(ink);
    }
    this.compositor.free(p);
  }

  /** Frame k's print for a look, reprinting into a spare texture when it has none. */
  private ink(tier: Tier, k: number, look: BottleLook): Ink {
    const id = `${k}|${lookKey(look)}`;
    const hit = tier.inks.get(id);
    if (hit) {
      tier.inks.delete(id);
      tier.inks.set(id, hit);
      return hit;
    }
    // Two frames on screen, two more for a look's crossfade: older prints are recycled.
    while (tier.inks.size >= INKS) {
      const [oldest, ink] = tier.inks.entries().next().value!;
      tier.inks.delete(oldest);
      tier.spare.push(ink);
    }
    const ink = this.compositor.print(tier.pictures.get(k)!, [look], this.manifest, tier.spare.pop() ?? null, true);
    tier.inks.set(id, ink);
    return ink;
  }

  private request() {
    this.dirty = true;
    this.schedule();
  }

  // Motion's frame loop: the scroll's change event runs inside it, so the bottle paints on the same frame as the copy.
  private schedule() {
    if (!this.running || this.dead || this.scheduled) return;
    this.scheduled = true;
    frame.render(this.tick);
  }

  private tick = ({ timestamp }: FrameData) => {
    this.scheduled = false;
    if (this.dead || this.compositor.isLost) return;
    const now = performance.now();
    let again = false;
    let drew = false;
    if (this.dirty && this.compiled) {
      this.dirty = false;
      drew = true;
      again = this.draw(now);
    }
    this.govern(now, timestamp, drew);
    // Uploads take what is left of the frame: little while the scroll moves and the screen keeps up, more otherwise.
    const scrolling = now - this.input < 200;
    const lag = this.shown === null ? Infinity : Math.abs(this.target - this.shown);
    const budget = scrolling ? (lag <= this.lead ? 3 : 6) : 10;
    const more = this.work(performance.now() + budget);
    if (again) this.dirty = true;
    // Ticking every frame while the scroll moves keeps the governor's frame gaps true even when the scroll skips one.
    if (again || more || this.dirty || !this.resting(now)) this.schedule();
  };

  /** Steps the scrolling paint size down while drawing keeps missing the display's refresh (a GPU that cannot keep
   * up), and back up after a rest, waiting longer each time a retry fails. Rest always paints at the full size. Gaps
   * are timed from the frame loop's start, so the scroll's own work earlier in the frame does not count. */
  private govern(now: number, at: number, drew: boolean) {
    const gap = at - this.lastTick;
    const fair = !this.resting(now) && now > this.warmUntil && now > this.busyUntil;
    if (this.lastTick && gap < 100) {
      this.ticks.push(gap);
      if (this.ticks.length > 120) this.ticks.shift();
      if (fair && drew && this.lastDraw === this.lastTick) {
        this.draws.push(gap);
        if (this.draws.length > 30) this.draws.shift();
      }
    }
    this.lastTick = at;
    if (drew) this.lastDraw = at;
    if (this.options.lean || this.keysOnly) return;
    // Slow means under 50 fps: a fast display held to 60 by the page keeps its sharpness.
    const full = this.draws.length >= 30;
    const median = percentile(this.draws, 0.5);
    const slow = full && median > Math.max(1.35 * percentile(this.ticks, 0.1), 20);
    if (full && this.stepped !== null) {
      // A step down that left drawing no faster was not the GPU's doing: it is undone, and the size kept from then on.
      if (slow && median > 0.9 * this.stepped) {
        this.level = this.floor = Math.min(this.top, this.level + STEP);
        this.draws = [];
        this.dirty = true;
      }
      this.stepped = null;
    } else if (slow && now >= this.cooldown && this.level > this.floor) {
      this.stepped = median;
      this.level = Math.max(this.floor, this.level - STEP);
      this.draws = [];
      this.cooldown = now + 1500;
      if (now - this.raisedAt < 5000) this.backoff = Math.min(60000, this.backoff * 2);
      this.retryAt = now + this.backoff;
      this.dirty = true;
    } else if (this.level < this.top && this.resting(now) && now >= this.retryAt) {
      this.stepped = null;
      this.level = Math.min(this.top, this.level + STEP);
      this.raisedAt = now;
      this.retryAt = now + this.backoff;
      this.draws = [];
    }
  }

  private resting(now: number) {
    return now - this.input >= REST_MS;
  }

  /** The furthest point from `from` towards `to` that the frames passing `has` can show. */
  private reach(from: number, to: number, has: (k: number) => boolean): number {
    if (has(Math.floor(to)) && (to % 1 < EPS || has(Math.floor(to) + 1))) return to;
    const dir = to > from ? 1 : -1;
    const end = dir > 0 ? Math.floor(to) : Math.ceil(to);
    for (let k = end; dir > 0 ? k > from : k < from; k -= dir) if (has(k)) return k;
    return from;
  }

  /** How far, in progress, the scroll has run past what the full frames on the GPU can show from the screen. */
  private behind(): number {
    const to = this.target;
    const sharp = this.reach(this.shown ?? to, to, (k) => this.full.pictures.has(k));
    return Math.abs(this.progressAt(to) - this.progressAt(sharp));
  }

  /** Proxies stand in only for a jump the full frames cannot follow mid-scroll, or for a hold long enough to read as
   * a stall. */
  private jumping(now: number): boolean {
    if (!this.proxy) return false;
    if (this.holdSince > 0 && now - this.holdSince > HOLD_MS) return true;
    return !this.resting(now) && this.behind() >= (this.options.compact ? JUMP_COMPACT : JUMP);
  }

  /** Where the screen goes next: towards the scroll on full frames, holding the last sharp one through a small gap. */
  private advance(from: number | null, to: number, now: number): number | null {
    const full = (k: number) => this.full.pictures.has(k);
    if (from === null) {
      if (full(Math.floor(to)) && (to % 1 < EPS || full(Math.floor(to) + 1))) return to;
      // The first paint: whichever resident frame is nearest the scroll.
      const ks = [...this.full.pictures.keys()].sort((a, b) => Math.abs(a - to) - Math.abs(b - to));
      return ks.length ? ks[0] : null;
    }
    const dir = to > from ? 1 : -1;
    const sharp = this.near(to, dir, full) ?? this.reach(from, to, full);
    // A proxy on screen moves on like a full frame would, never holding for the full one to come up.
    const onProxy = !full(Math.floor(from)) || (from % 1 > EPS && !full(Math.floor(from) + 1));
    if (Math.abs(to - sharp) <= this.lead + EPS || (!onProxy && !this.jumping(now))) return sharp;
    const any = (k: number) => full(k) || Boolean(this.proxy?.pictures.has(k));
    return this.near(to, dir, any) ?? this.reach(from, to, any);
  }

  /** When the frames short of the scroll leave the camera trailing it, the nearest frame just past it, which the warp
   * pulls back onto the camera instead: null when the frames short of it are close enough, or none past it is up. Only
   * a frame the glide will pass: the dropper moves between frames, and must never move back when the scroll stops. */
  private near(to: number, dir: number, has: (k: number) => boolean): number | null {
    const lo = Math.floor(to);
    if (has(lo) && (to % 1 < EPS || has(lo + 1))) return null;
    const end = this.landing();
    for (let d = 0; d <= this.lead; d++) {
      const short = dir > 0 ? lo - d : Math.ceil(to) + d;
      if (Math.abs(short - to) <= this.lead && has(short)) return null;
      const past = dir > 0 ? Math.ceil(to) + d : lo - d;
      if (Math.abs(past - to) <= this.lead && (end - past) * dir >= 0 && past >= 0 && past < this.frames.length && has(past)) return past;
    }
    return null;
  }

  /** Which of frame lo and the next shows, 0 or 1, with the scroll t of the way across the gap: the nearer, held a
   * little past the middle so a scroll resting there does not flicker between them. */
  private settle(lo: number, t: number): number {
    const m = this.mix;
    if (lo + 1 >= this.frames.length) t = 0;
    if (m.lo !== lo) Object.assign(m, { lo, goal: Math.round(t) });
    else if (t > 0.5 + HYSTERESIS) m.goal = 1;
    else if (t < 0.5 - HYSTERESIS) m.goal = 0;
    return m.goal;
  }

  /** Where to draw picture k so it sits on the camera at progress q: its frame pixel for each output pixel. */
  private map(k: number, q: number, warp: boolean): Warp {
    const from = this.frames[k].progress;
    const [vx, vy] = this.view(warp ? q : from);
    if (!warp || Math.abs(q - from) < 1e-6) return [1 / this.scale, vx, vy];
    const a = axisAt(from, this.size);
    const b = axisAt(q, this.size);
    const m = Math.hypot(a.foot[0] - a.shoulder[0], a.foot[1] - a.shoulder[1]) / Math.hypot(b.foot[0] - b.shoulder[0], b.foot[1] - b.shoulder[1]);
    if (!Number.isFinite(m)) return [1 / this.scale, vx, vy];
    return [m / this.scale, a.foot[0] + m * (vx - b.foot[0]), a.foot[1] + m * (vy - b.foot[1])];
  }

  /** The part of the wide frame shown at progress v: all of it, or the phone's window. */
  private view(v: number): Rect {
    const seq = this.manifest.sequence!;
    return this.options.compact ? compactCrop(v, this.size, seq.compact.aspect, this.safeTop) : [0, 0, ...this.size];
  }

  /** Paints frame k from one tier; a proxy is the same frame at a fraction of the pixels, so the map scales by that. */
  private paint(tier: Tier, k: number, look: BottleLook, q: number, live: LiveLight | null, alpha: number, warp: boolean) {
    const picture = tier.pictures.get(k)!;
    const r = picture.picture.size[0] / this.size[0];
    const [, , w, h] = this.view(q);
    const [s, x, y] = this.map(k, q, warp);
    const a = axisAt(this.frames[k].progress, this.size);
    this.compositor.paint(picture, [look], this.ink(tier, k, look), this.manifest, Math.round(w * this.scale), Math.round(h * this.scale), {
      map: [s * r, x * r, y * r],
      axis: [a.foot[0] * r, a.foot[1] * r, a.shoulder[0] * r, a.shoulder[1] * r],
      live,
      alpha,
    });
  }

  /** Paints frame k at its best: full when it is up (sharpening from its proxy if that was showing), else the proxy.
   * True while a sharpen is still under way. */
  private paintBest(k: number, look: BottleLook, q: number, live: LiveLight | null, alpha: number, now: number): boolean {
    const proxy = this.proxy?.pictures.has(k) ? this.proxy : null;
    if (!this.full.pictures.has(k)) {
      if (!proxy) return false;
      this.paint(proxy, k, look, q, live, alpha, true);
      this.onProxy.add(k);
      return false;
    }
    let start = this.sharpen.get(k);
    if (start !== undefined && proxy) {
      if (!start) this.sharpen.set(k, (start = now));
      const s = smoothstep((now - start) / SHARPEN_MS);
      if (s < 1) {
        this.paint(proxy, k, look, q, live, alpha, true);
        this.paint(this.full, k, look, q, live, alpha * s, true);
        return true;
      }
    }
    this.sharpen.delete(k);
    this.paint(this.full, k, look, q, live, alpha, true);
    return false;
  }

  /** Eases the pointer's pull on the light; true while it is still visibly moving. */
  private follow(now: number): boolean {
    const p = this.pointer;
    const dt = p.at ? Math.min(64, now - p.at) : 16;
    p.at = now;
    const k = 1 - Math.exp(-dt / 220);
    p.x += (p.tx - p.x) * k;
    p.y += (p.ty - p.y) * k;
    p.on += (p.ton - p.on) * k;
    const moving = Math.abs(p.tx - p.x) + Math.abs(p.ty - p.y) + Math.abs(p.ton - p.on) > 4e-3;
    if (!moving) {
      Object.assign(p, { x: p.tx, y: p.ty, on: p.ton });
      p.at = 0;
    }
    return moving;
  }

  private draw(now: number): boolean {
    if (this.keysOnly) return this.drawKeys(now);
    const resting = this.resting(now);
    this.scale = resting ? this.top : this.level;
    // A governed paint size gives way to the full one as soon as the scroll rests.
    let again = this.follow(now) || (!resting && this.level < this.top);
    const next = this.advance(this.shown, this.target, now);
    if (next === null) return again;
    this.shown = next;
    const gap = this.target - next;
    if (Math.abs(gap) > this.lead + EPS) this.holdSince ||= now;
    else this.holdSince = 0;
    // A hold re-asks for proxies once it has gone on too long, which nothing else would wake the loop for.
    again ||= this.holdSince > 0 && now - this.holdSince <= HOLD_MS + 50;
    this.onProxy.clear();
    const q = this.progressAt(clamp(next + clamp(gap, -this.lead, this.lead), 0, this.frames.length - 1));
    const live = lightAt(q, this.pointer);
    const lo = Math.floor(next);
    const t = this.settle(lo, next - lo);
    const fade = this.lookFade;
    if (fade && !fade.start) fade.start = now;
    const s = fade ? smoothstep((now - fade.start) / FADE_MS) : 1;
    if (fade && s < 1) {
      // While the serum changes, the frame nearest the scroll carries both looks.
      const k = t < 0.5 || !this.has(lo + 1) ? lo : lo + 1;
      this.paintBest(k, fade.from, q, live, 1, now);
      this.paintBest(k, this.look, q, live, s, now);
      again = true;
    } else {
      this.lookFade = null;
      if (t <= 1 - SKIP) again = this.paintBest(lo, this.look, q, live, 1, now) || again;
      if (t >= SKIP) again = this.paintBest(lo + 1, this.look, q, live, t > 1 - SKIP ? 1 : t, now) || again;
    }
    if (Math.abs(next - this.target) > EPS) this.pump();
    this.firstFrame();
    return again;
  }

  private has(k: number) {
    return this.full.pictures.has(k) || Boolean(this.proxy?.pictures.has(k));
  }

  private firstFrame() {
    if (this.first || this.shown === null) return;
    this.first = true;
    this.warmUntil = performance.now() + WARM_MS;
    this.options.onFirstFrame?.();
    this.pump();
    void this.prefetch();
  }

  /** Reduced motion: each chapter's frame as rendered, dissolved to the next when the chapter changes. */
  private drawKeys(now: number): boolean {
    const target = Math.round(this.target);
    const pictures = this.full.pictures;
    if (this.shown === null) {
      if (!pictures.has(target)) return false;
      this.shown = target;
    }
    if (!this.keyFade && target !== this.shown && pictures.has(target)) this.keyFade = { from: this.shown, to: target, start: now };
    const fade = this.keyFade;
    const live = lightAt(this.frames[fade?.to ?? this.shown].progress, null);
    const at = (k: number) => this.frames[k].progress;
    let again: boolean;
    if (!fade) {
      const lf = this.lookFade;
      if (lf && !lf.start) lf.start = now;
      const s = lf ? smoothstep((now - lf.start) / FADE_MS) : 1;
      const k = this.shown;
      if (lf && s < 1) this.paint(this.full, k, lf.from, at(k), live, 1, false);
      else this.lookFade = null;
      this.paint(this.full, k, this.look, at(k), live, lf && s < 1 ? s : 1, false);
      again = Boolean(lf && s < 1);
    } else {
      this.lookFade = null;
      const s = smoothstep((now - fade.start) / FADE_MS);
      this.paint(this.full, fade.from, this.look, at(fade.from), live, 1, false);
      this.paint(this.full, fade.to, this.look, at(fade.to), live, s, false);
      if (s < 1) again = true;
      else {
        this.shown = fade.to;
        this.keyFade = null;
        again = target !== this.shown;
      }
    }
    this.firstFrame();
    return again;
  }
}

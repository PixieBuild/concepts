"use client";

import { useEffect, useEffectEvent, useRef, useState, type ReactNode } from "react";
import { useMotionValueEvent, useReducedMotion, type MotionValue } from "motion/react";

import { cn } from "@/lib/utils";
import { lookKey, type BottleLook } from "../../_lib/product-look";
import { saveData } from "./frames";
import { fontsReady } from "./label";
import { loadManifest, type TemplateManifest } from "./manifest";
import { SequencePlayer } from "./sequence";

function deviceBox(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  return { w: rect.width * dpr, h: rect.height * dpr };
}

type Props = {
  look: BottleLook;
  progress: MotionValue<number>;
  /** False while the section is well off screen: nothing loads or draws. */
  running: boolean;
  /** The server-rendered first frame, shown until the canvas has drawn. */
  poster: ReactNode;
  className?: string;
  canvasClassName?: string;
};

/** The homepage's scroll-scrubbed bottle, composited for the chosen product from the one template sequence. */
export function BottleSequence({ look, progress, running, poster, className, canvasClassName }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const player = useRef<SequencePlayer | null>(null);
  const reduced = useReducedMotion() ?? false;
  const [compact, setCompact] = useState<boolean | null>(null);
  const [drawn, setDrawn] = useState(false);
  // A lost GPU context leaves its canvas unusable: a new one takes its place, with the poster shown meanwhile.
  const [generation, setGeneration] = useState(0);
  const key = lookKey(look);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setCompact(entry.contentRect.width < entry.contentRect.height));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Runs after the awaits, so it reads the latest props rather than those from when loading began.
  const create = useEffectEvent((el: HTMLCanvasElement, manifest: TemplateManifest, compactView: boolean) => {
    const p = new SequencePlayer(el, manifest, look, {
      compact: compactView,
      keysOnly: reduced,
      lean: saveData(),
      box: deviceBox(el),
      onFirstFrame: () => setDrawn(true),
      onLost: () => {
        setDrawn(false);
        setGeneration((g) => g + 1);
      },
    });
    player.current = p;
    p.setProgress(progress.get());
    p.setRunning(running);
    return p;
  });

  useEffect(() => {
    if (compact === null) return;
    const controller = new AbortController();
    let made: SequencePlayer | null = null;
    Promise.all([loadManifest(), fontsReady()])
      .then(([manifest]) => {
        const el = canvas.current;
        if (controller.signal.aborted || !el || !manifest.sequence) return;
        made = create(el, manifest, compact);
      })
      .catch(() => {});
    return () => {
      controller.abort();
      made?.destroy();
      player.current = null;
    };
  }, [compact, reduced, generation]);

  // The light leans towards a mouse over the stage; touch and reduced motion leave it to the scroll alone.
  useEffect(() => {
    if (reduced || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const move = (e: PointerEvent) => {
      const el = host.current;
      if (!el || e.pointerType !== "mouse") return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      player.current?.setPointer(x * 2 - 1, y * 2 - 1, x >= 0 && x <= 1 && y >= 0 && y <= 1);
    };
    const leave = () => player.current?.setPointer(0, 0, false);
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, [reduced]);

  useMotionValueEvent(progress, "change", (v) => player.current?.setProgress(v));

  const change = useEffectEvent(() => player.current?.setLook(look));
  useEffect(() => change(), [key]);
  useEffect(() => player.current?.setRunning(running), [running]);

  return (
    <div ref={host} className={cn("absolute inset-0", className)}>
      <div aria-hidden className={cn("absolute inset-0 transition-[visibility] delay-700", drawn && "invisible")}>
        {poster}
      </div>
      <canvas
        key={generation}
        ref={canvas}
        aria-hidden
        className={cn("absolute inset-0 size-full object-cover transition-opacity duration-700", drawn ? "opacity-100" : "opacity-0", canvasClassName)}
      />
    </div>
  );
}

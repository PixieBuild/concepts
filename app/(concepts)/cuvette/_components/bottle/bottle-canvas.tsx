"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import type { Shot } from "../../_lib/product";
import { lookKey, type BottleLook } from "../../_lib/product-look";
import { fontsReady } from "./label";
import { loadManifest } from "./manifest";
import { composeStill, drawCover, planFor } from "./render";
import { cropFor, sourceFor } from "./shots";

type Props = {
  looks: BottleLook[];
  shot: Shot;
  alt: string;
  className?: string;
  onReady?: () => void;
};

/** A product that has no pre-baked still, composited live from data when it nears the viewport. */
export function BottleCanvas({ looks, shot, alt, className, onReady }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const key = looks.map(lookKey).join("+");

  const draw = useEffectEvent(async (canvas: HTMLCanvasElement, signal: AbortSignal) => {
    const [manifest] = await Promise.all([loadManifest(), fontsReady()]);
    const source = sourceFor(manifest, shot, looks.length);
    if (!source || signal.aborted) return;
    const bitmap = await composeStill(manifest, planFor(manifest, source), looks);
    if (signal.aborted) return;
    drawCover(canvas, bitmap, cropFor(manifest, source, shot));
    setReady(true);
    onReady?.();
  });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const controller = new AbortController();
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        draw(canvas, controller.signal).catch(() => {});
      },
      { rootMargin: "50% 0px" },
    );
    observer.observe(canvas);
    return () => {
      observer.disconnect();
      controller.abort();
    };
  }, [key, shot]);

  return (
    <canvas
      ref={ref}
      role="img"
      aria-label={alt}
      data-ready={ready || undefined}
      className={cn("absolute inset-0 size-full object-cover transition-opacity duration-500", ready ? "opacity-100" : "opacity-0", className)}
    />
  );
}

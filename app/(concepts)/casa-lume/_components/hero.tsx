"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";

import { FadeIn, StaggerLines } from "./motion-primitives";
import { Shell } from "./section";
import { IMAGE_BASE } from "@/app/(concepts)/casa-lume/_lib/content";
import { path } from "@/app/(concepts)/casa-lume/site";

const TERRACE_ASPECT = 5504 / 3072;
// Where the open doorway sits in the terrace photograph, as fractions of the image.
const DOOR = { x: 0.494, y: 0.49, w: 0.19, h: 0.74 };
const PUSH = 3;

type Frame = {
  top: number;
  right: number;
  bottom: number;
  left: number;
  shiftX: number;
  shiftY: number;
  rest: number;
  width: number;
  height: number;
  cover: { x: number; y: number; w: number; h: number };
  door: { cx: number; cy: number; w: number; h: number };
};

function measure(stage: HTMLElement, slot: HTMLElement): Frame {
  const s = stage.getBoundingClientRect();
  const w = slot.getBoundingClientRect();
  const byWidth = s.width / s.height > TERRACE_ASPECT;
  const cover = byWidth
    ? { w: s.width, h: s.width / TERRACE_ASPECT }
    : { w: s.height * TERRACE_ASPECT, h: s.height };
  const ox = (s.width - cover.w) / 2;
  const oy = (s.height - cover.h) / 2;
  const door = {
    cx: ox + DOOR.x * cover.w,
    cy: oy + DOOR.y * cover.h,
    w: DOOR.w * cover.w,
    h: DOOR.h * cover.h,
  };
  // At rest the photo is shrunk to just cover the window, so the doorway keeps
  // its surroundings on wide screens instead of filling the frame edge to edge.
  const slotW = Math.min(w.right, s.right) - Math.max(w.left, s.left);
  const slotH = Math.min(w.bottom, s.bottom) - Math.max(w.top, s.top);
  const rest = Math.min(1.08, Math.max(slotW / cover.w, slotH / cover.h) * 1.06);
  return {
    top: Math.max(0, w.top - s.top),
    right: Math.max(0, s.right - w.right),
    bottom: Math.max(0, s.bottom - w.bottom),
    left: Math.max(0, w.left - s.left),
    shiftX: (w.left + w.right) / 2 - s.left - door.cx,
    shiftY: (w.top + w.bottom) / 2 - s.top - door.cy,
    rest,
    width: s.width,
    height: s.height,
    cover: { x: ox, y: oy, w: cover.w, h: cover.h },
    door,
  };
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function Hero() {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const slot = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState<Frame | null>(null);
  const [ready, setReady] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const stageEl = stage.current;
    const slotEl = slot.current;
    if (!stageEl || !slotEl) return;
    const update = () => setFrame(measure(stageEl, slotEl));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(stageEl);
    observer.observe(slotEl);
    return () => observer.disconnect();
  }, []);

  const { scrollYProgress } = useScroll({
    target: section,
    offset: ["start start", "end end"],
  });
  const progress = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [0, 1]);
  const open = useTransform(progress, [0.04, 0.34], [0, 1], { ease: easeOut });
  const push = useTransform(progress, [0.36, 0.8], [0, 1], { ease: easeInOut });
  const through = useTransform(progress, [0.6, 0.9], [0, 1], { ease: easeInOut });

  useMotionValueEvent(progress, "change", (v) => {
    section.current?.setAttribute("data-room", v > 0.62 ? "true" : "false");
  });

  // The photo is a full-viewport layer; the "inset" is a clip window measured
  // from an empty slot in the grid, so layout owns the frame.
  const windowClip = useTransform(open, (o) => {
    if (!frame) return "inset(0px)";
    const k = 1 - o;
    return `inset(${frame.top * k}px ${frame.right * k}px ${frame.bottom * k}px ${frame.left * k}px)`;
  });
  const x = useTransform(open, (o) => (frame ? frame.shiftX * (1 - o) : 0));
  const y = useTransform(open, (o) => (frame ? frame.shiftY * (1 - o) : 0));
  const scale = useTransform([open, push], ([o, p]: number[]) => {
    const rest = frame?.rest ?? 1;
    return (rest + (1 - rest) * o) * (1 + (PUSH - 1) * p);
  });
  const origin = frame
    ? `${frame.door.cx - frame.cover.x}px ${frame.door.cy - frame.cover.y}px`
    : "50% 50%";

  // The bedroom arrives inside the doorway's outline and grows to fill the stage.
  const roomClip = useTransform([push, through], ([p, t]: number[]) => {
    if (!frame) return "inset(0px 0px 0px 100%)";
    const s = 1 + (PUSH - 1) * p;
    const { door, width, height } = frame;
    const w = door.w * s;
    const h = door.h * s;
    const k = 1 - t;
    const edges = [
      door.cy - h / 2,
      width - (door.cx + w / 2),
      height - (door.cy + h / 2),
      door.cx - w / 2,
    ].map((v) => Math.max(0, v) * k);
    return `inset(${edges[0]}px ${edges[1]}px ${edges[2]}px ${edges[3]}px)`;
  });
  const roomOpacity = useTransform(through, [0.05, 0.7], [0, 1]);
  const roomScale = useTransform(through, [0, 1], [1.18, 1]);

  const copyY = useTransform(progress, [0, 0.3], [0, -72]);
  const copyOpacity = useTransform(progress, [0, 0.2], [1, 0]);
  const captionOpacity = useTransform(progress, [0.86, 0.97], [0, 1]);
  const captionY = useTransform(progress, [0.86, 0.97], [28, 0]);

  return (
    <section id="hero" ref={section} className="relative h-[320svh] motion-reduce:h-svh">
      <div ref={stage} className="sticky top-0 h-svh overflow-clip">
        <Shell className="flex h-full flex-col pt-24 lg:grid lg:grid-cols-12 lg:gap-x-10 lg:pt-28">
          <motion.div
            style={{ y: copyY, opacity: copyOpacity }}
            className="lg:col-span-7 lg:flex lg:flex-col lg:justify-center lg:pb-24 xl:pr-8 2xl:col-span-6"
          >
            <FadeIn delay={0.05} play={ready}>
              <p className="eyebrow flex flex-col gap-2.5 text-muted-foreground sm:flex-row sm:items-center sm:gap-x-4">
                <span className="hidden sm:inline">44°08′ N, 9°39′ E</span>
                <span aria-hidden className="hidden h-px w-6 bg-border sm:block" />
                <span>Monterosso, Liguria</span>
                <span aria-hidden className="hidden h-px w-6 bg-border sm:block" />
                <span>April to November</span>
              </p>
            </FadeIn>

            <h1 className="mt-7 font-heading text-[clamp(2.5rem,min(5.4vw,9.5vh),6rem)] leading-[1.04] font-normal tracking-[-0.01em] lg:mt-10">
              <StaggerLines
                play={ready}
                className="flex flex-col"
                lineClassName="block"
                lines={["Seventeen rooms,", "ninety steps", "above the sea."]}
              />
            </h1>

            <FadeIn delay={0.5} play={ready}>
              <div className="mt-7 flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between sm:gap-10 lg:mt-12">
                <p className="max-w-[23rem] text-[1.0625rem] leading-relaxed text-muted-foreground">
                  A family house on the terraces between Monterosso and Punta
                  Mesco. Long lunches, cold water, and nothing that needs doing.
                </p>
                <Link
                  href={path("/rooms")}
                  className="group relative inline-flex shrink-0 items-center gap-3.5 self-start pb-3 text-[0.8125rem] tracking-[0.16em] text-foreground uppercase focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring sm:self-auto"
                >
                  Enter the house
                  <ArrowRight className="size-4 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1.5" />
                  <span aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-foreground/25" />
                  <span
                    aria-hidden
                    className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-foreground transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
                  />
                </Link>
              </div>
            </FadeIn>
          </motion.div>

          <div
            ref={slot}
            aria-hidden
            className="mt-9 min-h-[34svh] flex-1 lg:col-span-5 lg:mt-0 lg:h-full lg:min-h-0 2xl:col-span-6 2xl:h-auto 2xl:mb-[9svh]"
          />
        </Shell>

        <motion.div
          style={{ clipPath: windowClip }}
          initial={{ opacity: 0 }}
          animate={{ opacity: frame && ready ? 1 : 0 }}
          transition={{ duration: 1.6, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 will-change-[clip-path]"
        >
          <motion.div
            style={{
              x,
              y,
              scale,
              transformOrigin: origin,
              ...(frame
                ? {
                    left: frame.cover.x,
                    top: frame.cover.y,
                    width: frame.cover.w,
                    height: frame.cover.h,
                  }
                : { inset: 0 }),
            }}
            className="absolute will-change-transform"
          >
            <Image
              src={`${IMAGE_BASE}/evening/hero-terrace.webp`}
              alt="The open doorway of the Garden Suite from the terrace at golden hour, a lemon tree beside it and the sea beyond"
              fill
              preload
              quality={90}
              sizes="100vw"
              className="object-cover"
            />
          </motion.div>
        </motion.div>

        <motion.div
          style={{ clipPath: roomClip, opacity: roomOpacity }}
          className="pointer-events-none absolute inset-0 will-change-[clip-path,opacity]"
        >
          <motion.div style={{ scale: roomScale }} className="absolute inset-0 will-change-transform">
            <Image
              src={`${IMAGE_BASE}/evening/hero-bedroom.webp`}
              alt="Inside the Garden Suite, evening light through the shutters across a white linen bed"
              fill
              quality={90}
              sizes="100vw"
              className="object-cover"
            />
          </motion.div>
        </motion.div>

        <motion.div
          style={{ opacity: captionOpacity, y: captionY }}
          className="pointer-events-none absolute inset-x-0 bottom-0 text-background"
        >
          <Shell className="pb-10 lg:pb-16">
            <p className="eyebrow text-background/75">The Garden Suite, seven in the evening</p>
            <p className="mt-5 max-w-2xl font-heading text-[clamp(1.75rem,3.4vw,3.5rem)] leading-[1.08] font-light">
              The shutters stay open until the last of the light has gone.
            </p>
          </Shell>
        </motion.div>
      </div>
    </section>
  );
}

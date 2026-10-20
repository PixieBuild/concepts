"use client";

import { memo, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AnimatePresence, motion, useTransform, type MotionValue } from "motion/react";

import { cn } from "@/lib/utils";
import { useAct } from "./act";
import { ACT, band } from "./timeline";
import { formatCurrency } from "@/app/(concepts)/casa-lume/_lib/booking";
import type { Room } from "@/app/(concepts)/casa-lume/_lib/content";
import { STAIR_STEPS } from "@/app/(concepts)/casa-lume/_lib/hero-lights";
import { localTime, sunset } from "@/app/(concepts)/casa-lume/_lib/monterosso";
import { path } from "@/app/(concepts)/casa-lume/site";

const EASE = [0.16, 1, 0.3, 1] as const;

function subscribeMinute(callback: () => void) {
  const id = window.setInterval(callback, 15_000);
  return () => window.clearInterval(id);
}

const evening = () => {
  const now = new Date();
  return `${localTime(now)}|${localTime(sunset(now))}`;
};

function useMonterossoEvening() {
  const value = useSyncExternalStore(subscribeMinute, evening, () => "");
  const [now, sun] = value.split("|");
  return value ? { now, sun } : null;
}

type Props = {
  /** The room being previewed from a window, if any. */
  room: Room | null;
  progress: MotionValue<number>;
  tall: boolean;
  onPreviewEnter: () => void;
  onPreviewLeave: () => void;
  className?: string;
};

export const Caption = memo(function Caption({
  room,
  progress,
  tall,
  onPreviewEnter,
  onPreviewLeave,
  className,
}: Props) {
  const time = useMonterossoEvening();
  const act = useAct(progress);
  const mode = room && act !== "beyond" ? "preview" : act === "house" ? "house" : act === "climb" ? "climb" : "none";
  // Ivory before the plate's edge reaches the row; on portrait screens the row steps out and returns over the photograph.
  const color = useTransform(progress, (p) => {
    const k = Math.round(band(p, tall ? [0.03, 0.06] : [0.015, 0.04]) * 100);
    return `color-mix(in oklch, var(--background) ${k}%, var(--foreground))`;
  });
  const opacity = useTransform(progress, (p) => {
    const out = 1 - band(p, [ACT.steps[1] - 0.03, ACT.steps[1]]);
    return tall ? out * Math.max(1 - band(p, [0.01, 0.03]), band(p, [0.075, 0.1])) : out;
  });
  const steps = useTransform(progress, (p) => String(Math.max(1, Math.round(band(p, ACT.climb) * STAIR_STEPS))));

  return (
    <motion.div style={{ color, opacity }} className={cn("relative", className)}>
      <AnimatePresence initial={false}>
        {mode === "house" && (
          <Row key="house">
            <p className="text-[0.75rem] whitespace-nowrap text-current/70 sm:text-[0.8125rem]">
              <i className="mr-1.5 font-heading text-[1rem] text-current sm:text-[1.0625rem]">Monterosso</i>
              <span className={cn("transition-opacity duration-700", time ? "opacity-100" : "opacity-0")}>
                <time className="text-current tabular-nums">{time?.now ?? "00:00"}</time>
                <span className="mx-2 opacity-60">·</span>
                sunset <span className="tabular-nums">{time?.sun ?? "00:00"}</span>
              </span>
            </p>
            <p className="eyebrow flex items-center gap-2.5 text-[0.625rem] whitespace-nowrap text-current/70 sm:text-[0.6875rem]">
              <span aria-hidden className="size-[5px] rounded-full bg-[oklch(0.78_0.13_70)] shadow-[0_0_0_3px_oklch(0.78_0.13_70/0.2)]" />
              <span className="hidden pointer-fine:sm:inline">Point to a lit window</span>
              <span className="hidden pointer-fine:max-sm:inline">Point to a window</span>
              <span className="pointer-fine:hidden">Tap a window</span>
            </p>
          </Row>
        )}
        {mode === "climb" && (
          <Row key="climb">
            <p className="text-[0.8125rem] text-current/75">
              <i className="mr-1.5 font-heading text-[1.0625rem] text-current">The climb</i>
              <span className="hidden sm:inline">from the water to the door</span>
            </p>
            <p className="font-heading text-[1.0625rem] italic" aria-hidden>
              Step <motion.span className="tabular-nums">{steps}</motion.span> of {STAIR_STEPS}
            </p>
          </Row>
        )}
        {mode === "preview" && room && (
          <Row key={`room-${room.slug}`} onPointerEnter={onPreviewEnter} onPointerLeave={onPreviewLeave}>
            <div className="flex min-w-0 items-center gap-3.5">
              <span className="relative hidden h-12 w-10 shrink-0 overflow-hidden sm:block">
                <Image src={room.card} alt="" fill sizes="40px" className="object-cover" />
              </span>
              <p className="min-w-0">
                <span className="flex items-baseline gap-2.5 whitespace-nowrap">
                  <span className="font-heading text-[1.35rem] leading-none sm:text-[1.5rem]">{room.name}</span>
                  <span className="font-heading text-[0.95rem] text-current/75 italic sm:text-[1.0625rem]">
                    from {formatCurrency(room.priceFrom)}
                  </span>
                </span>
                <span className="mt-1.5 block truncate text-[0.75rem] text-current/70 sm:text-[0.8125rem]">{room.tagline}</span>
              </p>
            </div>
            {/* The window itself is the keyboard stop for this room, so this link stays out of the tab order. */}
            <Link
              href={path(`/rooms/${room.slug}`)}
              data-preview-link
              tabIndex={-1}
              className="pointer-events-auto inline-flex min-h-11 shrink-0 items-center gap-2.5 text-[0.6875rem] tracking-[0.16em] whitespace-nowrap uppercase sm:text-[0.75rem]"
            >
              <span>
                View<span className="hidden sm:inline"> the room</span>
              </span>
              <ArrowRight className="size-3.5" />
            </Link>
          </Row>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

function Row({
  children,
  onPointerEnter,
  onPointerLeave,
}: {
  children: React.ReactNode;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
}) {
  return (
    <motion.div
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      initial={{ opacity: 0, transform: "translateY(6px)" }}
      animate={{ opacity: 1, transform: "translateY(0px)" }}
      exit={{ opacity: 0, transform: "translateY(-4px)" }}
      transition={{ duration: 0.55, ease: EASE }}
      className={cn(
        "absolute inset-x-0 top-0 flex min-h-11 items-center justify-between gap-5 will-change-transform",
        onPointerEnter && "pointer-events-auto",
      )}
    >
      {children}
    </motion.div>
  );
}

"use client";

import Image from "next/image";
import { motion, useScroll, useSpring, useTransform, useVelocity, type MotionValue } from "motion/react";

import { cn } from "@/lib/utils";
import { ACT, band, easeOut } from "./timeline";
import { ROOM_KEY } from "@/app/(concepts)/casa-lume/_lib/hero-lights";

/** The brass key, lowered on its cord and left to swing; scrolling nudges it like a draught. */
export function RoomKey({
  progress,
  shade,
  className,
}: {
  progress: MotionValue<number>;
  /** 0 to 1: how far the key sinks into shadow. */
  shade: MotionValue<number>;
  className?: string;
}) {
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const drop = useTransform(progress, (p) => easeOut(band(p, ACT.key)));
  const target = useTransform(() => {
    const lowering = 1 - drop.get();
    const draught = Math.max(-7, Math.min(7, velocity.get() * -0.0035));
    return lowering * 16 + draught;
  });
  const rotate = useSpring(target, { stiffness: 38, damping: 3.2, mass: 1.1 });
  const transform = useTransform(drop, (d) => `translate3d(0, ${(-115 * (1 - d)).toFixed(2)}%, 0)`);

  return (
    <motion.div style={{ transform }} className={cn("pointer-events-none will-change-transform", className)}>
      <motion.div style={{ rotate }} className="origin-top will-change-transform">
        <KeyOnCord shade={shade} />
      </motion.div>
    </motion.div>
  );
}

/** The same key hanging still, for reduced motion. */
export function StillKey({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div className={className}>
      <KeyOnCord />
      {children}
    </div>
  );
}

// `--cord` lengthens the cord above the photograph so the key can hang below the header.
// The shadow is in the image itself, and the shade is a blacked-out copy faded in, so nothing re-filters while it swings.
function KeyOnCord({ shade }: { shade?: MotionValue<number> }) {
  return (
    <>
      <div aria-hidden className="mx-auto h-(--cord,0px) w-[max(2px,3.6%)] bg-[linear-gradient(90deg,#6a2a18,#a8503a,#6a2a18)]" />
      <div className="relative aspect-[880/1580]">
        <Image
          src={ROOM_KEY.src}
          alt={ROOM_KEY.alt}
          fill
          sizes="(max-width: 1023px) 26vw, 12vw"
          fetchPriority="low"
          className="object-contain"
        />
        {shade && (
          <motion.div aria-hidden style={{ opacity: shade }} className="absolute inset-0">
            <Image src={ROOM_KEY.src} alt="" fill sizes="(max-width: 1023px) 26vw, 12vw" className="object-contain brightness-0" />
          </motion.div>
        )}
      </div>
    </>
  );
}

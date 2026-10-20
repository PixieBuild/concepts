"use client";

import { memo } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useMotionValue } from "motion/react";

import { PlatePicture } from "./plate-picture";
import { KeyLabel, RESERVE_HREF, RESERVE_LABEL, RESERVE_PRICE, SERVICE_NOTES } from "./inside";
import { StillKey } from "./room-key";
import { WelcomeCard } from "./welcome-card";
import { ROOM_NIGHT } from "@/app/(concepts)/casa-lume/_lib/hero-lights";

/** The room, the card, the key and the evening, all at once, for visitors who asked for no motion. */
// Memoised: it is static, and the hero re-renders around it when a window is chosen.
export const StillInside = memo(function StillInside({ ref }: { ref?: React.Ref<HTMLDivElement> }) {
  const written = useMotionValue(1);

  return (
    <div ref={ref} className="relative hidden overflow-hidden text-background motion-reduce:block">
      <PlatePicture
        wide={ROOM_NIGHT.wide}
        tall={ROOM_NIGHT.tall}
        alt={ROOM_NIGHT.alt}
        wideSizes="(max-aspect-ratio: 3/2) 150vh, 100vw"
        tallSizes="(max-aspect-ratio: 4/5) 81vh, 100vw"
        loading="lazy"
        className="absolute inset-0 size-full object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_top,rgb(16_11_8/0.82),rgb(16_11_8/0.35)_55%,rgb(16_11_8/0.45))] lg:bg-[linear-gradient(90deg,rgb(16_11_8/0.75),rgb(16_11_8/0.3)_50%,rgb(16_11_8/0.1)_75%)]" />

      {/* At lg the key hangs in the gutter between the card's column and the notes', clear of both. */}
      <StillKey className="absolute top-0 right-[9vw] z-10 w-[clamp(5.5rem,25vw,8rem)] [--cord:5.5rem] sm:[--cord:4rem] lg:right-auto lg:left-[44%] lg:w-[clamp(6rem,min(10vw,21svh),11rem)] lg:[--cord:2.5rem]">
        <p className="absolute top-(--cord) right-[calc(100%-34.4%+14px)] mt-[109.8%] -translate-y-1/2 text-right whitespace-nowrap">
          <KeyLabel />
        </p>
      </StillKey>

      <div className="relative mx-auto grid min-h-svh max-w-[100rem] content-end gap-12 px-5 pt-[42svh] pb-14 sm:px-8 lg:grid-cols-12 lg:content-center lg:px-12 lg:py-28 xl:px-16 2xl:px-24">
        <div className="lg:col-span-5">
          <WelcomeCard progress={written} className="w-full max-w-[29rem] -rotate-2" />
        </div>

        <div className="flex flex-col gap-12 lg:col-span-5 lg:col-start-8 lg:self-end">
          <div>
            <div className="flex items-center gap-4">
              <p className="eyebrow text-background/70">This evening</p>
              <span aria-hidden className="h-px flex-1 bg-(--gilt)/60" />
            </div>
            <ul className="mt-5 flex flex-col gap-3.5">
              {SERVICE_NOTES.map((item) => (
                <li key={item.time} className="grid grid-cols-[3.75rem_1fr] items-baseline gap-3">
                  <span className="text-[0.75rem] tracking-[0.08em] text-background/65 tabular-nums">{item.time}</span>
                  <span className="font-heading text-[1.2rem] leading-snug italic">{item.note}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-heading text-[clamp(2.5rem,4.6vw,4.5rem)] leading-[0.98] font-light">Your room is ready.</h2>
            <Link
              href={RESERVE_HREF}
              className="group relative mt-8 inline-flex min-h-11 flex-wrap items-center gap-x-4 gap-y-1 pb-3 text-[0.8125rem] tracking-[0.16em] uppercase focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-background"
            >
              <span>{RESERVE_LABEL}</span>
              <span className="font-heading text-[1.15rem] tracking-normal normal-case italic opacity-85">{RESERVE_PRICE}</span>
              <ArrowRight className="size-4" />
              <span aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-(--gilt)/60" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
});

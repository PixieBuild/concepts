"use client";

import Image from "next/image";

import { Chalkboard } from "./chalkboard";
import { CupOrigin } from "./cup-flight";
import { HandNote } from "./fx";
import { usePageRevealed } from "./newspaper";
import { Shell } from "./shell";
import { CHALKBOARD, HOUSE_CUP, IMAGES, NOTES } from "../_lib/content";

const WRITE_AT = 2.4;

export function HeroPlate() {
  const revealed = usePageRevealed();
  return (
    <Shell className="pt-6 pb-24 sm:pt-8 sm:pb-28 lg:pb-32">
      <figure className="m-0">
        <div className="relative">
          <div className="border border-foreground p-1.5 sm:p-2">
            <div className="relative border border-foreground [container-type:inline-size]">
              <div className="relative aspect-[3/4] overflow-hidden sm:aspect-[16/7]">
                <Image
                  src={IMAGES.counter.src}
                  alt={IMAGES.counter.alt}
                  fill
                  priority
                  quality={90}
                  sizes="(min-width: 1536px) 1500px, (min-width: 1280px) 1200px, 100vw"
                  className="hidden object-cover sm:block"
                />
                <Image
                  src={IMAGES.counterTall.src}
                  alt={IMAGES.counterTall.alt}
                  fill
                  priority
                  quality={90}
                  sizes="100vw"
                  className="object-cover sm:hidden"
                />
                <Chalkboard box={CHALKBOARD.tall} writeAt={WRITE_AT} size="4.6cqw" className="sm:hidden" />
                <Chalkboard box={CHALKBOARD.wide} writeAt={WRITE_AT} size="1.55cqw" className="hidden sm:block" />
              </div>
            </div>
          </div>

          <div className="absolute bottom-3 left-3 max-w-[14rem] border border-foreground bg-background px-3 py-2.5 text-[0.8rem] leading-snug sm:bottom-4 sm:left-auto sm:right-60 sm:max-w-[16rem] sm:px-3.5 sm:py-3 lg:right-[21rem] 2xl:right-[26rem]">
            <span className="block font-heading text-[1.05rem] leading-tight sm:text-lg">
              {HOUSE_CUP.number} · {HOUSE_CUP.name}
            </span>
            <span className="mt-1 hidden text-muted-foreground sm:block">
              {HOUSE_CUP.short} {HOUSE_CUP.price}
            </span>
            <span className="mt-0.5 block text-muted-foreground sm:hidden">{HOUSE_CUP.price}</span>
          </div>

          <CupOrigin className="absolute -bottom-12 right-2 size-36 sm:-bottom-20 sm:right-10 sm:size-52 lg:-bottom-24 lg:right-12 lg:size-64 2xl:-bottom-28 2xl:right-16 2xl:size-80" />

          <HandNote
            play={revealed}
            delay={WRITE_AT + 0.8}
            className="absolute -bottom-11 right-[21rem] hidden -rotate-3 text-[1.5rem] text-(--green) lg:block 2xl:right-[26rem]"
          >
            {NOTES.plate}
          </HandNote>
        </div>

        <figcaption className="mt-3.5 pr-32 font-heading text-[0.95rem] italic leading-snug sm:pr-0 sm:text-base">
          <span className="not-italic">Plate I.</span> The counter at a quarter past seven, first
          batch out of the roaster.
        </figcaption>
      </figure>
    </Shell>
  );
}

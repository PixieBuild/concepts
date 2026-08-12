import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AvailabilityBar } from "./availability-bar";
import { FadeIn, StaggerLines } from "./motion-primitives";
import { Shell } from "./section";
import { IMAGE_BASE } from "@/app/(concepts)/casa-lume/_lib/content";
import { path } from "@/app/(concepts)/casa-lume/site";

export function Hero() {
  return (
    <section className="relative isolate flex h-svh min-h-136 w-full flex-col overflow-hidden">
      <Image
        src={`${IMAGE_BASE}/hero.webp`}
        alt="The terrace and pool above the coast at dusk"
        fill
        priority
        sizes="100vw"
        className="ken-burns object-cover object-center"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-b from-foreground/45 via-foreground/10 to-foreground/80"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-r from-foreground/75 via-foreground/25 to-transparent"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-48 bg-linear-to-b from-foreground/60 via-foreground/20 to-transparent"
      />

      <div className="relative flex flex-1 flex-col justify-center pt-42 pb-24 text-background lg:pt-44">
        <Shell>
          <FadeIn delay={0.1}>
            <p className="eyebrow flex items-center gap-4 text-background/90">
              <span aria-hidden className="h-px w-12 bg-background/45" />
              Liguria, Italy
            </p>
          </FadeIn>

          <h1 className="mt-9 max-w-[14ch] font-heading text-[clamp(3rem,7vw,6.5rem)] leading-[0.96] font-light tracking-tight">
            <StaggerLines
              className="flex flex-col"
              lineClassName="block"
              lines={["Where the hills"]}
            />
            <FadeIn delay={0.55}>
              <em className="block font-normal italic">meet the sea.</em>
            </FadeIn>
          </h1>

          <FadeIn delay={0.8}>
            <p className="mt-10 max-w-md text-[1.0625rem] leading-relaxed text-background/80">
              A seventeen-room house on the terraces above the Ligurian coast.
              Long lunches, cold water, and nothing that needs doing.
            </p>
          </FadeIn>

          <FadeIn delay={0.95}>
            <Button
              size="lg"
              nativeButton={false}
              className="mt-11 h-12 rounded-none bg-background px-8 text-(--clay) hover:bg-background/85"
              render={<Link href={path("/rooms")} />}
            >
              Discover the house
              <ArrowRight />
            </Button>
          </FadeIn>
        </Shell>
      </div>

      <div className="relative pb-8 lg:pb-10">
        <Shell className="flex items-end gap-8">
          <FadeIn delay={1.2} className="hidden shrink-0 pb-1 lg:block">
            <span className="flex flex-col items-center gap-4 text-background/50">
              <span className="eyebrow [writing-mode:vertical-rl]">Scroll</span>
              <span aria-hidden className="h-12 w-px bg-background/30" />
            </span>
          </FadeIn>

          <div className="hero-rise min-w-0 flex-1">
            <AvailabilityBar />
          </div>
        </Shell>
      </div>
    </section>
  );
}

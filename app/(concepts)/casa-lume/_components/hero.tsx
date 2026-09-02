import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { AvailabilityBar } from "./availability-bar";
import { FadeIn, StaggerLines } from "./motion-primitives";
import { Shell } from "./section";
import { IMAGE_BASE } from "@/app/(concepts)/casa-lume/_lib/content";
import { path } from "@/app/(concepts)/casa-lume/site";

export function Hero() {
  return (
    <section className="relative isolate flex min-h-svh w-full flex-col overflow-hidden">
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

      <div className="relative flex flex-1 flex-col justify-center pt-46 pb-12 text-background lg:pt-48">
        <Shell>
          <FadeIn delay={0.1}>
            <p className="eyebrow flex items-center gap-4 text-background/90">
              <span aria-hidden className="h-px w-12 bg-background/45" />
              Liguria, Italy
            </p>
          </FadeIn>

          <h1 className="mt-6 max-w-[14ch] font-heading text-[clamp(3rem,min(7vw,11.5vh),8.5rem)] leading-[1.05] font-light tracking-[0.006em]">
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
            <p className="mt-8 max-w-[25.5rem] text-[1.0625rem] leading-relaxed text-background/80">
              A seventeen-room house on the terraces above the Ligurian coast.
              Long lunches, cold water, and nothing that needs doing.
            </p>
          </FadeIn>

          <FadeIn delay={0.95}>
            <Link
              href={path("/rooms")}
              className="group relative mt-11 inline-flex items-center gap-3.5 pb-3 text-[0.8125rem] tracking-[0.16em] text-background uppercase focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-background"
            >
              Enter the house
              <ArrowRight className="size-4 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1.5" />
              <span aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-background/30" />
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-background transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
              />
            </Link>
          </FadeIn>
        </Shell>
      </div>

      <div className="relative pb-8 lg:pb-10">
        <Shell>
          <div className="hero-rise">
            <AvailabilityBar />
          </div>
        </Shell>
      </div>
    </section>
  );
}

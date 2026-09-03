import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AvailabilityBar } from "./_components/availability-bar";
import { Hero } from "./_components/hero";
import { HouseChapters } from "./_components/house-chapters";
import { Parallax, Reveal, RevealImage } from "./_components/motion-primitives";
import { RoomsRail } from "./_components/rooms-rail";
import { SectionHeading, Shell } from "./_components/section";
import {
  DINING,
  IMAGE_BASE,
  EXPERIENCES,
  NEARBY,
  TESTIMONIALS,
  TRAVEL,
} from "./_lib/content";
import { path } from "./site";

export default function CasaLumeHome() {
  return (
    <>
      <Hero />

      <div className="border-b border-border">
        <Shell>
          <AvailabilityBar />
        </Shell>
      </div>

      <HouseChapters />
      <Rooms />
      <Water />
      <div className="relative z-10 bg-background">
        <Dining />
        <Experiences />
        <Location />
        <Reviews />
        <FinalCta />
      </div>
    </>
  );
}

function Rooms() {
  return (
    <section className="border-t border-border/60 py-24 sm:py-32 lg:py-40">
      <Shell className="mb-14 lg:mb-20">
        <SectionHeading
          eyebrow="Rooms & suites"
          title="Seventeen rooms, no two alike."
          intro="Some open onto the lemon garden, some face the water, one has the whole roof to itself. All of them are quiet."
        />
      </Shell>

      <RoomsRail />
    </section>
  );
}

function Water() {
  return (
    <section className="sticky top-0 h-svh overflow-hidden">
      <div className="absolute inset-0">
        <Parallax className="absolute inset-0" amount={6}>
          <Image
            src={`${IMAGE_BASE}/bathing-platform.webp`}
            alt="The bathing platform below the house at dusk"
            fill
            sizes="100vw"
            className="object-cover object-[50%_38%]"
          />
        </Parallax>
        <Shell className="absolute inset-x-0 bottom-0 pb-12 text-background lg:pb-16">
          <Reveal>
            <p className="eyebrow text-background/70">The water</p>
            <p className="mt-5 max-w-lg font-heading text-[clamp(2.25rem,4.5vw,3.75rem)] leading-[1.02] font-light">
              Ninety steps down, and worth every one of them.
            </p>
            <p className="mt-6 max-w-sm text-[1.0625rem] leading-relaxed text-background/80">
              A concrete platform on the rocks, a ladder into deep water, and
              nobody else. Towels go down at eight.
            </p>
          </Reveal>
        </Shell>
      </div>
    </section>
  );
}

function Dining() {
  return (
    <section className="bg-secondary/50 py-24 sm:py-32 lg:py-40">
      <Shell>
        <div className="grid gap-14 lg:grid-cols-12 lg:items-center lg:gap-20">
          <div className="order-2 lg:order-1 lg:col-span-7">
            <RevealImage>
              <Parallax className="aspect-3/2">
                <Image
                  src={`${IMAGE_BASE}/evening/dining-terrace.webp`}
                  alt="The lower terrace laid for dinner at dusk"
                  fill
                  sizes="(min-width:1600px) 848px, (min-width:1024px) 57vw, 100vw"
                  className="object-cover"
                />
              </Parallax>
            </RevealImage>
            <div className="mt-6 grid grid-cols-2 gap-6">
              <RevealImage delay={0.12}>
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src={`${IMAGE_BASE}/evening/dining-detail.webp`}
                    alt="Grilled octopus, focaccia and a glass of Vermentino on the terrace"
                    fill
                    sizes="(min-width:1600px) 412px, (min-width:1024px) 28vw, 50vw"
                    className="object-cover"
                  />
                </div>
              </RevealImage>
              <RevealImage delay={0.22}>
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src={`${IMAGE_BASE}/bar-sq.webp`}
                    alt="Bottles behind the bar"
                    fill
                    sizes="(min-width:1600px) 412px, (min-width:1024px) 28vw, 50vw"
                    className="object-cover"
                  />
                </div>
              </RevealImage>
            </div>
          </div>

          <div className="order-1 lg:order-2 lg:col-span-5">
            <SectionHeading
              eyebrow={DINING.restaurant.kicker}
              title={
                <>
                  {DINING.restaurant.name}
                  <span className="text-muted-foreground/50"> — one menu, </span>
                  written each afternoon.
                </>
              }
              intro={DINING.restaurant.description}
            />

            <Reveal delay={0.15}>
              <dl className="mt-10 flex flex-col gap-3 border-t border-border/80 pt-8">
                {DINING.restaurant.hours.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-baseline justify-between gap-6 text-[0.95rem]"
                  >
                    <dt className="text-muted-foreground">{row.label}</dt>
                    <dd className="tabular-nums">{row.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  nativeButton={false}
                  render={<Link href={path("/dining")} />}
                >
                  Reserve a table
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  nativeButton={false}
                  render={<Link href={path("/dining#menu")} />}
                >
                  See the menu
                </Button>
              </div>
            </Reveal>
          </div>
        </div>
      </Shell>
    </section>
  );
}

function Experiences() {
  const [lead, ...rest] = EXPERIENCES.slice(0, 5);

  return (
    <section className="py-24 sm:py-32 lg:py-40">
      <Shell>
        <SectionHeading
          eyebrow="Experiences"
          title="Days arranged, or left entirely alone."
          intro="Nothing here is compulsory. But if you want a boat at eight or a table on the point at sunset, we will have it ready."
        />

        <div className="mt-14 grid gap-6 lg:mt-20 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <Link
              href={path(`/experiences#${lead.slug}`)}
              className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              <div className="relative aspect-3/2 overflow-hidden">
                <Image
                  src={`${IMAGE_BASE}/spa-wide.webp`}
                  alt={lead.photo.alt}
                  fill
                  sizes="(min-width:1600px) 848px, (min-width:1024px) 57vw, 100vw"
                  className="object-cover transition-transform duration-1200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-103"
                />
              </div>
              <div className="mt-6 flex items-baseline justify-between gap-4">
                <h3 className="font-heading text-[1.75rem] leading-none font-normal">
                  {lead.name}
                </h3>
                <span className="eyebrow shrink-0 text-muted-foreground">
                  {lead.category}
                </span>
              </div>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
                {lead.description}
              </p>
            </Link>
          </Reveal>

          <ul className="lg:col-span-5">
            {rest.map((experience, index) => (
              <li key={experience.slug}>
                <Reveal delay={0.08 * index}>
                  <Link
                    href={path(`/experiences#${experience.slug}`)}
                    className="group flex items-center gap-5 border-b border-border/70 py-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <div className="relative size-20 shrink-0 overflow-hidden sm:size-24">
                      <Image
                        src={experience.photo.src}
                        alt={experience.photo.alt}
                        fill
                        sizes="96px"
                        className="object-cover transition-transform duration-1000 group-hover:scale-110"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-heading text-xl leading-tight font-normal">
                        {experience.name}
                      </h3>
                      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {experience.description}
                      </p>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-500 group-hover:translate-x-1 group-hover:text-primary" />
                  </Link>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </Shell>
    </section>
  );
}

function Location() {
  return (
    <section className="border-t border-border/60 py-24 sm:py-32 lg:py-40">
      <Shell>
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
          <div className="lg:col-span-5">
            <SectionHeading
              eyebrow="The setting"
              title="Above a cove the road does not reach."
              intro="Casa Lume sits on the terraces between Monterosso and Punta Mesco, twelve minutes from the village and a long way from everything else."
            />

            <Reveal delay={0.12}>
              <div className="mt-12 grid gap-10 sm:grid-cols-2">
                <div>
                  <p className="eyebrow text-muted-foreground">Nearby</p>
                  <ul className="mt-5 flex flex-col gap-4">
                    {NEARBY.map((item) => (
                      <li key={item.name}>
                        <p className="text-[0.95rem]">{item.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {item.detail}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="eyebrow text-muted-foreground">Getting here</p>
                  <ul className="mt-5 flex flex-col gap-4">
                    {TRAVEL.map((item) => (
                      <li key={item.name}>
                        <p className="text-[0.95rem]">{item.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {item.detail}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Button
                size="lg"
                variant="outline"
                className="mt-10"
                nativeButton={false}
                render={<Link href={path("/location")} />}
              >
                Directions & contact
              </Button>
            </Reveal>
          </div>

          <RevealImage className="lg:col-span-7">
            <div className="relative aspect-3/2 overflow-hidden lg:aspect-auto lg:h-full">
              <Image
                src={`${IMAGE_BASE}/coastline.webp`}
                alt="The coastline between Monterosso and Punta Mesco"
                fill
                sizes="(min-width:1600px) 848px, (min-width:1024px) 57vw, 100vw"
                className="object-cover"
              />
            </div>
          </RevealImage>
        </div>
      </Shell>
    </section>
  );
}

function Reviews() {
  return (
    <section className="bg-secondary/50 py-24 sm:py-32 lg:py-40">
      <Shell>
        <SectionHeading
          eyebrow="Guests"
          title="What people say when they get home."
          align="center"
        />

        <ul className="mt-16 grid gap-12 lg:mt-24 lg:grid-cols-3 lg:gap-14">
          {TESTIMONIALS.map((testimonial, index) => (
            <li key={testimonial.name}>
              <Reveal delay={index * 0.12}>
                <figure className="flex h-full flex-col">
                  <div
                    className="flex gap-1 text-primary"
                    aria-label={`${testimonial.rating} out of 5`}
                  >
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="size-3.5 fill-current" />
                    ))}
                  </div>
                  <blockquote className="mt-6 flex-1 font-heading text-[1.5rem] leading-[1.35] font-normal text-pretty">
                    “{testimonial.quote}”
                  </blockquote>
                  <figcaption className="mt-7 border-t border-border pt-5">
                    <p className="text-[0.95rem]">{testimonial.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {testimonial.origin}
                    </p>
                  </figcaption>
                </figure>
              </Reveal>
            </li>
          ))}
        </ul>
      </Shell>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="relative isolate">
      <Parallax className="absolute inset-0" amount={5}>
        <Image
          src={`${IMAGE_BASE}/evening/night-house.webp`}
          alt="The house at night seen from the water, every window lit"
          fill
          sizes="100vw"
          className="object-cover"
        />
      </Parallax>
      <div aria-hidden className="absolute inset-0 bg-foreground/25" />

      <Shell className="relative flex min-h-[82svh] flex-col items-center justify-center py-28 text-center text-background">
        <Reveal>
          <p className="eyebrow text-background/70">Casa Lume</p>
          <p className="mt-8 font-heading text-[clamp(3rem,10vw,8rem)] leading-[1.05] font-light tracking-[-0.02em]">
            Stay a little
            <br />
            <em className="font-normal italic">longer.</em>
          </p>
          <p className="mx-auto mt-9 max-w-md text-[1.0625rem] leading-relaxed text-background/85">
            Most guests book three nights and wish they had booked six. The
            calendar opens twelve months ahead.
          </p>
          <Button
            size="lg"
            className="mt-11"
            nativeButton={false}
            render={<Link href={path("/booking")} />}
          >
            Check availability
            <ArrowRight />
          </Button>
        </Reveal>
      </Shell>
    </section>
  );
}

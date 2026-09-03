import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Reveal,
  RevealImage,
} from "@/app/(concepts)/casa-lume/_components/motion-primitives";
import { PageOpener, Shell } from "@/app/(concepts)/casa-lume/_components/section";
import { formatCurrency } from "@/app/(concepts)/casa-lume/_lib/booking";
import { IMAGE_BASE, ROOMS } from "@/app/(concepts)/casa-lume/_lib/content";
import { path, url } from "@/app/(concepts)/casa-lume/site";

const description =
  "Seventeen rooms and suites above the Ligurian sea — garden terraces, sea-facing balconies, and a signature suite with its own roof and plunge pool.";

export const metadata: Metadata = {
  title: "Rooms & suites",
  description,
  alternates: { canonical: path("/rooms") },
  openGraph: {
    title: "Rooms & suites at Casa Lume",
    description,
    url: url("/rooms"),
  },
};

export default function RoomsPage() {
  return (
    <>
      <PageOpener
        eyebrow="Rooms & suites"
        title="Seventeen rooms, no two alike."
        intro="Every room was a bedroom in a family house before it was a room in a hotel. We changed the plumbing and very little else."
        photo={{
          src: `${IMAGE_BASE}/evening/house-corridor.webp`,
          alt: "The upstairs corridor, shuttered doors ajar and evening light on the floor",
        }}
      />

      <div className="border-t border-border/60 py-20 sm:py-28 lg:py-32">
        <Shell>
          <ul className="flex flex-col gap-24 sm:gap-32 lg:gap-40">
            {ROOMS.map((room, index) => {
              const flip = index % 2 === 1;
              return (
                <li key={room.slug}>
                  <article className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-x-16">
                    <RevealImage
                      className={
                        flip
                          ? "lg:order-2 lg:col-span-5 lg:col-start-8"
                          : "lg:col-span-5"
                      }
                    >
                      <Link
                        href={path(`/rooms/${room.slug}`)}
                        className="group block overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                      >
                        <div className="relative aspect-4/5 overflow-hidden">
                          <Image
                            src={room.photo.src}
                            alt={room.photo.alt}
                            fill
                            sizes="(min-width:1600px) 620px, (min-width:1024px) 40vw, 100vw"
                            className="object-cover transition-transform duration-1400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-104"
                          />
                        </div>
                      </Link>
                    </RevealImage>

                    <Reveal
                      delay={0.1}
                      className={
                        flip
                          ? "lg:order-1 lg:col-span-6"
                          : "lg:col-span-6 lg:col-start-7"
                      }
                    >
                      <p className="eyebrow flex items-center gap-4 text-primary">
                        <span className="tabular-nums text-muted-foreground">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span aria-hidden className="h-px w-6 bg-border" />
                        {room.tagline}
                      </p>
                      <h2 className="mt-6 font-heading text-[clamp(2.25rem,4.5vw,3.75rem)] leading-[1.02] font-light tracking-[-0.015em]">
                        {room.name}
                      </h2>
                      <p className="mt-6 max-w-md text-[1.0625rem] leading-relaxed text-muted-foreground">
                        {room.description}
                      </p>

                      <dl className="mt-9 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-border pt-8 sm:grid-cols-4">
                        <Spec label="Sleeps" value={String(room.guests)} />
                        <Spec label="Size" value={room.size} />
                        <Spec label="View" value={room.view} />
                        <Spec label="Bed" value={room.bed} />
                      </dl>

                      <div className="mt-9 flex flex-wrap items-center justify-between gap-6 border-t border-border pt-8">
                        <p className="font-heading text-[1.75rem] leading-none font-normal">
                          {formatCurrency(room.priceFrom)}
                          <span className="ml-2 align-middle font-sans text-xs tracking-wide text-muted-foreground">
                            per night
                          </span>
                        </p>
                        <div className="flex flex-wrap gap-3">
                          <Button
                            nativeButton={false}
                            render={<Link href={path(`/rooms/${room.slug}`)} />}
                          >
                            Explore room
                            <ArrowRight />
                          </Button>
                          <Button
                            variant="outline"
                            nativeButton={false}
                            render={
                              <Link href={`${path("/booking")}?room=${room.slug}`} />
                            }
                          >
                            Book this room
                          </Button>
                        </div>
                      </div>
                    </Reveal>
                  </article>
                </li>
              );
            })}
          </ul>
        </Shell>
      </div>
    </>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="eyebrow text-muted-foreground">{label}</dt>
      <dd className="mt-2.5 text-[0.95rem]">{value}</dd>
    </div>
  );
}

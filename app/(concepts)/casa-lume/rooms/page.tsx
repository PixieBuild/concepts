import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Maximize, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal, RevealImage } from "@/app/(concepts)/casa-lume/_components/motion-primitives";
import { PageHero, Shell } from "@/app/(concepts)/casa-lume/_components/section";
import Image from "next/image";
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
      <PageHero
        eyebrow="Rooms & suites"
        title="Seventeen rooms, no two alike."
        intro="Every room was a bedroom in a family house before it was a room in a hotel. We changed the plumbing and very little else."
        photo={{ src: `${IMAGE_BASE}/room-seaview.webp`, alt: "A Sea View Suite in the morning" }}
      />

      <div className="py-24 sm:py-32 lg:py-40">
        <Shell>
          <ul className="flex flex-col gap-24 sm:gap-32 lg:gap-40">
            {ROOMS.map((room, index) => (
              <li key={room.slug}>
                <article className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-16">
                  <RevealImage
                    className={
                      index % 2 === 0
                        ? "lg:col-span-7"
                        : "lg:col-span-7 lg:order-2"
                    }
                  >
                    <Link
                      href={path(`/rooms/${room.slug}`)}
                      className="group block overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                    >
                      <div className="relative aspect-3/2 overflow-hidden">
                        <Image
                          src={room.photo.src}
                          alt={room.photo.alt}
                          fill
                          sizes="(min-width:1600px) 848px, (min-width:1024px) 57vw, 100vw"
                          className="object-cover transition-transform duration-1400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-104"
                        />
                      </div>
                    </Link>
                  </RevealImage>

                  <Reveal
                    delay={0.1}
                    className={
                      index % 2 === 0
                        ? "lg:col-span-5"
                        : "lg:col-span-5 lg:order-1"
                    }
                  >
                    <p className="eyebrow text-primary">{room.tagline}</p>
                    <h2 className="mt-5 font-heading text-[clamp(2rem,4.5vw,3.25rem)] leading-[1.02] font-light tracking-tight">
                      {room.name}
                    </h2>
                    <p className="mt-5 max-w-md leading-relaxed text-muted-foreground">
                      {room.description}
                    </p>

                    <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-5 border-y border-border/70 py-7 text-sm sm:grid-cols-4 lg:grid-cols-2">
                      <Spec
                        icon={<Users className="size-3.5" />}
                        label="Guests"
                        value={String(room.guests)}
                      />
                      <Spec
                        icon={<Maximize className="size-3.5" />}
                        label="Size"
                        value={room.size}
                      />
                      <Spec label="View" value={room.view} />
                      <Spec label="Bed" value={room.bed} />
                    </dl>

                    <ul className="mt-7 flex flex-wrap gap-x-3 gap-y-2">
                      {room.amenities.slice(0, 4).map((amenity) => (
                        <li
                          key={amenity}
                          className="border border-border px-3 py-1.5 text-xs text-muted-foreground"
                        >
                          {amenity}
                        </li>
                      ))}
                    </ul>

                    <div className="mt-9 flex flex-wrap items-center gap-4">
                      <p className="font-heading text-2xl leading-none font-normal">
                        {formatCurrency(room.priceFrom)}
                        <span className="ml-2 align-middle text-xs tracking-wide text-muted-foreground">
                          per night
                        </span>
                      </p>
                    </div>

                    <div className="mt-7 flex flex-col gap-3 sm:flex-row">
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
                  </Reveal>
                </article>
              </li>
            ))}
          </ul>
        </Shell>
      </div>
    </>
  );
}

function Spec({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="eyebrow flex items-center gap-1.5 text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="mt-2">{value}</dd>
    </div>
  );
}

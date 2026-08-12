import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal, RevealImage } from "@/app/(concepts)/casa-lume/_components/motion-primitives";
import Image from "next/image";
import { Shell } from "@/app/(concepts)/casa-lume/_components/section";
import { formatCurrency } from "@/app/(concepts)/casa-lume/_lib/booking";
import { ROOMS, getRoom } from "@/app/(concepts)/casa-lume/_lib/content";
import { path, url } from "@/app/(concepts)/casa-lume/site";

export function generateStaticParams() {
  return ROOMS.map((room) => ({ slug: room.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/casa-lume/rooms/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const room = getRoom(slug);
  if (!room) return {};

  return {
    title: room.name,
    description: room.description,
    alternates: { canonical: path(`/rooms/${room.slug}`) },
    openGraph: {
      title: `${room.name} — Casa Lume`,
      description: room.description,
      url: url(`/rooms/${room.slug}`),
    },
  };
}

export default async function RoomDetailPage({
  params,
}: PageProps<"/casa-lume/rooms/[slug]">) {
  const { slug } = await params;
  const room = getRoom(slug);
  if (!room) notFound();

  const related = ROOMS.filter((r) => r.slug !== room.slug).slice(0, 3);
  const bookHref = `${path("/booking")}?room=${room.slug}`;

  return (
    <>
      <section className="relative isolate overflow-hidden">
        <Image
          src={room.photo.src}
          alt={room.photo.alt}
          fill
          priority
          sizes="100vw"
          className="ken-burns object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-b from-foreground/55 via-foreground/30 to-foreground/80"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-r from-foreground/60 via-foreground/15 to-transparent"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-(--clay) opacity-25 mix-blend-soft-light"
        />
        <Shell className="relative flex min-h-[78svh] flex-col justify-end pt-36 pb-16 text-background sm:pb-20">
          <p className="eyebrow flex items-center gap-4 text-background/85">
            <span aria-hidden className="h-px w-12 bg-background/45" />
            {room.tagline}
          </p>
          <h1 className="mt-6 max-w-[14ch] font-heading text-[clamp(2.75rem,8vw,6.5rem)] leading-[0.95] font-light tracking-[-0.02em]">
            {room.name}
          </h1>
        </Shell>
      </section>

      <div className="py-20 sm:py-28 lg:py-32">
        <Shell>
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
            <div className="lg:col-span-7">
              <Reveal>
                {room.longDescription.map((paragraph) => (
                  <p
                    key={paragraph.slice(0, 32)}
                    className="mb-6 text-[1.0625rem] leading-[1.75] text-foreground/85 last:mb-0"
                  >
                    {paragraph}
                  </p>
                ))}
              </Reveal>

              <Reveal delay={0.1}>
                <h2 className="mt-14 font-heading text-2xl font-normal">
                  In the room
                </h2>
                <ul className="mt-7 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                  {room.amenities.map((amenity) => (
                    <li
                      key={amenity}
                      className="flex items-start gap-3 text-[0.95rem] text-foreground/85"
                    >
                      <Check className="mt-1 size-3.5 shrink-0 text-primary" />
                      {amenity}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>

            <aside className="lg:col-span-5">
              <Reveal delay={0.15}>
                <div className="border border-border bg-card p-7 lg:sticky lg:top-28">
                  <p className="eyebrow text-muted-foreground">From</p>
                  <p className="mt-3 font-heading text-4xl leading-none font-light">
                    {formatCurrency(room.priceFrom)}
                    <span className="ml-2 align-middle text-xs tracking-wide text-muted-foreground">
                      per night
                    </span>
                  </p>

                  <dl className="mt-8 flex flex-col gap-4 border-t border-border pt-7 text-sm">
                    <Row label="Sleeps" value={`${room.guests} guests`} />
                    <Row label="Size" value={room.size} />
                    <Row label="View" value={room.view} />
                    <Row label="Bed" value={room.bed} />
                  </dl>

                  <Button
                    size="lg"
                    className="mt-8 w-full"
                    nativeButton={false}
                    render={<Link href={bookHref} />}
                  >
                    Check availability
                  </Button>
                  <p className="mt-4 text-center text-xs text-muted-foreground">
                    Breakfast and tourist tax included.
                  </p>
                </div>
              </Reveal>
            </aside>
          </div>

          <div className="mt-20 grid gap-6 sm:mt-28 sm:grid-cols-3">
            {room.gallery.map((item, index) => (
              <RevealImage key={item.src} delay={index * 0.1}>
                <div className="relative aspect-4/5 overflow-hidden">
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    sizes="(min-width:1600px) 485px, (min-width:640px) 31vw, 100vw"
                    className="object-cover"
                  />
                </div>
              </RevealImage>
            ))}
          </div>
        </Shell>
      </div>

      <section className="border-t border-border/60 py-20 sm:py-28">
        <Shell>
          <Reveal>
            <h2 className="font-heading text-[clamp(1.75rem,4vw,2.75rem)] leading-tight font-light">
              Other rooms in the house
            </h2>
          </Reveal>

          <ul className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {related.map((other, index) => (
              <li key={other.slug}>
                <Reveal delay={index * 0.1}>
                  <Link
                    href={path(`/rooms/${other.slug}`)}
                    className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                  >
                    <div className="relative aspect-4/5 overflow-hidden">
                      <Image
                        src={other.card}
                        alt={other.photo.alt}
                        fill
                        sizes="(min-width:1600px) 485px, (min-width:640px) 31vw, 100vw"
                        className="object-cover transition-transform duration-1200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-104"
                      />
                    </div>
                    <h3 className="mt-5 font-heading text-xl leading-none font-normal">
                      {other.name}
                    </h3>
                    <p className="mt-2.5 text-sm text-muted-foreground">
                      From {formatCurrency(other.priceFrom)} · Sleeps{" "}
                      {other.guests}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm text-primary">
                      Explore room
                      <ArrowRight className="size-3.5 transition-transform duration-500 group-hover:translate-x-1" />
                    </span>
                  </Link>
                </Reveal>
              </li>
            ))}
          </ul>
        </Shell>
      </section>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}

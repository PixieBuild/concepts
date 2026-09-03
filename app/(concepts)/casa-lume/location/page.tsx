import type { Metadata } from "next";
import { ArrowUpRight, Mail, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal, RevealImage } from "@/app/(concepts)/casa-lume/_components/motion-primitives";
import Image from "next/image";
import { PageOpener, SectionHeading, Shell } from "@/app/(concepts)/casa-lume/_components/section";
import { IMAGE_BASE, NEARBY, TRAVEL } from "@/app/(concepts)/casa-lume/_lib/content";
import { path, url } from "@/app/(concepts)/casa-lume/site";

const ADDRESS = "Via delle Terrazze 4, 19016 Monterosso al Mare SP, Italy";
const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  "Monterosso al Mare, Liguria, Italy",
)}`;

const description =
  "Casa Lume sits on the terraces between Monterosso al Mare and Punta Mesco. Ninety minutes from Genoa, fifteen from the station.";

export const metadata: Metadata = {
  title: "Location & contact",
  description,
  alternates: { canonical: path("/location") },
  openGraph: {
    title: "Finding Casa Lume",
    description,
    url: url("/location"),
  },
};

export default function LocationPage() {
  return (
    <>
      <PageOpener
        eyebrow="Location"
        title="Above a cove the road does not reach."
        intro="Twelve minutes from Monterosso, and a long way from everything else. We collect you from the station if you tell us the train."
        photo={{ src: `${IMAGE_BASE}/village-dusk.webp`, alt: "Vernazza at dusk, twenty minutes along the coast" }}
        ratio="aspect-21/9"
      />

      <section className="py-24 sm:py-32 lg:py-40">
        <Shell>
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
            <div className="lg:col-span-5">
              <SectionHeading
                eyebrow="Finding us"
                title="Via delle Terrazze 4"
                intro="The last stretch is a private track off the coast road. It is steep and narrow — leave the car at the gate and we will bring your bags up."
              />

              <Reveal delay={0.12}>
                <address className="mt-10 flex flex-col gap-5 border-t border-border/80 pt-8 text-[0.95rem] not-italic">
                  <p className="leading-relaxed text-muted-foreground">
                    {ADDRESS}
                  </p>
                  <a
                    href="tel:+390187900142"
                    className="inline-flex items-center gap-3 transition-colors hover:text-primary"
                  >
                    <Phone className="size-4 text-primary" />
                    +39 0187 900 142
                  </a>
                  <a
                    href="mailto:stay@casalume.it"
                    className="inline-flex items-center gap-3 transition-colors hover:text-primary"
                  >
                    <Mail className="size-4 text-primary" />
                    stay@casalume.it
                  </a>
                </address>

                <Button
                  className="mt-9"
                  nativeButton={false}
                  render={
                    <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" />
                  }
                >
                  Get directions
                  <ArrowUpRight />
                </Button>
              </Reveal>
            </div>

            <div className="lg:col-span-7">
              <RevealImage>
                <a
                  href={MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                >
                  <div className="relative aspect-3/2 overflow-hidden">
                    <Image
                      src={`${IMAGE_BASE}/evening/gate.webp`}
                      alt="The gate at the top of the track, where the car stays"
                      fill
                      sizes="(min-width:1600px) 848px, (min-width:1024px) 57vw, 100vw"
                      className="object-cover transition-transform duration-1400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-103"
                    />
                  </div>
                </a>
              </RevealImage>
            </div>
          </div>
        </Shell>
      </section>

      <section className="border-t border-border/60 py-24 sm:py-32">
        <Shell>
          <div className="grid gap-14 md:grid-cols-2 md:gap-20">
            <Reveal>
              <h2 className="font-heading text-[clamp(1.75rem,4vw,2.5rem)] leading-tight font-light">
                Getting here
              </h2>
              <ul className="mt-9 flex flex-col">
                {TRAVEL.map((item) => (
                  <li
                    key={item.name}
                    className="flex items-baseline justify-between gap-6 border-b border-border/70 py-5"
                  >
                    <span className="text-[0.95rem]">{item.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {item.detail}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-7 text-sm leading-relaxed text-muted-foreground">
                We arrange transfers from any of the three airports. The
                Signature Suite includes them.
              </p>
            </Reveal>

            <Reveal delay={0.1}>
              <h2 className="font-heading text-[clamp(1.75rem,4vw,2.5rem)] leading-tight font-light">
                Worth the trip
              </h2>
              <ul className="mt-9 flex flex-col">
                {NEARBY.map((item) => (
                  <li
                    key={item.name}
                    className="flex items-baseline justify-between gap-6 border-b border-border/70 py-5"
                  >
                    <span className="text-[0.95rem]">{item.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {item.detail}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-7 text-sm leading-relaxed text-muted-foreground">
                The concierge keeps a folder of walks, swims and places to eat
                that are not in any guidebook. Ask for it on arrival.
              </p>
            </Reveal>
          </div>
        </Shell>
      </section>
    </>
  );
}

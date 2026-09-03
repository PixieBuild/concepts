import type { Metadata, ResolvingMetadata } from "next";

import { Reveal, RevealImage } from "@/app/(concepts)/casa-lume/_components/motion-primitives";
import Image from "next/image";
import { PageOpener, SectionHeading, Shell } from "@/app/(concepts)/casa-lume/_components/section";
import { TableReservation } from "./_components/table-reservation";
import { IMAGE_BASE, DINING } from "@/app/(concepts)/casa-lume/_lib/content";
import { path, url } from "@/app/(concepts)/casa-lume/site";

const description =
  "Sale seats twenty-six on the lower terrace, with one menu written each afternoon. Bar Lume pours Ligurian vermouth from five until late.";

export async function generateMetadata(
  _props: unknown,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  return {
  title: "Dining",
  description,
  alternates: { canonical: path("/dining") },
  openGraph: {
    images: (await parent).openGraph?.images ?? [],
    title: "Dining at Casa Lume",
    description,
    url: url("/dining"),
  },
  };
}

const NUMERALS = ["I", "II", "III", "IV"];

const MENU = [
  {
    course: "To begin",
    dishes: [
      "Anchovies cured that morning, lemon, oil from the terraces",
      "Focaccia di Recco, stracchino, still warm",
      "Datterini, basil, three-year Parmigiano",
    ],
  },
  {
    course: "Pasta",
    dishes: [
      "Trofie, pesto pounded by hand, green beans and potato",
      "Pansotti, walnut cream, marjoram",
    ],
  },
  {
    course: "From the boats",
    dishes: [
      "Whole fish, salt-baked, whatever came in at four",
      "Cuttlefish, chard, its own ink",
    ],
  },
  {
    course: "To end",
    dishes: [
      "Sciacchetrà with almond biscotti",
      "Lemon granita, olive oil, sea salt",
    ],
  },
];

export default function DiningPage() {
  return (
    <>
      <PageOpener
        eyebrow="Dining"
        title="One menu, written each afternoon."
        intro="The kitchen does not decide until the boats are in and the garden has been walked. Whatever arrives is what you eat, and it is always enough."
        photo={{ src: `${IMAGE_BASE}/evening/dining-terrace.webp`, alt: "The lower terrace laid for dinner at dusk" }}
      />

      <section className="py-24 sm:py-32 lg:py-40">
        <Shell>
          <div className="grid gap-14 lg:grid-cols-12 lg:gap-20">
            <div className="lg:col-span-5 lg:sticky lg:top-32 lg:self-start">
              <SectionHeading
                eyebrow={DINING.restaurant.kicker}
                title={DINING.restaurant.name}
                intro={DINING.restaurant.description}
              />
              <Reveal delay={0.12}>
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
                <div className="mt-9">
                  <TableReservation />
                </div>
              </Reveal>
            </div>

            <div className="lg:col-span-7">
              <RevealImage>
                <div className="relative aspect-3/2 overflow-hidden">
                  <Image
                    src={`${IMAGE_BASE}/evening/house-kitchen.webp`}
                    alt="The kitchen at the end of the afternoon, before the menu is written"
                    fill
                    sizes="(min-width:1600px) 844px, (min-width:1024px) 56vw, 100vw"
                    className="object-cover"
                  />
                </div>
              </RevealImage>
              <div className="mt-6 grid grid-cols-2 gap-6">
                <RevealImage delay={0.12}>
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={`${IMAGE_BASE}/evening/plate.webp`}
                      alt="Trofie with hand-pounded pesto at the pass"
                      fill
                      sizes="(min-width:1600px) 410px, (min-width:1024px) 27vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                </RevealImage>
                <RevealImage delay={0.2} className="pt-10">
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={`${IMAGE_BASE}/evening/table-dusk.webp`}
                      alt="A table on the lower terrace, the candle just lit"
                      fill
                      sizes="(min-width:1600px) 410px, (min-width:1024px) 27vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                </RevealImage>
              </div>
            </div>
          </div>
        </Shell>
      </section>

      <section id="menu" className="scroll-mt-24 bg-secondary/50 py-24 sm:py-32">
        <Shell>
          <SectionHeading
            eyebrow="This evening"
            title="A menu, for the sake of illustration."
            intro="It changes daily. This is what was served on a Thursday in late June."
            align="center"
          />

          <div className="mx-auto mt-16 max-w-3xl border-t border-border/70 sm:mt-20">
            {MENU.map((section, index) => (
              <Reveal key={section.course} delay={index * 0.06}>
                <div className="grid gap-y-5 border-b border-border/70 py-8 sm:grid-cols-[8rem_1fr] sm:gap-x-10 sm:py-10">
                  <div className="flex items-baseline gap-3 sm:flex-col sm:gap-2.5">
                    <span className="font-heading text-lg leading-none font-normal text-primary">
                      {NUMERALS[index]}
                    </span>
                    <span className="eyebrow text-muted-foreground">
                      {section.course}
                    </span>
                  </div>
                  <ul className="flex flex-col gap-3.5">
                    {section.dishes.map((dish) => (
                      <li
                        key={dish}
                        className="font-heading text-[1.3rem] leading-snug font-normal text-pretty"
                      >
                        {dish}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}

            <Reveal delay={0.28}>
              <div className="flex flex-col items-start gap-7 py-9 sm:flex-row sm:items-center sm:justify-between sm:gap-10">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Five courses, €95 per person.
                  <br className="hidden sm:block" /> Wine pairing €60.
                </p>
                <TableReservation />
              </div>
            </Reveal>
          </div>
        </Shell>
      </section>

      <section className="py-24 sm:py-32 lg:py-40">
        <Shell>
          <div className="grid gap-14 lg:grid-cols-12 lg:items-center lg:gap-20">
            <div className="order-2 lg:order-1 lg:col-span-7">
              <RevealImage>
                <div className="relative aspect-3/2 overflow-hidden">
                  <Image
                    src={`${IMAGE_BASE}/evening/bar.webp`}
                    alt="Bar Lume, six stools and the courtyard door open"
                    fill
                    sizes="(min-width:1600px) 844px, (min-width:1024px) 56vw, 100vw"
                    className="object-cover"
                  />
                </div>
              </RevealImage>
            </div>

            <div className="order-1 lg:order-2 lg:col-span-5">
              <SectionHeading
                eyebrow={DINING.bar.kicker}
                title={DINING.bar.name}
                intro={DINING.bar.description}
              />
              <Reveal delay={0.12}>
                <dl className="mt-10 flex flex-col gap-3 border-t border-border/80 pt-8">
                  {DINING.bar.hours.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-baseline justify-between gap-6 text-[0.95rem]"
                    >
                      <dt className="text-muted-foreground">{row.label}</dt>
                      <dd className="tabular-nums">{row.value}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
                  No reservation needed at the bar. If the six stools are taken,
                  the courtyard has room.
                </p>
              </Reveal>
            </div>
          </div>
        </Shell>
      </section>
    </>
  );
}

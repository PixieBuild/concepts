import type { Metadata } from "next";

import { ExperienceBooking } from "./_components/experience-booking";
import { Reveal, RevealImage } from "@/app/(concepts)/casa-lume/_components/motion-primitives";
import Image from "next/image";
import { PageOpener, SectionHeading, Shell } from "@/app/(concepts)/casa-lume/_components/section";
import { IMAGE_BASE, EXPERIENCES } from "@/app/(concepts)/casa-lume/_lib/content";
import { path, url } from "@/app/(concepts)/casa-lume/site";

const description =
  "A spa cut into the rock, an infinity pool on the lowest terrace, a restored gozzo with a skipper who grew up in the next bay.";

export const metadata: Metadata = {
  title: "Experiences",
  description,
  alternates: { canonical: path("/experiences") },
  openGraph: {
    title: "Experiences at Casa Lume",
    description,
    url: url("/experiences"),
  },
};

export default function ExperiencesPage() {
  const [spa, pool, boat, hike, wine, dinner] = EXPERIENCES;

  return (
    <>
      <PageOpener
        eyebrow="Experiences"
        title="Days arranged, or left alone."
        intro="Nothing is compulsory and nothing is scheduled unless you ask. But everything below can be ready by the time you come down."
        photo={{ src: `${IMAGE_BASE}/evening/house-upper-terrace.webp`, alt: "Two chairs on the upper terrace, facing the gulf" }}
      />

      <section id={spa.slug} className="scroll-mt-24 py-24 sm:py-32 lg:py-40">
        <Shell>
          <div className="grid gap-12 lg:grid-cols-12 lg:items-end lg:gap-16">
            <RevealImage className="lg:col-span-7">
              <div className="relative aspect-3/2 overflow-hidden">
                <Image
                  src={`${IMAGE_BASE}/evening/spa.webp`}
                  alt={spa.photo.alt}
                  fill
                  sizes="(min-width:1600px) 848px, (min-width:1024px) 57vw, 100vw"
                  className="object-cover"
                />
              </div>
            </RevealImage>
            <Reveal delay={0.1} className="lg:col-span-5 lg:pb-4">
              <SectionHeading
                eyebrow={spa.category}
                title={spa.name}
                intro={spa.description}
              />
              <Meta duration={spa.duration} price={spa.price} />
              <div className="mt-8">
                <ExperienceBooking defaultExperience={spa.slug} />
              </div>
            </Reveal>
          </div>
        </Shell>
      </section>

      <section id={pool.slug} className="scroll-mt-24 bg-secondary/50 py-24 sm:py-32">
        <Shell>
          <div className="mx-auto max-w-3xl text-center">
            <SectionHeading
              eyebrow={pool.category}
              title={pool.name}
              intro={pool.description}
              align="center"
            />
          </div>
          <RevealImage className="mt-14">
            <div className="relative aspect-3/2 overflow-hidden sm:aspect-21/9">
              <Image
                src={pool.photo.src}
                alt={pool.photo.alt}
                fill
                sizes="100vw"
                className="object-cover"
              />
            </div>
          </RevealImage>
        </Shell>
      </section>

      <section id={boat.slug} className="scroll-mt-24 py-24 sm:py-32 lg:py-40">
        <Shell>
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-16">
            <Reveal className="lg:col-span-5">
              <SectionHeading
                eyebrow={boat.category}
                title={boat.name}
                intro={boat.description}
              />
              <Meta duration={boat.duration} price={boat.price} />
              <div className="mt-8">
                <ExperienceBooking defaultExperience={boat.slug} />
              </div>
            </Reveal>
            <div className="lg:col-span-7">
              <div className="grid grid-cols-2 gap-5">
                <RevealImage>
                  <div className="relative aspect-4/3 overflow-hidden">
                    <Image
                      src={boat.photo.src}
                      alt={boat.photo.alt}
                      fill
                      sizes="(min-width:1600px) 410px, (min-width:1024px) 27vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                </RevealImage>
                <RevealImage delay={0.12} className="pt-12">
                  <div className="relative aspect-4/3 overflow-hidden">
                    <Image
                      src={`${IMAGE_BASE}/boat-cove.webp`}
                      alt="A cove reachable only from the water"
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

      <section className="border-t border-border/60 py-24 sm:py-32">
        <Shell>
          <SectionHeading
            eyebrow="Also arranged"
            title="Walking, wine, and one table on the point."
          />

          <ul className="mt-14 grid gap-12 md:grid-cols-3 md:gap-8">
            {[hike, wine, dinner].map((experience, index) => (
              <li key={experience.slug} id={experience.slug} className="scroll-mt-24">
                <Reveal delay={index * 0.1}>
                  <div className="relative aspect-3/2 overflow-hidden">
                    <Image
                      src={experience.photo.src}
                      alt={experience.photo.alt}
                      fill
                      sizes="(min-width:1600px) 485px, (min-width:768px) 31vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                  <p className="eyebrow mt-6 text-primary">
                    {experience.category}
                  </p>
                  <h3 className="mt-3 font-heading text-2xl leading-tight font-normal">
                    {experience.name}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {experience.description}
                  </p>
                  <p className="mt-4 text-xs text-muted-foreground/80">
                    {experience.duration} · {experience.price}
                  </p>
                  <div className="mt-6">
                    <ExperienceBooking defaultExperience={experience.slug} />
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </Shell>
      </section>
    </>
  );
}

function Meta({ duration, price }: { duration: string; price: string }) {
  return (
    <dl className="mt-9 flex flex-wrap gap-x-12 gap-y-4 border-t border-border/80 pt-7">
      <div>
        <dt className="eyebrow text-muted-foreground">Duration</dt>
        <dd className="mt-2 text-[0.95rem]">{duration}</dd>
      </div>
      <div>
        <dt className="eyebrow text-muted-foreground">From</dt>
        <dd className="mt-2 text-[0.95rem]">{price}</dd>
      </div>
    </dl>
  );
}

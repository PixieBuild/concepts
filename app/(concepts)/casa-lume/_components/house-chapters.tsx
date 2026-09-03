"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { Reveal } from "./motion-primitives";
import { Shell } from "./section";
import { IMAGE_BASE } from "@/app/(concepts)/casa-lume/_lib/content";
import { path } from "@/app/(concepts)/casa-lume/site";

type Chapter = {
  id: string;
  eyebrow: string;
  title: React.ReactNode;
  body: string;
  image: string;
  alt: string;
  link?: { href: string; label: string };
  facts?: { term: string; detail: string }[];
};

const CHAPTERS: Chapter[] = [
  {
    id: "house",
    eyebrow: "The house",
    title: (
      <>
        A family house that
        <em className="font-normal italic"> never quite </em>
        stopped being one.
      </>
    ),
    body: "Built in 1961 as a summer place for a Genoese family, Casa Lume kept its proportions when it became a hotel: small rooms, thick walls, and a kitchen that still works to whatever the boats brought in.",
    image: "house-terraces",
    alt: "The house seen from the olive terraces below it, late sun on the facade",
    facts: [
      { term: "Rooms", detail: "Seventeen, no two alike" },
      { term: "Season", detail: "April to early November" },
      { term: "The sea", detail: "Ninety steps down" },
      { term: "Nearest village", detail: "Monterosso, 12 min" },
    ],
  },
  {
    id: "upstairs",
    eyebrow: "Upstairs",
    title: "Doors left ajar, and floors that stay cool all summer.",
    body: "Every room was a bedroom in a family house before it was a room in a hotel. We changed the plumbing and very little else.",
    image: "house-corridor",
    alt: "The upstairs corridor, shuttered doors ajar and evening light across the terracotta floor",
    link: { href: "/rooms", label: "See the rooms" },
  },
  {
    id: "kitchen",
    eyebrow: "The kitchen",
    title: "One menu, written each afternoon.",
    body: "What the boats brought in, what the garden had, and what Sale felt like cooking. Bread from the wood oven, lemons from the terrace.",
    image: "house-kitchen",
    alt: "The kitchen at the end of the afternoon, lemons and bread on the marble, the sea in the window",
    link: { href: "/dining", label: "Dinner and the bar" },
  },
  {
    id: "terrace",
    eyebrow: "The upper terrace",
    title: "Days arranged, or left entirely alone.",
    body: "Two chairs under the vines and the whole gulf in front of them. If you want a boat at eight or a table on the point at sunset, we will have it ready.",
    image: "house-upper-terrace",
    alt: "Two wicker chairs on the upper terrace under a vine pergola, facing the sea",
    link: { href: "/experiences", label: "Experiences" },
  },
];

export function HouseChapters() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const reduced = useReducedMotion();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = refs.current.indexOf(entry.target as HTMLDivElement);
          if (index >= 0) setActive(index);
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    refs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="the-house" className="scroll-mt-24 py-20 sm:py-28 lg:py-0">
      <Shell className="lg:grid lg:grid-cols-12 lg:gap-x-16">
        <div className="lg:col-span-5">
          {CHAPTERS.map((chapter, index) => (
            <div
              key={chapter.id}
              ref={(el) => {
                refs.current[index] = el;
              }}
              className="flex flex-col justify-center py-10 first:pt-0 last:pb-0 lg:min-h-svh lg:py-24 lg:last:min-h-[72svh] lg:last:pb-32"
            >
              <div className="mb-8 lg:hidden">
                <Reveal>
                  <div className="relative aspect-3/2 overflow-hidden">
                    <Image
                      src={`${IMAGE_BASE}/evening/${chapter.image}.webp`}
                      alt={chapter.alt}
                      fill
                      sizes="100vw"
                      className="object-cover"
                    />
                  </div>
                </Reveal>
              </div>
              <Reveal>
                <p className="eyebrow text-primary">{chapter.eyebrow}</p>
                <h2 className="mt-5 font-heading text-[clamp(2.25rem,4.4vw,3.75rem)] leading-[1.02] font-light tracking-[-0.015em] text-balance">
                  {chapter.title}
                </h2>
                <p className="mt-6 max-w-lg text-[1.0625rem] leading-relaxed text-muted-foreground">
                  {chapter.body}
                </p>
                {chapter.facts && (
                  <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-8 border-t border-border pt-8">
                    {chapter.facts.map((item) => (
                      <div key={item.term}>
                        <dt className="eyebrow text-muted-foreground">{item.term}</dt>
                        <dd className="mt-3 font-heading text-xl leading-snug font-normal">
                          {item.detail}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
                {chapter.link && (
                  <Link
                    href={path(chapter.link.href)}
                    className="group mt-9 inline-flex items-center gap-3 text-[0.8125rem] tracking-[0.16em] text-foreground uppercase"
                  >
                    {chapter.link.label}
                    <ArrowRight className="size-4 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1.5" />
                  </Link>
                )}
              </Reveal>
            </div>
          ))}
        </div>

        <div className="hidden lg:col-span-7 lg:block">
          <div className="sticky top-0 flex h-svh items-center py-24">
            <div className="relative aspect-3/2 w-full max-h-full overflow-hidden">
              {CHAPTERS.map((chapter, index) => (
                <motion.div
                  key={chapter.id}
                  className="absolute inset-0"
                  initial={false}
                  animate={{
                    opacity: index === active ? 1 : 0,
                    scale: reduced ? 1 : index === active ? 1 : 1.05,
                  }}
                  transition={{ duration: 1.4, ease: [0.33, 0.9, 0.28, 1] }}
                >
                  <Image
                    src={`${IMAGE_BASE}/evening/${chapter.image}.webp`}
                    alt={chapter.alt}
                    fill
                    sizes="(min-width:1600px) 870px, (min-width:1024px) 55vw, 100vw"
                    className="object-cover"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </Shell>
    </section>
  );
}

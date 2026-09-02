"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Shell } from "./section";
import { ROOMS } from "@/app/(concepts)/casa-lume/_lib/content";
import { formatCurrency } from "@/app/(concepts)/casa-lume/_lib/booking";
import { path } from "@/app/(concepts)/casa-lume/site";

export function RoomsRail() {
  const railRef = useRef<HTMLUListElement>(null);
  const [scroll, setScroll] = useState({
    scrollable: false,
    atStart: true,
    atEnd: false,
  });

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const update = () => {
      const max = rail.scrollWidth - rail.clientWidth;
      setScroll({
        scrollable: max > 1,
        atStart: rail.scrollLeft <= 1,
        atEnd: rail.scrollLeft >= max - 1,
      });
    };

    const observer = new ResizeObserver(update);
    observer.observe(rail);
    rail.addEventListener("scroll", update, { passive: true });
    return () => {
      observer.disconnect();
      rail.removeEventListener("scroll", update);
    };
  }, []);

  function scrollBy(direction: 1 | -1) {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.querySelector("li");
    const amount = card ? card.clientWidth + 24 : rail.clientWidth * 0.8;
    rail.scrollBy({ left: amount * direction, behavior: "smooth" });
  }

  return (
    <div>
      <ul
        ref={railRef}
        className="hide-scrollbar mx-auto flex w-full max-w-[100rem] snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth scroll-pl-5 px-5 pb-2 sm:scroll-pl-8 sm:px-8 lg:scroll-pl-12 lg:px-12 xl:scroll-pl-16 xl:px-16 2xl:scroll-pl-24 2xl:px-24"
      >
        {ROOMS.map((room) => (
          <li
            key={room.slug}
            className="w-[78%] shrink-0 snap-start sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)] xl:w-[calc((100%-4.5rem)/4)]"
          >
            <Link
              href={path(`/rooms/${room.slug}`)}
              className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              <div className="relative aspect-4/5 overflow-hidden">
                <Image
                  src={room.card}
                  alt={room.photo.alt}
                  fill
                  sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 46vw, 78vw"
                  className="object-cover transition-transform duration-1200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-104"
                />
              </div>

              <div className="mt-6 flex items-baseline justify-between gap-4">
                <h3 className="font-heading text-[1.75rem] leading-none font-normal">
                  {room.name}
                </h3>
                <span className="eyebrow shrink-0 text-muted-foreground">
                  {formatCurrency(room.priceFrom)}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {room.description}
              </p>
              <p className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground/80">
                <span>Sleeps {room.guests}</span>
                <span aria-hidden>·</span>
                <span>{room.size}</span>
                <span aria-hidden>·</span>
                <span>{room.view}</span>
              </p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm text-primary">
                Explore room
                <ArrowRight className="size-3.5 transition-transform duration-500 group-hover:translate-x-1" />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <Shell className="mt-10 flex items-center justify-between gap-6">
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={path("/rooms")} />}
        >
          All rooms & suites
        </Button>

        {scroll.scrollable && (
          <div className="hidden items-center gap-2 sm:flex">
            <RailButton
              label="Previous rooms"
              disabled={scroll.atStart}
              onClick={() => scrollBy(-1)}
            >
              <ArrowLeft className="size-4" />
            </RailButton>
            <RailButton
              label="More rooms"
              disabled={scroll.atEnd}
              onClick={() => scrollBy(1)}
            >
              <ArrowRight className="size-4" />
            </RailButton>
          </div>
        )}
      </Shell>
    </div>
  );
}

function RailButton({
  children,
  label,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-11 place-items-center rounded-full border border-border text-foreground transition-colors hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {children}
    </button>
  );
}

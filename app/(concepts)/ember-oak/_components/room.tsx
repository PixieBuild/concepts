import Image from "next/image";

import { HandNote } from "./fx";
import { Reveal, RevealImage } from "./motion";
import { SheetTitle, Shell } from "./shell";
import { IMAGES, NOTES, ROOM_SQUARES, TIMELINE } from "../_lib/content";

export function Room() {
  return (
    <Shell>
      <section id="room" className="scroll-mt-14">
        <SheetTitle
          title="The room"
          line="Fifteen years of getting better at being a room. Most of it arrived secondhand, and stayed."
        />

        <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4 lg:gap-6">
          {ROOM_SQUARES.map((square, index) => (
            <figure key={square.caption} className="m-0">
              <RevealImage className="border border-foreground p-1 sm:p-1.5" delay={index * 0.06}>
                <div className="relative aspect-square border border-foreground">
                  <Image
                    src={square.src}
                    alt={square.alt}
                    fill
                    sizes="(min-width: 1024px) 20rem, 50vw"
                    className="object-cover"
                  />
                </div>
              </RevealImage>
              <figcaption className="mt-2.5 font-heading text-[0.9rem] italic leading-snug">
                {square.caption}
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-12 grid gap-10 md:grid-cols-[1.15fr_1fr] md:items-start md:gap-12 lg:mt-14">
          <Reveal>
            <div className="border-t border-foreground pt-6 font-heading text-[1.05rem] leading-[1.5] sm:columns-2 sm:gap-8">
              {TIMELINE.map((entry) => (
                <p key={entry.year} className="mb-4 break-inside-avoid">
                  <span className="label mb-0.5 block text-(--brass)">{entry.year}</span>
                  {entry.text}
                </p>
              ))}
              <p className="mt-2 break-inside-avoid text-[0.95rem] italic text-muted-foreground">
                &mdash; Mara &amp; Tomas, who still open on Sundays
              </p>
            </div>
          </Reveal>

          <figure className="relative m-0">
            <RevealImage className="border border-foreground p-1.5 sm:p-2" delay={0.1}>
              <div className="relative aspect-[4/3] border border-foreground">
                <Image
                  src={IMAGES.archive.src}
                  alt={IMAGES.archive.alt}
                  fill
                  sizes="(min-width: 768px) 40vw, 100vw"
                  className="object-cover"
                />
              </div>
            </RevealImage>
            <figcaption className="absolute -bottom-3 right-3">
              <HandNote delay={0.9} className="-rotate-3 bg-background px-2 text-[1.35rem] text-(--green) sm:text-[1.5rem]">
                {NOTES.archive}
              </HandNote>
            </figcaption>
          </figure>
        </div>
      </section>
    </Shell>
  );
}

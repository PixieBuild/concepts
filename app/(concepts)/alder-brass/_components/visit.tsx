import { ArrowUpRight } from "lucide-react";

import { HandNote, MapRoute } from "./fx";
import { Reveal } from "./motion";
import { Plate } from "./plate";
import { Ornament, SheetTitle, Shell } from "./shell";
import { ADDRESS, EMAIL, HOURS, IMAGES, NOTES, PHONE_DISPLAY, PHONE_HREF } from "../_lib/content";

export function Visit() {
  return (
    <Shell>
      <section id="visit" className="scroll-mt-14">
        <SheetTitle
          title="Find us"
          line="Green door, quiet end of Alder. Laptops after eleven, dogs whenever there is a chair."
        />

        <div className="mt-10 grid gap-10 md:grid-cols-[minmax(0,24rem)_1fr] md:items-start md:gap-12">
          <Reveal>
            <div className="sheet">
              <div className="sheet-in px-6 py-7 text-center sm:px-8">
                <p className="font-heading text-[0.95rem] italic text-(--brass)">Reservations</p>
                <p className="poster mt-1 text-[1.7rem] leading-none font-medium tracking-[0.06em] uppercase">
                  None. Walk in.
                </p>
                <Ornament className="mt-4 block" />
                <p className="mt-4 font-heading text-[0.95rem] italic text-(--brass)">Address</p>
                <p className="poster mt-1 text-[1.7rem] leading-[1.05] font-medium tracking-[0.06em] uppercase">
                  {ADDRESS.line1}
                  <br />
                  Portland, Oregon
                </p>
                <a
                  href={ADDRESS.maps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="label group mt-3 inline-flex items-center gap-2 text-foreground transition-colors hover:text-(--brass)"
                >
                  Get directions
                  <ArrowUpRight className="size-3.5 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
                <dl className="mt-6 border-t border-foreground text-left text-[0.85rem]">
                  {HOURS.map((row) => (
                    <div key={row.day} className="flex justify-between gap-4 border-b border-dotted border-input py-2">
                      <dt className="text-muted-foreground">{row.day}</dt>
                      <dd className="tabular-nums">{row.time}</dd>
                    </div>
                  ))}
                  <div className="flex justify-between gap-4 border-b border-dotted border-input py-2">
                    <dt className="text-muted-foreground">Telephone</dt>
                    <dd>
                      <a href={PHONE_HREF} className="tabular-nums transition-colors hover:text-(--brass)">
                        {PHONE_DISPLAY}
                      </a>
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 py-2">
                    <dt className="text-muted-foreground">Post</dt>
                    <dd>
                      <a href={`mailto:${EMAIL}`} className="transition-colors hover:text-(--brass)">
                        {EMAIL}
                      </a>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </Reveal>

          <div className="flex flex-col gap-10">
            <figure className="relative m-0">
              <Plate
                numeral="II"
                caption="The four blocks around Alder Street. The green door is ours."
                image={IMAGES.map}
                ratio="aspect-[4/3]"
                sizes="(min-width: 768px) 55vw, 100vw"
              />
              <MapRoute className="top-2 left-2 h-[calc(100%-4.5rem)] w-[calc(100%-1rem)] sm:top-2.5 sm:left-2.5" />
              <HandNote delay={2.4} className="absolute right-4 -bottom-3 -rotate-3 bg-background px-2 text-[1.35rem] text-(--green) sm:text-[1.5rem]">
                {NOTES.map}
              </HandNote>
            </figure>
            <Plate
              numeral="III"
              caption="The green door, from the pavement."
              image={IMAGES.door}
              ratio="aspect-[4/3]"
              sizes="(min-width: 768px) 55vw, 100vw"
              className="md:max-w-[60%]"
            />
          </div>
        </div>
      </section>
    </Shell>
  );
}

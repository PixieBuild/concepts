import { Fragment } from "react";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { COMPANY, GUIDES, ROSTER } from "../_lib/content";
import { metres } from "../_lib/format";
import { Frame } from "./frame";
import { Reveal } from "./reveal";
import { SectionHead } from "./section-head";

export function Guides({ shell, onDuty }: { shell: string; onDuty: string }) {
  const guides = [...GUIDES].sort((a, b) => Number(b.name === onDuty) - Number(a.name === onDuty));

  return (
    <section id="guides" tabIndex={-1} aria-labelledby="guides-title" className="py-20 sm:py-28 lg:pt-32 lg:pb-24">
      <div className={cn(shell, "flex items-end justify-between gap-6")}>
        <SectionHead id="guides-title" label={`12 guides · IFMGA carnet · Chamonix, ${metres(COMPANY.geo.altitude)}`} title="You climb with one of twelve." />
        <p aria-hidden className="label mb-2 flex shrink-0 items-center gap-1.5 text-(--granite) md:hidden">
          Swipe <ArrowRight className="size-3.5" />
        </p>
      </div>

      <ul
        aria-label="Six of our guides"
        className={cn(
          shell,
          "no-scrollbar mt-12 flex snap-x snap-mandatory scroll-px-6 gap-4 overflow-x-auto sm:scroll-px-10 md:grid md:grid-cols-3 md:gap-x-6 md:gap-y-12 md:overflow-visible lg:mt-16 lg:gap-x-10 lg:gap-y-16",
        )}
      >
        {guides.map((guide, i) => (
          <li key={guide.name} className={cn("w-[78vw] max-w-88 flex-none snap-start md:w-auto md:max-w-none", i % 3 === 1 && "md:translate-y-16 lg:translate-y-24")}>
            <Reveal kind="photo">
              <Frame slot={guide.slot} edge sizes="(min-width: 1664px) 620px, (min-width: 768px) 31vw, 78vw" className="aspect-4/5" />
            </Reveal>
            <h3 className="title mt-4">{guide.name}</h3>
            <p className="label mt-1 text-(--granite)">
              {guide.name === onDuty ? <span className="text-(--signal-ink)">On duty tonight · </span> : null}
              {guide.speciality} · since {guide.since}
            </p>
          </li>
        ))}
      </ul>

      <div className={cn(shell, "mt-16 md:mt-28 lg:mt-36")}>
        <p className="label border-t border-border pt-4 text-(--granite)">And six more on the rota</p>
        <p className="body mt-2 max-w-[80ch]">
          {ROSTER.map((guide, i) => (
            <Fragment key={guide.name}>
              {i > 0 && <span className="mx-2.5 text-(--granite)"> · </span>}
              <span className="whitespace-nowrap">{guide.name}</span>
            </Fragment>
          ))}
        </p>
      </div>
    </section>
  );
}

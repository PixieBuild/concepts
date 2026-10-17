import { COMPANY, OFFICE_FACTS, SLOTS } from "../_lib/content";
import { metres } from "../_lib/format";
import { Frame } from "./frame";
import { Reveal } from "./reveal";
import { SectionHead } from "./section-head";

export function Office() {
  return (
    <section
      aria-labelledby="office-title"
      className="grid bg-(--ink) text-(--snow) md:min-h-[min(100svh,64rem)] md:grid-cols-2 min-[1920px]:grid-cols-[5fr_6fr]"
    >
      <Reveal kind="photo" className="md:h-full">
        <Frame eager slot={SLOTS.office} sizes="(min-width: 1920px) 46vw, (min-width: 768px) 50vw, 100vw" className="aspect-4/5 md:aspect-auto md:h-full" />
      </Reveal>

      <div className="flex flex-col justify-between gap-y-14 px-6 pt-12 pb-16 sm:px-10 md:py-16 lg:px-14 lg:py-24 xl:px-20">
        <div>
          <SectionHead id="office-title" tone="ink" label={`${metres(COMPANY.geo.altitude)} · ${COMPANY.street}`} title="One office, one rope team, since 1994." />
          <p className="lead mt-6 max-w-[36ch] text-(--snow)/80">You are booked with a named guide, and they decide what is safe.</p>
        </div>

        <dl className="grid max-w-160 grid-cols-2 gap-x-8 gap-y-10">
          {OFFICE_FACTS.map((fact) => (
            <div key={fact.label} className="border-t border-(--snow)/15 pt-4">
              <dt className="label text-(--snow)/70">{fact.label}</dt>
              <dd className="mt-3 flex items-baseline gap-2">
                <span className="readout">{fact.value}</span>
                {fact.unit && <span className="label text-(--snow)/70">{fact.unit}</span>}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

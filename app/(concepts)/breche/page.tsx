import { cn } from "@/lib/utils";
import { Frame } from "./_components/frame";
import { Stage } from "./_components/stage";
import { BRAND, CONDITIONS, COMPANY, GUIDES, OBJECTIVES, SLOTS, TERMS } from "./_lib/content";

const shell = "mx-auto w-full max-w-[104rem] px-6 sm:px-10 lg:px-14";
const metres = (value: number) => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

export default function BrechePage() {
  return (
    <div className="relative">
      <div className="absolute inset-x-0 top-0 z-50 flex items-baseline justify-between px-6 py-5 sm:px-10 lg:px-14">
        <p className="w-expanded text-[1.05rem] leading-none font-semibold text-white">{BRAND}</p>
        <a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`} className="data text-[0.95rem] text-white/80 underline-offset-4 hover:underline">
          {COMPANY.phone}
        </a>
      </div>

      <Stage />

      <section className="bg-(--ink) py-16 text-(--snow) sm:py-24 lg:py-32">
        <div className={cn(shell, "grid gap-12 lg:grid-cols-12 lg:gap-14")}>
          <Frame
            slot={SLOTS.office}
            sizes="(min-width: 1024px) 42vw, 100vw"
            className="aspect-4/3 sm:aspect-4/5 lg:col-span-5 lg:aspect-auto lg:min-h-[34rem] lg:self-stretch"
          />
          <div className="lg:col-span-6 lg:col-start-7 lg:self-center">
            <h2 className="w-expanded max-w-[18ch] text-[clamp(1.9rem,3.4vw,3.2rem)] leading-[1.04] font-semibold">
              One office, one rope team, since 1994.
            </h2>
            <p className="mt-6 max-w-[46ch] text-[1.05rem] leading-relaxed text-(--snow)/70">
              You are booked with a named guide, you speak to them before the day, and they decide what is safe — not the office,
              and not the forecast on your phone.
            </p>
          </div>
        </div>

        <dl className={cn(shell, "mt-14 grid grid-cols-2 gap-x-8 gap-y-10 lg:mt-20 lg:grid-cols-4")}>
          {TERMS.map((term) => (
            <div key={term.label} className="border-t border-(--snow)/20 pt-5">
              <dt className="data text-[clamp(2rem,3.2vw,2.9rem)] leading-[0.85] font-semibold">
                {term.value}
                {term.unit && <span className="w-condensed ml-2 align-baseline text-[0.85rem] font-medium text-(--snow)/55">{term.unit}</span>}
              </dt>
              <dd className="mt-3 max-w-[26ch] text-[0.95rem] leading-snug text-(--snow)/55">{term.label}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="objectives" className="border-t border-border py-16 sm:py-24">
        <div className={shell}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-10 gap-y-3">
            <h2 className="w-expanded max-w-[20ch] text-[clamp(1.7rem,3vw,2.8rem)] leading-[1.06] font-semibold">
              What we run, and what it asks of you.
            </h2>
            <p className="w-condensed max-w-[38ch] text-[0.98rem] leading-snug text-(--granite)">
              Grades are the French alpine scale. Ratios are fixed: we never add a third climber to make a day pay.
            </p>
          </div>

          <ul className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 lg:[&>li:nth-child(even)]:mt-20">
            {OBJECTIVES.map((objective) => (
              <li key={objective.name} className="group">
                <Frame
                  slot={objective.slot}
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 100vw"
                  className="aspect-4/3 sm:aspect-4/5"
                />
                <div className="mt-5 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-[1.2rem] leading-tight font-semibold">{objective.name}</h3>
                    <p className="w-condensed mt-1.5 text-[0.92rem] text-(--granite)">
                      {objective.massif} — {objective.discipline.toLowerCase()}
                    </p>
                  </div>
                  <p className="data shrink-0 border border-(--hazard) px-2 py-1 text-[0.8rem] leading-none font-semibold text-(--hazard)">
                    {objective.cotation}
                  </p>
                </div>
                <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-4">
                  <Spec label="Days" value={String(objective.days)} />
                  <Spec label="Summit" value={`${metres(objective.summit)} m`} />
                  <Spec label="Rope" value={objective.ratio} />
                  <Spec label="From" value={`€${metres(objective.from)}`} />
                </dl>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-border bg-(--ink) text-(--snow)">
        <div className="grid lg:grid-cols-12">
          <Frame slot={SLOTS.snowpack} sizes="(min-width: 1024px) 42vw, 100vw" className="aspect-16/10 lg:col-span-5 lg:aspect-auto lg:min-h-[34rem]" />
          <div className="px-6 py-16 sm:px-10 sm:py-20 lg:col-span-6 lg:col-start-7 lg:self-center lg:px-0 lg:py-24">
            <div className="flex items-start gap-6">
              <Hazard level={CONDITIONS.risk.level} />
              <div>
                <p className="w-condensed text-[0.9rem] text-(--snow)/60">
                  Written {CONDITIONS.updatedLabel} by {CONDITIONS.author}
                </p>
                <p className="w-expanded mt-3 max-w-[22ch] text-[clamp(1.5rem,2.6vw,2.4rem)] leading-[1.06] font-semibold">
                  {CONDITIONS.headline}
                </p>
              </div>
            </div>

            <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6">
              {CONDITIONS.readings.map((reading) => (
                <div key={reading.label}>
                  <dt className="w-condensed text-[0.85rem] text-(--snow)/55">{reading.label}</dt>
                  <dd className="data mt-1.5 text-[1.5rem] leading-none font-semibold">
                    {reading.value}
                    {reading.unit && <span className="w-condensed ml-1.5 text-[0.8rem] font-medium text-(--snow)/60">{reading.unit}</span>}
                  </dd>
                </div>
              ))}
            </dl>

            <ol className="mt-10 border-t border-(--snow)/20">
              {CONDITIONS.log.map((entry) => (
                <li key={entry.date} className="grid gap-x-8 gap-y-1 border-b border-(--snow)/20 py-4 sm:grid-cols-[5rem_1fr]">
                  <p className="data text-[0.9rem] text-(--snow)/60">{entry.date}</p>
                  <p className="max-w-[54ch] text-[0.98rem] leading-relaxed text-(--snow)/90">{entry.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="border-t border-border py-16 sm:py-24">
        <div className={shell}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-10 gap-y-3">
            <h2 className="w-expanded max-w-[18ch] text-[clamp(1.7rem,3vw,2.8rem)] leading-[1.06] font-semibold">
              You climb with one of twelve.
            </h2>
            <p className="w-condensed max-w-[36ch] text-[0.98rem] leading-snug text-(--granite)">
              Every guide carries the IFMGA carnet and lives within twenty minutes of the office.
            </p>
          </div>

          <ul className="mt-12 grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 sm:[&>li:nth-child(even)]:mt-16">
            {GUIDES.map((guide) => (
              <li key={guide.name}>
                <Frame slot={guide.slot} sizes="(min-width: 640px) 31vw, 50vw" className="aspect-4/5" />
                <div className="mt-4 flex items-baseline justify-between gap-3">
                  <h3 className="text-[1.05rem] font-semibold">{guide.name}</h3>
                  <p className="data text-[0.82rem] text-(--granite)">{guide.since}</p>
                </div>
                <p className="w-condensed mt-1.5 max-w-[28ch] text-[0.9rem] leading-snug text-(--granite)">{guide.note}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="relative isolate border-t border-border">
        <Frame slot={SLOTS.valley} sizes="100vw" quiet className="aspect-4/3 sm:aspect-16/9 lg:aspect-21/9" />
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,rgba(12,18,23,0.78),rgba(12,18,23,0.12))]" />
        <div className={cn(shell, "absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-6 pb-10 sm:pb-14")}>
          <p className="w-expanded max-w-[20ch] text-[clamp(1.6rem,3.4vw,3rem)] leading-[1.05] font-semibold text-(--snow)">
            Half of this job is knowing when to turn round.
          </p>
          <a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`} className="w-condensed border-b border-(--snow) pb-1 text-[0.98rem] text-(--snow)">
            Talk to a guide
          </a>
        </div>
      </section>

      <footer className="bg-(--ink) py-16 text-(--snow) sm:py-20 lg:py-24">
        <div className={shell}>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-6">
              <p className="w-expanded max-w-[16ch] text-[clamp(1.8rem,3.4vw,3.2rem)] leading-[1.04] font-semibold">
                Tell us the week you have.
              </p>
              <p className="mt-5 max-w-[42ch] text-[1.02rem] leading-relaxed text-(--snow)/70">
                Most of our work is private guiding built around the days people can get away. Ring the office between eight and
                seven and a guide will answer, not an agency.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
                <a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`} className="data text-[clamp(1.3rem,2.2vw,1.9rem)] font-semibold underline-offset-[6px] hover:underline">
                  {COMPANY.phone}
                </a>
                <a href={`mailto:${COMPANY.email}`} className="w-condensed text-[1rem] underline underline-offset-4">
                  {COMPANY.email}
                </a>
              </div>
            </div>

            <address className="w-condensed text-[0.98rem] leading-relaxed text-(--snow)/60 not-italic lg:col-span-3 lg:col-start-8">
              {COMPANY.legal}
              <br />
              {COMPANY.street}
              <br />
              {COMPANY.town}
            </address>

            <p className="w-condensed text-[0.88rem] leading-relaxed text-(--snow)/50 lg:col-span-2 lg:col-start-11">
              Guiding since {COMPANY.founded}
              <br />© 2026
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="w-condensed text-[0.74rem] text-(--granite)">{label}</dt>
      <dd className="data mt-1 text-[1.02rem] font-medium">{value}</dd>
    </div>
  );
}

// The European avalanche scale badge, drawn as the bulletin draws it.
function Hazard({ level }: { level: number }) {
  return (
    <svg viewBox="0 0 64 58" className="w-14 shrink-0 sm:w-16" role="img" aria-label={`Avalanche risk ${level} of 5, low`}>
      <path d="M32 2 62 55H2Z" fill="#f2d024" stroke="#12181d" strokeWidth={3} strokeLinejoin="round" />
      <text x="32" y="46" textAnchor="middle" className="data" fontSize={30} fontWeight={700} fill="#12181d">
        {level}
      </text>
    </svg>
  );
}

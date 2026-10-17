import { SLOTS, type Bulletin } from "../_lib/content";
import { AvalancheBadge } from "./avalanche-badge";
import { Frame } from "./frame";
import { Reveal } from "./reveal";
import { RouteProfile } from "./route-profile";
import { SectionHead } from "./section-head";

const list = new Intl.ListFormat("en-GB", { style: "long", type: "conjunction" });
const issuedDay = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", weekday: "short", day: "numeric", month: "short" });

export function Conditions({ shell, bulletin }: { shell: string; bulletin: Bulletin }) {
  const [latest] = bulletin.log;

  return (
    <section id="conditions" tabIndex={-1} aria-labelledby="conditions-title" className="bg-(--ink) py-20 text-(--snow) sm:py-28 lg:py-32">
      <div className={shell}>
        <div className="flex flex-col gap-y-6 lg:flex-row lg:items-end lg:justify-between lg:gap-x-14">
          <SectionHead
            id="conditions-title"
            tone="ink"
            measure="max-w-[22ch]"
            label={
              <>
                Bulletin ·{" "}
                <time dateTime={bulletin.issued.iso}>
                  {issuedDay.format(new Date(bulletin.issued.iso))} {bulletin.issued.time}
                </time>
              </>
            }
            title={bulletin.headline}
          />
          <p className="note max-w-[30ch] text-(--snow)/70 lg:pb-2 lg:text-right">
            Written at six by {bulletin.author}. Every booking for tomorrow is decided against it.
          </p>
        </div>

        <div className="-mx-6 mt-12 overflow-x-clip sm:mx-0 sm:mt-16 sm:overflow-x-visible lg:mt-20">
          <RouteProfile freezingLevel={bulletin.freezingLevel} snowLine={bulletin.snowLine} />
        </div>

        <dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-10 lg:mt-16 lg:grid-cols-4">
          {bulletin.readings.map((reading) => (
            <div key={reading.label} className="border-t border-(--snow)/15 pt-5">
              <dt className="label text-(--snow)/70">{reading.label}</dt>
              <dd className="mt-3 flex items-baseline gap-2">
                <span className="readout">{reading.value}</span>
                {reading.unit && <span className="label text-(--snow)/70">{reading.unit}</span>}
              </dd>
              <dd className="label mt-2 max-w-[24ch] text-(--snow)/60 max-sm:hidden lg:max-w-none">{reading.note}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-16 grid gap-y-10 lg:mt-24 lg:grid-cols-12 lg:items-end lg:gap-x-14">
          <Reveal kind="photo" className="-mx-6 sm:mx-0 lg:col-span-7">
            <Frame slot={SLOTS.snowpack} sizes="(min-width: 1664px) 940px, (min-width: 1024px) 56vw, 100vw" className="aspect-3/2 lg:aspect-4/3" />
          </Reveal>

          <div className="grid gap-y-8 sm:grid-cols-2 sm:gap-x-10 lg:col-span-5 lg:grid-cols-1">
            <div className="border-t border-(--snow)/15 pt-5 sm:col-span-2 lg:col-span-1">
              <p className="label text-(--snow)/60">
                Last out · <time dateTime={latest.iso}>{latest.date}</time>
              </p>
              <p className="lead mt-3 max-w-[40ch] text-(--snow)/90">{latest.text}</p>
            </div>

            {bulletin.running.length > 0 && (
              <div className="border-t border-(--snow)/15 pt-5">
                <p className="label text-(--snow)/60">Running now</p>
                <p className="body mt-2 text-(--snow)/90">{list.format(bulletin.running)}</p>
              </div>
            )}

            <div className="flex items-start gap-4 border-t border-(--snow)/15 pt-5">
              {bulletin.danger ? (
                <AvalancheBadge danger={bulletin.danger} />
              ) : (
                <svg viewBox="0 0 80 80" aria-hidden className="w-14 shrink-0 sm:w-16">
                  <path d="M40 3 77 40 40 77 3 40Z" fill="none" stroke="currentColor" strokeOpacity={0.45} strokeWidth={2} strokeDasharray="6 5" />
                </svg>
              )}
              <div>
                <p className="label text-(--snow)/60">Avalanche danger</p>
                <p className="body mt-1 font-medium">
                  {bulletin.danger ? `${bulletin.danger.level} · ${bulletin.danger.label}` : "No level until December"}
                </p>
                <p className="note mt-1 text-(--snow)/70">{bulletin.dangerNote}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

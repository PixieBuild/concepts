import { AnchorLink } from "./_components/anchor-link";
import { Conditions } from "./_components/conditions";
import { Enquire } from "./_components/enquire";
import { Guides } from "./_components/guides";
import { Office } from "./_components/office";
import { RouteIndex } from "./_components/route-index";
import { SectionHead } from "./_components/section-head";
import { SiteBar } from "./_components/site-bar";
import { SiteFooter } from "./_components/site-footer";
import { Stage } from "./_components/stage";
import { Valley } from "./_components/valley";
import { BRAND, COMPANY, OBJECTIVES, conditionsFor } from "./_lib/content";
import { grouped, telHref } from "./_lib/format";

/** The bulletin, the season flags and the footer year all follow the date. */
export const revalidate = 3600;

const shell = "mx-auto w-full max-w-[104rem] px-6 sm:px-10 lg:px-14";

const summits = OBJECTIVES.map((objective) => objective.summit);
const parisMonth = (date: Date) => Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", month: "numeric" }).format(date));

export default function BrechePage() {
  const now = new Date();
  const bulletin = conditionsFor(now);

  return (
    <>
      <AnchorLink
        href="#objectives"
        className="action fixed top-3 left-3 z-[60] -translate-y-[200%] bg-(--snow) px-4 py-3 text-(--ink) focus-visible:translate-y-0 focus-visible:outline-offset-2"
      >
        Skip to the objectives
      </AnchorLink>
      <header className="absolute inset-x-0 top-0 z-50 print:static">
        <div className="mx-auto flex w-full max-w-[104rem] items-center justify-between px-6 pt-3 sm:px-10 lg:px-14">
          <AnchorLink id="brand" href="#top" className="wordmark -mx-2 inline-flex min-h-11 items-center px-2 text-white">
            {BRAND}
          </AnchorLink>
          <a href={telHref(COMPANY.phone)} className="data -mx-2 inline-flex min-h-11 items-center px-2 text-white/85 underline-offset-4 hover:text-white hover:underline">
            {COMPANY.phone}
          </a>
        </div>
      </header>
      <SiteBar />

      <main>
        <Stage snowLine={bulletin.snowLine} />
        <div id="after-hero" aria-hidden />
        <Office />

        <section id="objectives" tabIndex={-1} aria-labelledby="objectives-title" className="py-20 sm:py-28 lg:py-36">
          <div className={shell}>
            <RouteIndex
              month={parisMonth(now)}
              head={
                <SectionHead
                  id="objectives-title"
                  label={`${grouped(Math.min(...summits))}–${grouped(Math.max(...summits))} m · six objectives`}
                  title="What we run, and what it asks of you."
                />
              }
            />
          </div>
        </section>

        <Conditions shell={shell} bulletin={bulletin} />
        <Guides shell={shell} onDuty={bulletin.author} />
        <Valley />
        <Enquire shell={shell} onDuty={bulletin.author} />
      </main>

      <SiteFooter shell={shell} year={Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", year: "numeric" }).format(now))} />
    </>
  );
}

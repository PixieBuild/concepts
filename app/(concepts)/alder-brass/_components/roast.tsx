import { Pinned, Stamp } from "./fx";
import { SheetTitle, Shell } from "./shell";
import { LOTS } from "../_lib/content";

export function Roast() {
  return (
    <section id="roast" className="scroll-mt-14 bg-(--green) py-16 text-(--green-foreground) sm:py-20 lg:py-24">
      <Shell>
        <Pinned className="mx-auto max-w-[58rem]">
          <Stamp rotate={6} className="stamp-green absolute -top-4 -right-1 sm:-right-4">Out Friday</Stamp>
          <div className="border border-(--green-foreground)/45 px-5 pt-9 pb-7 sm:px-9 sm:pt-11 sm:pb-8">
            <SheetTitle
              tone="green"
              title="Roasted this week"
              line="Twelve kilos at a time, by ear. The farm printed on every bag."
            />
            <ol className="mt-8 border-t border-(--green-foreground)/45">
              {LOTS.map((lot) => (
                <li
                  key={lot.no}
                  className="grid grid-cols-[3.75rem_1fr] gap-x-4 gap-y-1 border-b border-(--green-foreground)/25 py-3.5 sm:grid-cols-[4.5rem_1fr_auto] sm:items-baseline sm:gap-x-5"
                >
                  <span className="poster text-[1.1rem] tracking-[0.06em] text-(--brass-soft)">No. {lot.no}</span>
                  <span className="flex flex-wrap items-baseline gap-x-3">
                    <span className="poster text-[1.7rem] leading-none font-medium tracking-[0.03em] uppercase sm:text-[2.1rem]">
                      {lot.origin}
                    </span>
                    <span className="label text-(--green-foreground)/65">
                      {lot.process} · {lot.altitude}
                    </span>
                  </span>
                  <span className="col-start-2 font-heading text-[1rem] italic text-(--brass-soft) sm:col-start-auto sm:text-right sm:text-[1.1rem]">
                    {lot.cup}
                  </span>
                </li>
              ))}
            </ol>
            <div className="label mt-5 flex flex-col gap-1 text-(--green-foreground)/65 sm:flex-row sm:justify-between">
              <span>Bags on the shelf by the register</span>
              <span>Subscription every second Friday</span>
            </div>
          </div>
        </Pinned>
      </Shell>
    </section>
  );
}

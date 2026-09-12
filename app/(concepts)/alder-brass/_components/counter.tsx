import { CupLanding } from "./cup-flight";
import { HandNote, Stamp } from "./fx";
import { HouseCupLabel } from "./house-cup-label";
import { Reveal } from "./motion";
import { Ornament, SheetTitle, Shell } from "./shell";
import { HOUSE_CUP, MENU, NOTES } from "../_lib/content";

export function Counter() {
  return (
    <Shell>
      <section id="counter" className="scroll-mt-14 lg:grid lg:grid-cols-[15rem_1fr] 2xl:grid-cols-[18rem_1fr] lg:items-start lg:gap-x-10">
        <div className="grid grid-cols-[7rem_1fr] items-center gap-5 sm:grid-cols-[10rem_1fr] sm:gap-7 lg:block">
          <CupLanding className="size-32 sm:size-44 lg:size-52 2xl:size-60" />
          <Reveal className="lg:mt-7">
            <HouseCupLabel>{HOUSE_CUP.number} · The house cup</HouseCupLabel>
            <h3 className="mt-2 font-heading text-[1.45rem] leading-none sm:text-[1.8rem]">
              {HOUSE_CUP.name}
            </h3>
            <p className="mt-3 max-w-[30ch] text-[0.9rem] leading-relaxed text-muted-foreground">
              {HOUSE_CUP.body}
            </p>
          </Reveal>
        </div>

        <Reveal className="relative mt-12 lg:mt-0">
          <Stamp className="absolute -top-4 right-4 sm:right-10">{HOUSE_CUP.number} · house cup</Stamp>
          <div className="sheet">
            <div className="sheet-in px-5 pt-9 pb-7 sm:px-8 sm:pt-10 sm:pb-8 lg:px-10">
              <span aria-hidden className="absolute top-3 left-3 text-(--brass) text-[0.7rem]">✦</span>
              <span aria-hidden className="absolute top-3 right-3 text-(--brass) text-[0.7rem]">✦</span>
              <SheetTitle
                title="The counter"
                line="Everything to order. Single origins on the chalkboard; ask what came off the roaster this week."
              />
              <div className="mt-8 grid gap-x-10 gap-y-9 md:grid-cols-2">
                {MENU.map((group) => (
                  <div key={group.label}>
                    <div className="flex items-baseline justify-between gap-4 border-b border-foreground pb-1.5">
                      <h4 className="poster text-[1.35rem] leading-none font-medium tracking-[0.1em] uppercase">
                        {group.label}
                      </h4>
                      {group.note && (
                        <span className="text-right font-heading text-[0.8rem] italic text-muted-foreground">
                          {group.note}
                        </span>
                      )}
                    </div>
                    <ul>
                      {group.items.map((item) => (
                        <li key={item.name} className="menu-row border-b border-dotted border-input py-2.5">
                          <span className="flex items-baseline gap-3">
                            <span className="font-heading text-[1.05rem] leading-tight">{item.name}</span>
                            <span aria-hidden className="leader" />
                            <span className="price text-[0.85rem] tabular-nums">{item.price.replace("$", "")}</span>
                          </span>
                          {item.desc && (
                            <span className="mt-0.5 block text-[0.8rem] text-muted-foreground">{item.desc}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="mt-7 flex flex-wrap items-end justify-between gap-4">
                <HandNote className="-rotate-1 text-[1.35rem] text-(--green) sm:text-[1.5rem]">{NOTES.card}</HandNote>
                <Ornament />
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </Shell>
  );
}

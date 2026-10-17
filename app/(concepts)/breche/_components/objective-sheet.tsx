"use client";

import { XIcon } from "lucide-react";

import { SheetClose, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { ROUTE, SHEETS, type Moment, type Objective } from "../_lib/content";
import { metres, price } from "../_lib/format";
import { Frame } from "./frame";
import { Relief } from "./relief";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const CLIMB: Moment[] = ROUTE.map((w) => ({ at: w.at, text: `${w.place}, ${metres(w.altitude)}. ${w.note}` }));

function nextOpening(objective: Objective, month: number) {
  for (let step = 1; step <= 12; step++) {
    const m = ((month - 1 + step) % 12) + 1;
    if (objective.months.includes(m)) return MONTHS[m - 1];
  }
  return null;
}

export function ObjectiveSheet({
  objective,
  month,
  onAsk,
  onFly,
}: {
  objective: Objective;
  month: number;
  onAsk: () => void;
  onFly: () => void;
}) {
  const id = objective.slot.id;
  const sheet = SHEETS[id];
  const days = id === "gouter" ? CLIMB : sheet.days;
  const running = objective.months.includes(month);
  const reach = objective.descent ? { label: "Descent", value: metres(objective.descent) } : { label: "Ascent", value: metres(objective.ascent) };

  return (
    <div className="flex h-full flex-col">
      <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="relative">
          <Frame slot={objective.slot} sizes="(min-width: 640px) 44rem, 100vw" className="aspect-16/10" />
          <SheetClose
            className="absolute top-0 right-0 grid size-12 cursor-pointer place-items-center bg-(--snow) text-(--ink) transition-colors hover:bg-(--ink) hover:text-(--snow)"
            aria-label="Close the route sheet"
          >
            <XIcon className="size-5" aria-hidden />
          </SheetClose>
        </div>

        <div className="px-6 pt-8 pb-12 sm:px-10">
          <p className="data flex items-center gap-3 text-(--granite)">
            <span aria-hidden className="tick" />
            {objective.massif} · {objective.discipline.toLowerCase()} · graded {objective.cotation}
          </p>
          <SheetTitle className="mt-4 text-(--ink)">
            <span className="display-2 block">{objective.name}</span>
          </SheetTitle>
          <SheetDescription className="mt-5 max-w-[46ch] text-(--ink)/85">
            <span className="lead block">{objective.brief}</span>
          </SheetDescription>

          <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-border pt-6 sm:grid-cols-4">
            {[
              { label: objective.days === 1 ? "Day" : "Days", value: String(objective.days) },
              { label: objective.summitLabel, value: metres(objective.summit) },
              reach,
              { label: "Rope", value: `${objective.party} to 1` },
            ].map((spec) => (
              <div key={spec.label} className="flex flex-col-reverse gap-1.5">
                <dt className="label text-(--granite)">{spec.label}</dt>
                <dd className="title tabular-nums">{spec.value}</dd>
              </div>
            ))}
          </dl>

          <h3 className="title mt-12">{objective.days === 1 ? "The day" : "Day by day"}</h3>
          <ol className="mt-4 border-t border-border">
            {days.map((moment) => (
              <li key={moment.at + moment.text} className="grid gap-x-6 gap-y-1 border-b border-border py-4 sm:grid-cols-[7.5rem_1fr]">
                <p className="data text-(--granite)">{moment.at}</p>
                <p className="body">{moment.text}</p>
              </li>
            ))}
          </ol>

          <div className="mt-12 grid gap-10 sm:grid-cols-[1fr_11rem]">
            <div>
              <h3 className="title">What it asks of you</h3>
              <p className="body mt-3 text-(--ink)/85">{objective.asks}</p>

              <h3 className="title mt-10">Season</h3>
              <p className="body mt-3 text-(--ink)/85">
                {objective.season}.{" "}
                {running ? "Running now; dates are confirmed against the evening bulletin." : `Next running from ${nextOpening(objective, month)}.`}
              </p>
            </div>
            <figure className="w-40 sm:w-full">
              <Relief active={id} compact sizes="11rem" className="after:absolute after:inset-0 after:ring-1 after:ring-black/8 after:ring-inset" />
              <figcaption className="label mt-2 text-(--granite)">The line on the massif</figcaption>
            </figure>
          </div>

          <div className="mt-12 border-t border-border pt-6">
            <h3 className="title">Price</h3>
            <p className="mt-3 flex flex-wrap items-baseline gap-x-3">
              <span className="readout">{price(objective.price)}</span>
              <span className="note text-(--granite)">{objective.basis}</span>
            </p>
            <ul className="body mt-6 space-y-1.5">
              {sheet.included.map((item) => (
                <li key={item} className="flex gap-3">
                  <span aria-hidden className="mt-[0.8em] h-px w-3 flex-none bg-(--ink)/50" />
                  {item}
                </li>
              ))}
              <li className="flex gap-3 text-(--granite)">
                <span aria-hidden className="mt-[0.8em] h-px w-3 flex-none bg-(--granite)/50" />
                {objective.extras}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-border bg-(--snow) px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-10">
        <button
          type="button"
          onClick={onAsk}
          className="action min-h-12 cursor-pointer bg-(--signal) px-6 text-white transition-colors hover:bg-(--ink)"
        >
          Ask about this
        </button>
        {id === "gouter" && (
          <button type="button" onClick={onFly} className="action min-h-11 cursor-pointer border-b border-(--ink)/40 transition-colors hover:border-(--ink)">
            Fly it again
          </button>
        )}
      </div>
    </div>
  );
}

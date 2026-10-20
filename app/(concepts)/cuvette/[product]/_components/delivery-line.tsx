"use client";

import { useEffect, useState } from "react";

import { POLICY } from "../../_lib/content";
import { cutoffIn, eta, formatCountdown, formatDispatch, formatWindow } from "../../_lib/delivery";
import { priceShort } from "../../_lib/format";

type Line = { dispatch: string; arrives: string };

function compute(now: Date): Line {
  const left = cutoffIn(now);
  const slot = eta("PT", "standard", now);
  return {
    dispatch: left === null ? `Leaves Porto ${formatDispatch(slot.dispatch, now)}` : `Order within ${formatCountdown(left)}, leaves Porto today`,
    arrives: `${formatWindow(slot)} in Portugal`,
  };
}

/** The server renders the static promise; dates and the countdown are filled in after mount. */
export function DeliveryLine({ price }: { price: number }) {
  const [line, setLine] = useState<Line | null>(null);

  useEffect(() => {
    const tick = () => setLine(compute(new Date()));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  const free = price >= POLICY.freeOver;
  const rows = [
    { label: "Dispatch", value: line?.dispatch ?? "Ships from Porto in 1 working day" },
    { label: "Delivery", value: `${line?.arrives ?? "1–2 working days in Portugal"} · ${free ? "free" : `free over ${priceShort(POLICY.freeOver)}`}` },
    { label: "Extras", value: `Two samples with every order · ${POLICY.returnsDays}-day returns, opened or not` },
  ];

  return (
    <dl className="divide-y divide-border border-y border-border text-[0.875rem]" aria-live="off">
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-[5.5rem_1fr] gap-3 py-2.5">
          <dt className="label pt-0.5 text-muted-foreground">{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

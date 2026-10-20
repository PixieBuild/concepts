"use client";

import { MinusIcon, PlusIcon } from "lucide-react";

import { MAX_QTY } from "../../_lib/cart";

type Props = { value: number; name: string; onChange: (qty: number) => void };

// Drawn 36px tall to keep rows calm; the ::after stretches each button's hit area to 44px.
const button =
  "relative grid h-9 w-11 cursor-pointer place-items-center transition-colors after:absolute after:inset-x-0 after:-inset-y-1 hover:bg-(--paper-2) disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent";

export function QtyStepper({ value, name, onChange }: Props) {
  return (
    <div role="group" aria-label={`Quantity of ${name}`} className="inline-flex items-center border border-(--paper-line)">
      <button type="button" className={button} disabled={value <= 1} onClick={() => onChange(value - 1)} aria-label={`One fewer ${name}`}>
        <MinusIcon className="size-3.5" aria-hidden />
      </button>
      <output aria-live="polite" className="w-5 text-center text-sm tabular-nums">
        {value}
      </output>
      <button type="button" className={button} disabled={value >= MAX_QTY} onClick={() => onChange(value + 1)} aria-label={`One more ${name}`}>
        <PlusIcon className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}

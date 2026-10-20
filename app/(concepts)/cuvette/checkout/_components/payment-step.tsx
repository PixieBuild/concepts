"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { Totals } from "../../_lib/cart";
import { price } from "../../_lib/format";

export function PaymentStep({ totals, onPlace }: { totals: Totals; onPlace: () => void }) {
  const [placing, setPlacing] = useState(false);
  return (
    <div className="space-y-6">
      <div className="border border-foreground p-5">
        <p className="label">Demo payment</p>
        <p className="mt-2 text-[0.95rem] leading-relaxed">
          This is a concept shop. No card details are collected and nothing is charged.
        </p>
      </div>
      <dl className="space-y-1.5 text-[0.95rem]">
        <Row label="Subtotal" value={price(totals.subtotal)} />
        {totals.discount > 0 && <Row label="Promo" value={`−${price(totals.discount)}`} />}
        <Row label="Delivery" value={totals.shipping === 0 ? "Free" : price(totals.shipping)} />
        <div className="flex items-baseline justify-between border-t border-border pt-3">
          <dt className="title">Total</dt>
          <dd className="title">{price(totals.total)}</dd>
        </div>
      </dl>
      <Button
        type="button"
        disabled={placing}
        onClick={() => {
          setPlacing(true);
          onPlace();
        }}
        className="h-12 w-full text-[0.95rem] font-normal"
      >
        {placing ? "Placing demo order…" : `Place demo order — ${price(totals.total)}`}
      </Button>
      <p className="text-sm text-muted-foreground">Placing it empties your bag and shows a confirmation. Nothing ships.</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

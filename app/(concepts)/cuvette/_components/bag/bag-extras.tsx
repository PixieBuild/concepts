"use client";

import { ChevronDownIcon } from "lucide-react";
import { useId, useState, type FormEvent, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { applyPromo, NOTE_MAX, promoDiscount, setNote, setPromo, type Bag } from "../../_lib/cart";
import { POLICY } from "../../_lib/content";
import { price } from "../../_lib/format";
import { useCatalog } from "../catalog-provider";
import { SamplePicker, sampleSummary } from "./sample-picker";

export function BagExtras({ bag }: { bag: Bag }) {
  const catalog = useCatalog();
  const off = promoDiscount(bag, catalog);
  return (
    <div className="border-b border-border">
      <ExtraRow label="Free samples" value={sampleSummary(bag, catalog)}>
        <SamplePicker bag={bag} />
      </ExtraRow>
      <ExtraRow label="Promo code" value={bag.promo ? `${bag.promo}${off > 0 ? ` −${price(off)}` : ""}` : null}>
        <PromoField bag={bag} off={off} />
      </ExtraRow>
      <ExtraRow label="Gift note" value={bag.note ? "Added" : null}>
        <GiftNote note={bag.note} />
      </ExtraRow>
    </div>
  );
}

function ExtraRow({ label, value, children }: { label: string; value: string | null; children: ReactNode }) {
  return (
    <Collapsible className="border-t border-border">
      <CollapsibleTrigger className="group flex min-h-12 w-full cursor-pointer items-center gap-4 text-left text-sm">
        <span className="shrink-0">{label}</span>
        <span className="min-w-0 flex-1 truncate text-right text-muted-foreground">{value}</span>
        <ChevronDownIcon className="size-4 shrink-0 transition-transform duration-200 group-data-panel-open:rotate-180 motion-reduce:transition-none" aria-hidden />
      </CollapsibleTrigger>
      <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-ending-style:h-0 data-starting-style:h-0 motion-reduce:transition-none">
        <div className="pb-5">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function PromoField({ bag, off }: { bag: Bag; off: number }) {
  const id = useId();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (bag.promo) {
    return (
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {off > 0 ? `${POLICY.promo.off * 100}% off serums.` : "Serums only. The set is already priced as a saving."}
        </p>
        <button
          type="button"
          onClick={() => setPromo(null)}
          className="link -mr-2 inline-flex min-h-11 shrink-0 cursor-pointer items-center px-2 text-sm"
        >
          Remove<span className="sr-only"> code {bag.promo}</span>
        </button>
      </div>
    );
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const result = applyPromo(code);
    if (result.ok) {
      setCode("");
      setError(null);
    } else setError(result.error);
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="flex gap-2">
        <Input
          id={`${id}-code`}
          aria-label="Promo code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError(null);
          }}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className="h-11 uppercase placeholder:normal-case"
        />
        <Button type="submit" variant="outline" className="h-11 border-foreground bg-transparent px-5 font-normal">
          Apply
        </Button>
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}

function GiftNote({ note }: { note: string }) {
  const id = useId();
  return (
    <div>
      <Textarea
        id={id}
        aria-label="Gift note"
        value={note}
        maxLength={NOTE_MAX}
        onChange={(e) => setNote(e.target.value)}
        aria-describedby={`${id}-hint`}
        className="min-h-20 text-base md:text-sm"
      />
      <p id={`${id}-hint`} className="mt-2 flex justify-between gap-4 text-sm text-muted-foreground">
        <span>Printed on a card. Prices left off.</span>
        <span className="label shrink-0">
          {note.length} / {NOTE_MAX}
        </span>
      </p>
    </div>
  );
}

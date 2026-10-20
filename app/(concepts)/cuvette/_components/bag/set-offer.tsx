"use client";

import type { MouseEvent } from "react";

import { Button } from "@/components/ui/button";
import { setSaving, switchToSet, type Upsell } from "../../_lib/cart";
import type { SetCard } from "../../_lib/client-catalog";
import { priceShort } from "../../_lib/format";
import { useCatalog } from "../catalog-provider";

function takeSet(event: MouseEvent<HTMLButtonElement>, set: SetCard) {
  const body = event.currentTarget.closest("[data-bag-body]");
  switchToSet(set);
  const title = body?.closest("[data-slot=sheet-content]")?.querySelector<HTMLElement>("[data-slot=sheet-title]");
  requestAnimationFrame(() => {
    body?.scrollTo({ top: 0 });
    title?.focus({ preventScroll: true });
  });
}

export function SetOffer({ upsell }: { upsell: NonNullable<Upsell> }) {
  const catalog = useCatalog();
  const name = upsell.set.title.replace(/^The /, "the ");
  const save = priceShort(setSaving(upsell.set));
  const adding = upsell.kind === "complete" ? upsell.add.map((slug) => catalog.get(slug)?.title ?? slug).join(" + ") : "";
  return (
    <div className="flex items-center gap-4 bg-(--paper-2) py-2 pr-2 pl-4">
      <p className="flex-1 text-sm leading-snug">
        {upsell.kind === "switch" ? (
          <>
            These make {name}. <strong className="font-medium">Save {save}</strong>
          </>
        ) : (
          <>
            Add {adding} for {name}. <strong className="font-medium">Save {save}</strong>
          </>
        )}
      </p>
      <Button
        type="button"
        variant="outline"
        onClick={(event) => takeSet(event, upsell.set)}
        className="h-11 shrink-0 border-foreground bg-transparent px-4 font-normal hover:bg-background"
      >
        {upsell.kind === "switch" ? "Switch" : `Add · ${priceShort(upsell.extra)}`}
      </Button>
    </div>
  );
}

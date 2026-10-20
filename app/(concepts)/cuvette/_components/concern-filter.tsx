"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export type ConcernOption = { id: string; label: string };

type Props = { concerns: ConcernOption[]; value: string | null; onChange: (id: string | null) => void; className?: string };

/** One concern at a time; pressing it again clears the filter. The concerns come from the catalogue. */
export function ConcernFilter({ concerns, value, onChange, className }: Props) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-5 gap-y-3", className)}>
      <p id="concern-label" className="label text-muted-foreground">
        Start from your skin
      </p>
      <ToggleGroup
        aria-labelledby="concern-label"
        value={value ? [value] : []}
        onValueChange={(next) => onChange((next[0] as string | undefined) ?? null)}
        spacing={2}
        className="flex-wrap"
      >
        {concerns.map((concern) => (
          <ToggleGroupItem
            key={concern.id}
            value={concern.id}
            className="h-11 rounded-(--radius) border border-border px-4 text-[0.9rem] font-normal text-foreground/85 hover:border-foreground hover:bg-transparent aria-pressed:border-foreground aria-pressed:bg-foreground aria-pressed:text-background"
          >
            {concern.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

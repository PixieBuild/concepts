"use client";

import type { ReactNode } from "react";
import { Radio } from "@base-ui/react/radio";

import { RadioGroup } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

type Option<T extends string> = { value: T; label: ReactNode; aside?: ReactNode };

type Props<T extends string> = {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  variant?: "rows" | "chips";
  className?: string;
};

/** One answer at a time, as ruled rows or as a wrap of chips. */
export function Choices<T extends string>({ label, value, options, onChange, variant = "chips", className }: Props<T>) {
  return (
    <RadioGroup
      aria-label={label}
      value={value}
      onValueChange={(next) => onChange(next as T)}
      className={cn(variant === "rows" ? "gap-0 border-t border-border" : "flex w-auto flex-wrap gap-2", className)}
    >
      {options.map((option) =>
        variant === "rows" ? (
          <Radio.Root
            key={option.value}
            value={option.value}
            className="group grid min-h-13 cursor-pointer grid-cols-[1fr_auto_1.25rem] items-center gap-4 border-b border-border text-left -outline-offset-2"
          >
            <span className="text-[1.0625rem] text-foreground/70 transition-colors duration-300 group-hover:text-foreground group-data-checked:text-foreground">
              {option.label}
            </span>
            <span className="label text-muted-foreground">{option.aside}</span>
            <span aria-hidden className="grid size-4 place-items-center rounded-full border border-input transition-colors group-data-checked:border-foreground">
              <span className="size-2 rounded-full bg-foreground opacity-0 transition-opacity group-data-checked:opacity-100" />
            </span>
          </Radio.Root>
        ) : (
          <Radio.Root
            key={option.value}
            value={option.value}
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-(--radius) border border-border px-4 text-[0.9rem] text-foreground/80 transition-colors duration-300 hover:border-foreground data-checked:border-foreground data-checked:bg-foreground data-checked:text-background"
          >
            {option.label}
          </Radio.Root>
        ),
      )}
    </RadioGroup>
  );
}

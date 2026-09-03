"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatDate } from "@/app/(concepts)/casa-lume/_lib/booking";

export function DateField({
  value,
  onChange,
  label,
  placeholder = "Select",
  disabledBefore,
  invalid,
  className,
  tone = "light",
  icon,
}: {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  label: string;
  placeholder?: string;
  disabledBefore?: Date;
  invalid?: boolean;
  className?: string;
  tone?: "light" | "dark" | "bar";
  icon?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const floor = disabledBefore ?? new Date(new Date().setHours(0, 0, 0, 0));
  const dark = tone === "dark";
  const underline = tone === "light";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "group flex w-full items-center gap-4 bg-transparent text-left transition-colors focus-visible:outline-none",
          dark && "text-background hover:bg-background/5",
          underline &&
            "border-b border-border/70 px-0 pb-2.5 hover:border-primary/60 focus-visible:border-primary",
          tone === "bar" && "hover:bg-foreground/[0.03]",
          underline && invalid && "border-destructive",
          tone === "bar" && invalid && "text-destructive",
          className,
        )}
      >
        {icon && (
          <span
            className={cn("shrink-0", dark ? "text-background/55" : "text-muted-foreground")}
            aria-hidden
          >
            {icon}
          </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col gap-2">
          <span
            className={cn(
              "eyebrow",
              dark ? "text-background/55" : "text-muted-foreground/90",
            )}
          >
            {label}
          </span>
          <span
            className={cn(
              "truncate",
              tone === "bar"
                ? "font-heading text-2xl leading-none font-normal"
                : "text-[1.0625rem] leading-tight font-medium",
              !value &&
                (dark
                  ? "font-normal text-background/60"
                  : "font-normal text-muted-foreground"),
            )}
          >
            {value ? formatDate(value) : placeholder}
          </span>
        </span>
        <ChevronDown
          strokeWidth={1.25}
          className={cn(
            "size-4 shrink-0 transition-transform group-data-popup-open:rotate-180",
            dark ? "text-background/45" : "text-muted-foreground",
          )}
        />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={10}
        className="date-popover w-auto rounded-none p-2"
        initialFocus={(openType) => (openType === "keyboard" ? undefined : false)}
      >
        <Calendar
          mode="single"
          selected={value}
          defaultMonth={value ?? floor}
          disabled={{ before: floor }}
          onSelect={(date) => {
            onChange(date);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

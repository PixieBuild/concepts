"use client";

import { Minus, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

export function GuestField({
  value,
  onChange,
  label = "Guests",
  min = 1,
  max = 6,
  className,
  tone = "light",
  icon,
}: {
  value: number;
  onChange: (next: number) => void;
  label?: string;
  min?: number;
  max?: number;
  className?: string;
  tone?: "light" | "dark" | "bar";
  icon?: React.ReactNode;
}) {
  const dark = tone === "dark";

  return (
    <div
      className={cn(
        "flex items-center gap-4",
        dark && "text-background",
        tone === "light" && "border-b border-border/70 pb-2.5",
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
      <div className="flex min-w-0 flex-1 flex-col gap-2">
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
            tone === "bar"
              ? "font-heading text-2xl leading-none font-normal"
              : "text-[1.0625rem] leading-tight font-medium",
          )}
        >
          {value} {value === 1 ? "guest" : "guests"}
        </span>
      </div>
      <span
        className={cn(
          "flex shrink-0 items-stretch",
          dark ? "border border-background/30" : "border border-border",
        )}
      >
        <StepButton
          dark={dark}
          label="Remove a guest"
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          <Minus className="size-3.5" />
        </StepButton>
        <StepButton
          dark={dark}
          label="Add a guest"
          disabled={value >= max}
          className={cn(
            "border-l",
            dark ? "border-background/30" : "border-border",
          )}
          onClick={() => onChange(Math.min(max, value + 1))}
        >
          <Plus className="size-3.5" />
        </StepButton>
      </span>
    </div>
  );
}

function StepButton({
  children,
  label,
  disabled,
  dark,
  className,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  disabled?: boolean;
  dark?: boolean;
  className?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid size-8 place-items-center transition-colors disabled:pointer-events-none disabled:opacity-25 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
        dark
          ? "text-background hover:bg-background/12"
          : "text-foreground hover:bg-foreground/6",
        className,
      )}
    >
      {children}
    </button>
  );
}

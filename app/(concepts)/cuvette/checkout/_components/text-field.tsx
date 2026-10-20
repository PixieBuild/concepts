"use client";

import { useId, type ComponentProps } from "react";

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = ComponentProps<"input"> & {
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
};

export const FIELD = "h-12 rounded-[2px] border-(--paper-field) bg-(--paper) px-3.5 text-base text-foreground md:text-[0.95rem] focus-visible:border-foreground focus-visible:ring-0";

export function TextField({ label, error, hint, optional, className, ...input }: Props) {
  const id = useId();
  const described = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <Field data-invalid={!!error} className={cn("gap-1.5", className)}>
      <FieldLabel htmlFor={id} className="text-sm font-normal group-data-[invalid=true]/field:text-foreground">
        {label}
        {optional && <span className="text-muted-foreground">(optional)</span>}
      </FieldLabel>
      <Input id={id} aria-invalid={!!error} aria-describedby={described} className={FIELD} {...input} />
      {hint && (
        <FieldDescription id={`${id}-hint`} className="text-[0.8125rem]">
          {hint}
        </FieldDescription>
      )}
      {error && (
        <FieldError id={`${id}-error`} className="text-[0.8125rem]">
          {error}
        </FieldError>
      )}
    </Field>
  );
}

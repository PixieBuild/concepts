"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type StepStatus = "active" | "done" | "upcoming";

type Props = {
  index: number;
  title: string;
  status: StepStatus;
  summary?: ReactNode;
  onEdit?: () => void;
  children?: ReactNode;
};

/** A stepper row: the active step shows its form, done steps fold to a summary with Edit, later steps show only their name. */
export function Step({ index, title, status, summary, onEdit, children }: Props) {
  const id = `step-${index}`;
  return (
    <section aria-labelledby={id} className="border-t border-border py-7 first:border-t-0 first:pt-0">
      <div className="flex min-h-11 items-center justify-between gap-4">
        <h2 id={id} tabIndex={-1} className={cn("title flex items-baseline gap-3 outline-none", status === "upcoming" && "text-muted-foreground")}>
          <span className="label text-muted-foreground">{String(index).padStart(2, "0")}</span>
          {title}
          {status === "done" && <span className="sr-only">, done</span>}
        </h2>
        {status === "done" && onEdit && (
          <button type="button" onClick={onEdit} className="link inline-flex min-h-11 cursor-pointer items-center text-sm">
            Edit<span className="sr-only"> {title.toLowerCase()}</span>
          </button>
        )}
      </div>
      {status === "done" && summary && <div className="mt-2 text-[0.95rem] leading-relaxed text-muted-foreground">{summary}</div>}
      {status === "active" && <div className="mt-5">{children}</div>}
    </section>
  );
}

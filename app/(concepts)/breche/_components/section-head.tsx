import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

/** The instrument line every section opens with: a signal tick, a place or altitude, then the heading. */
export function SectionHead({
  id,
  label,
  title,
  className,
  measure = "max-w-[20ch]",
  tone = "light",
}: {
  id: string;
  label: ReactNode;
  title: string;
  className?: string;
  measure?: string;
  tone?: "light" | "ink";
}) {
  return (
    <div className={className}>
      <p className={cn("data flex items-start gap-3", tone === "ink" ? "text-(--snow)/70" : "text-(--granite)")}>
        <span aria-hidden className="tick mt-[calc(0.65em-1px)]" />
        <span>{label}</span>
      </p>
      <h2 id={id} className={cn("display-2 mt-5", measure)}>
        <Reveal kind="rise">{title}</Reveal>
      </h2>
    </div>
  );
}

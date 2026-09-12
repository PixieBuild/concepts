import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <h2
      className={cn(
        "font-heading text-[clamp(32px,4.2vw,54px)] font-extrabold leading-[1.04] tracking-[-0.02em]",
        className,
      )}
    >
      {children}
    </h2>
  );
}

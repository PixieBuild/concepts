import type { ReactNode } from "react";

export function Kicker({ children }: { children: ReactNode }) {
  return (
    <span className="mb-4 inline-block text-[13px] font-bold uppercase tracking-[0.09em] text-(--brand-700)">
      {children}
    </span>
  );
}

"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Kind = "photo" | "rise" | "wipe";

/** Marks its element shown once it scrolls into view; theme.css owns the motion for each kind. */
export function Reveal({
  kind,
  as,
  className,
  children,
}: {
  kind: Kind;
  as?: "div" | "span";
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const Tag = (as ?? (kind === "rise" ? "span" : "div")) as "div";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.setAttribute("data-shown", "");
        observer.disconnect();
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref} data-reveal={kind} className={className}>
      {kind === "rise" ? <span>{children}</span> : children}
    </Tag>
  );
}

"use client";

import { useState } from "react";
import { useMotionValueEvent, useScroll } from "motion/react";

import { cn } from "@/lib/utils";
import { ANNOUNCEMENT, BRAND } from "../_lib/content";

// Transparent over the rendered set, solid once the page reaches the range below it.
export function Header() {
  const { scrollY } = useScroll();
  const [solid, setSolid] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setSolid(y > window.innerHeight * 3.4));

  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <p className="bg-foreground py-2 text-center font-mono text-[0.68rem] tracking-[0.08em] text-background uppercase">
        <span className="sm:hidden">{ANNOUNCEMENT.split(" · ")[0]}</span>
        <span className="hidden sm:inline">{ANNOUNCEMENT}</span>
      </p>
      <div
        className={cn(
          "grid grid-cols-[1fr_auto_1fr] items-center border-b px-6 py-4 transition-colors duration-500 sm:px-10",
          solid ? "border-border bg-background" : "border-transparent bg-transparent",
        )}
      >
        <div className="text-[0.9rem]">
          <nav aria-label="Shop" className="hidden gap-7 lg:flex">
            <a href="#range">Shop</a>
            <a href="#">The actives</a>
            <a href="#">Routine finder</a>
          </nav>
          <a href="#" className="lg:hidden">
            Menu
          </a>
        </div>
        <a href="#" className="font-heading text-[2.1rem] leading-none">
          {BRAND}
        </a>
        <div className="flex justify-end gap-6 text-[0.9rem]">
          <a href="#" className="hidden sm:inline">Search</a>
          <a href="#" className="hidden sm:inline">Account</a>
          <a href="#">Bag (0)</a>
        </div>
      </div>
    </header>
  );
}

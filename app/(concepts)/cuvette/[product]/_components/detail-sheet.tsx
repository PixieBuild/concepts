"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

let current: string | null = null;
const listeners = new Set<() => void>();

function setCurrent(id: string | null) {
  current = id;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function openSheet(id: string) {
  setCurrent(id);
}

type Props = {
  /** Also the URL hash that opens it, e.g. `/cuvette/vitamin-c#how-to`. */
  id: string;
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
};

/** A right-hand paper sheet. Any number of `SheetButton`s with the same id open it. */
export function DetailSheet({ id, eyebrow, title, description, children }: Props) {
  const open = useSyncExternalStore(subscribe, () => current === id, () => false);

  useEffect(() => {
    const fromHash = () => {
      if (window.location.hash === `#${id}`) setCurrent(id);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [id]);

  function onOpenChange(next: boolean) {
    if (next) return setCurrent(id);
    if (current === id) setCurrent(null);
    if (window.location.hash === `#${id}`) window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" showCloseButton={false} className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[32rem]">
        <SheetClose render={<Button variant="ghost" size="icon" className="absolute top-3 right-3 size-11" />}>
          <XIcon />
          <span className="sr-only">Close</span>
        </SheetClose>
        <SheetHeader className="gap-2 border-b border-border px-6 pt-6 pb-5 sm:px-8">
          {eyebrow && <p className="label text-muted-foreground">{eyebrow}</p>}
          <SheetTitle className="title pr-10 text-[clamp(1.375rem,1.2rem+0.6vw,1.875rem)] leading-[1.1] font-normal">{title}</SheetTitle>
          {description && <SheetDescription className="text-[0.9375rem] text-muted-foreground">{description}</SheetDescription>}
        </SheetHeader>
        <div data-lenis-prevent className="flex-1 overflow-y-auto overscroll-contain px-6 py-6 text-[0.9375rem] sm:px-8">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}

type ButtonProps = { id: string; children: ReactNode; className?: string };

export function SheetButton({ id, children, className }: ButtonProps) {
  return (
    <button type="button" aria-haspopup="dialog" onClick={() => openSheet(id)} className={cn("inline-flex min-h-11 items-center text-left", className)}>
      {children}
    </button>
  );
}

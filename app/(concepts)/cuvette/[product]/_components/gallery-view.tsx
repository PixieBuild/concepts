"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";
import { ArrowLeftIcon, ArrowRightIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type GalleryFrame = {
  key: string;
  caption: string;
  captionTop?: boolean;
  alt: string;
  /** Spans both desktop columns at 5:4. */
  wide: boolean;
  grid: ReactNode;
  strip: ReactNode;
  full: ReactNode;
};

const pad = (n: number) => String(n).padStart(2, "0");

function Caption({ index, total, caption, className }: { index: number; total: number; caption: string; className?: string }) {
  return (
    <span className={cn("label pointer-events-none absolute left-3 bg-[#0c0d0e]/80 px-2 py-1 text-foreground backdrop-blur-sm", className)}>
      {total > 1 && <span className="me-3">{`${pad(index + 1)} / ${pad(total)}`}</span>}
      {caption}
    </span>
  );
}

export function GalleryView({ frames, title }: { frames: GalleryFrame[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const total = frames.length;

  const step = (by: number) => setOpen((i) => (i === null ? i : (i + by + total) % total));

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowRight") step(1);
    if (event.key === "ArrowLeft") step(-1);
  }

  const frameButton = (i: number, className: string, image: ReactNode) => (
    <button
      key={frames[i].key}
      type="button"
      onClick={() => setOpen(i)}
      aria-label={`Open image ${i + 1} of ${total}: ${frames[i].caption}`}
      className={cn("group relative block overflow-hidden bg-card", className)}
    >
      {image}
      <Caption index={i} total={total} caption={frames[i].caption} className={frames[i].captionTop ? "top-3" : "bottom-3"} />
    </button>
  );

  const current = open === null ? null : frames[open];

  return (
    <div>
      <div className="lg:hidden">
        <div
          className="flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label={`${title} images`}
          role="region"
          tabIndex={0}
        >
          {frames.map((frame, i) => frameButton(i, cn("aspect-[4/5] shrink-0 snap-start", total > 1 ? "w-[88%]" : "w-full"), frame.strip))}
        </div>
      </div>

      <div className="hidden grid-cols-2 gap-2 lg:grid">
        {frames.map((frame, i) => frameButton(i, frame.wide ? "col-span-2 aspect-[5/4]" : total === 1 ? "col-span-2 aspect-[4/5]" : "aspect-[4/5]", frame.grid))}
      </div>

      <Dialog open={open !== null} onOpenChange={(next) => !next && setOpen(null)}>
        <DialogContent
          showCloseButton={false}
          onKeyDown={onKeyDown}
          className="darkroom top-0 left-0 flex h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none bg-background p-0 ring-0 sm:max-w-none"
        >
          <div className="flex items-center justify-between gap-4 px-4 py-2 sm:px-8">
            <DialogTitle className="label text-[0.6875rem] leading-[1.4] font-normal text-muted-foreground">
              {open !== null && total > 1 && <span className="me-3">{`${pad(open + 1)} / ${pad(total)}`}</span>}
              <span className="text-foreground">{current?.caption}</span>
            </DialogTitle>
            <DialogDescription className="sr-only">{current?.alt}</DialogDescription>
            <DialogClose render={<Button variant="ghost" size="icon" className="size-11" />}>
              <XIcon />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>
          <div className="relative min-h-0 flex-1">{current?.full}</div>
          <div className="flex items-center justify-center gap-2 px-4 py-3">
            {total > 1 && (
              <>
                <Button variant="ghost" size="icon" className="size-11" onClick={() => step(-1)} aria-label="Previous image">
                  <ArrowLeftIcon />
                </Button>
                <Button variant="ghost" size="icon" className="size-11" onClick={() => step(1)} aria-label="Next image">
                  <ArrowRightIcon />
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

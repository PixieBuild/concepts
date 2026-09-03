"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";

import Image from "next/image";

import { GALLERY } from "@/app/(concepts)/casa-lume/_lib/content";

const EASE = [0.16, 1, 0.3, 1] as const;

const SIZES: Record<string, string> = {
  "md:col-span-12": "(min-width:1600px) 1504px, (min-width:768px) 92vw, 100vw",
  "md:col-span-8": "(min-width:1600px) 990px, (min-width:768px) 62vw, 100vw",
  "md:col-span-6": "(min-width:1600px) 740px, (min-width:768px) 46vw, 100vw",
  "md:col-span-4": "(min-width:1600px) 485px, (min-width:768px) 30vw, 100vw",
};

export function GalleryGrid() {
  const [index, setIndex] = useState<number | null>(null);
  const reduced = useReducedMotion();
  const open = index !== null;

  const close = useCallback(() => setIndex(null), []);
  const step = useCallback(
    (direction: 1 | -1) =>
      setIndex((current) =>
        current === null
          ? null
          : (current + direction + GALLERY.length) % GALLERY.length,
      ),
    [],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close, step]);

  const active = index === null ? null : GALLERY[index];

  return (
    <>
      <ul className="grid grid-cols-1 gap-5 md:grid-cols-12 md:gap-6">
        {GALLERY.map((item, i) => (
          <li key={item.src} className={item.span}>
            <motion.button
              type="button"
              onClick={() => setIndex(i)}
              initial={reduced ? undefined : { opacity: 0, y: 24 }}
              whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-8% 0px" }}
              transition={{ duration: 1.1, ease: EASE, delay: (i % 3) * 0.08 }}
              className="group block h-full w-full overflow-hidden text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              aria-label={`Open ${item.alt}`}
            >
              <div className={`relative overflow-hidden ${item.ratio}`}>
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  sizes={SIZES[item.span]}
                  className="object-cover transition-transform duration-1400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-104"
                />
              </div>
            </motion.button>
          </li>
        ))}
      </ul>

      <AnimatePresence>
        {open && active && (
          <motion.div
            className="fixed inset-0 z-70 flex flex-col bg-foreground/95 backdrop-blur-sm"
            initial={reduced ? undefined : { opacity: 0 }}
            animate={reduced ? undefined : { opacity: 1 }}
            exit={reduced ? undefined : { opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            role="dialog"
            aria-modal="true"
            aria-label={active.alt}
          >
            <div className="flex items-center justify-between px-5 py-5 text-background sm:px-8">
              <p className="eyebrow text-background/70">
                {String(index + 1).padStart(2, "0")} /{" "}
                {String(GALLERY.length).padStart(2, "0")}
              </p>
              <button
                type="button"
                onClick={close}
                aria-label="Close gallery"
                className="grid size-10 place-items-center transition-opacity hover:opacity-70"
                autoFocus
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex flex-1 items-center justify-center px-5 pb-6 sm:px-8">
              <motion.div
                key={active.alt}
                initial={reduced ? undefined : { opacity: 0, scale: 0.985 }}
                animate={reduced ? undefined : { opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, ease: EASE }}
                className="w-full max-w-5xl"
              >
                <div
                  className={`relative mx-auto max-h-[72svh] w-full ${active.ratio}`}
                >
                  <Image
                    src={active.src}
                    alt={active.alt}
                    fill
                    sizes="(min-width:1024px) 64rem, 100vw"
                    className="object-contain"
                  />
                </div>
                <p className="mt-5 text-center text-sm text-background/75">
                  {active.alt}
                </p>
              </motion.div>
            </div>

            <div className="flex items-center justify-center gap-3 pb-8 text-background">
              <NavButton label="Previous image" onClick={() => step(-1)}>
                <ArrowLeft className="size-4" />
              </NavButton>
              <NavButton label="Next image" onClick={() => step(1)}>
                <ArrowRight className="size-4" />
              </NavButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function NavButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-12 place-items-center rounded-full border border-background/30 transition-colors hover:border-background/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-background"
    >
      {children}
    </button>
  );
}

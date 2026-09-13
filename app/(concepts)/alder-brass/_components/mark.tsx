import Image from "next/image";

import { cn } from "@/lib/utils";
import { IMAGES } from "../_lib/content";

export function Mark({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("relative block size-11", className)}>
      <Image src={IMAGES.mark} alt="" fill sizes="96px" className="object-contain" />
    </span>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn("block font-heading tracking-[0.16em] uppercase [padding-left:0.16em]", className)}
      style={{ lineHeight: 1 }}
    >
      Alder <em className="tracking-normal italic text-(--brass)">&amp;</em> Brass
    </span>
  );
}

export const LETTERS = ["A", "L", "D", "E", "R", " ", "&", " ", "B", "R", "A", "S", "S"];

// One span per letter, the same markup the masthead's h1 uses, so a copy of the
// wordmark set this way has identical glyph positions: kerning across spans is
// the same in both, and a hand-off between them cannot shift a letter.
export function WordmarkLetters({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("flex justify-center font-heading tracking-[0.16em] uppercase [padding-left:0.16em]", className)}
      style={{ lineHeight: 1 }}
    >
      {LETTERS.map((letter, index) => (
        <span key={index} className={letter === "&" ? "tracking-normal italic text-(--brass)" : undefined}>
          {letter === " " ? "\u00a0" : letter}
        </span>
      ))}
    </span>
  );
}

export function Divider({ index = 0, className }: { index?: number; className?: string }) {
  const src = IMAGES.dividers[index % IMAGES.dividers.length];
  return (
    <div aria-hidden className={cn("flex justify-center", className)}>
      <span className="relative h-5 w-56 sm:h-6 sm:w-72">
        <Image src={src} alt="" fill sizes="288px" className="object-contain" />
      </span>
    </div>
  );
}

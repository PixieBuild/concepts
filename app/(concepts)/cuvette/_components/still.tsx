import Image from "next/image";

import { cn } from "@/lib/utils";
import type { Photo, Shot } from "../_lib/product";
import { resolveStill, type StillSubject } from "../_lib/stills";

type Props = {
  product: StillSubject;
  shot: Shot;
  /** Pass "" when the still repeats nearby text. */
  alt: string;
  sizes?: string;
  /** Preloads the image: only for the one LCP still on a page. */
  priority?: boolean;
  /** Fill the positioned parent (give it an aspect ratio); otherwise the still keeps its own ratio. */
  fill?: boolean;
  quality?: 75 | 90;
  className?: string;
};

export function Still({ product, shot, alt, sizes = "100vw", priority = false, fill, quality = 75, className }: Props) {
  const still = resolveStill(product, shot);
  const common = {
    src: still.src,
    sizes,
    preload: priority,
    quality,
    placeholder: "blur" as const,
    blurDataURL: still.blurDataURL,
  };
  return fill ? (
    <Image {...common} alt={alt} fill className={cn("object-cover", className)} />
  ) : (
    <Image {...common} alt={alt} width={still.width} height={still.height} className={cn("h-auto w-full", className)} />
  );
}

type PhotoProps = {
  photo: Photo;
  /** Pass "" when a live composite on top carries the accessible name. */
  alt?: string;
  sizes?: string;
  priority?: boolean;
  quality?: 75 | 90;
  /** Contain rather than cover, e.g. in the lightbox. */
  contain?: boolean;
  className?: string;
};

/** What a live composite fades in over: the dark set under its key light, faintly lit in the serum's colour. */
export function LivePoster({ tint, className }: { tint: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("absolute inset-0 bg-[#0c0d0e]", className)}
      style={{
        backgroundImage: `radial-gradient(ellipse 30% 36% at 50% 58%, color-mix(in oklab, ${tint} 16%, transparent), transparent 75%), radial-gradient(ellipse 75% 65% at 50% 32%, #2e3032, transparent 80%)`,
      }}
    />
  );
}

/** A product photograph, filling its positioned parent. */
export function ProductPhoto({ photo, alt, sizes = "100vw", priority = false, quality = 75, contain, className }: PhotoProps) {
  return (
    <Image
      src={photo.url}
      alt={alt ?? photo.alt}
      fill
      sizes={sizes}
      preload={priority}
      quality={quality}
      className={cn(contain ? "object-contain" : "object-cover", className)}
    />
  );
}

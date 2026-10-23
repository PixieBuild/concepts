import { getImageProps } from "next/image";

import { cn } from "@/lib/utils";
import type { ProductCard } from "../_lib/product";
import { posterStill } from "../_lib/stills";
import { LivePoster } from "./still";

// The stage is portrait below lg only when the viewport is narrower than the stage box is tall (54svh).
const PORTRAIT = "(max-width: 1023px) and (max-aspect-ratio: 11/20)";

/** The hero's first frame: pre-composited for a product with baked stills (the LCP image), else the dark set until the canvas draws. */
export function HeroPoster({ product, priority = false, className }: { product: Pick<ProductCard, "slug" | "colour">; priority?: boolean; className?: string }) {
  const wide = posterStill(product.slug, false);
  const tall = posterStill(product.slug, true);
  if (!wide || !tall) return <LivePoster tint={product.colour.tint} />;
  const common = { alt: "", sizes: "100vw", quality: 90, loading: "eager" as const };
  const {
    props: { srcSet: portrait },
  } = getImageProps({ ...common, src: tall.src, width: tall.width, height: tall.height });
  const { props } = getImageProps({ ...common, src: wide.src, width: wide.width, height: wide.height, fetchPriority: priority ? "high" : "auto" });
  return (
    <picture>
      <source media={PORTRAIT} srcSet={portrait} />
      <img {...props} alt="" className={cn("absolute inset-0 size-full object-cover", className)} />
    </picture>
  );
}

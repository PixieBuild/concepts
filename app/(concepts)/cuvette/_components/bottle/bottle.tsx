import type { ProductCard, Shot } from "../../_lib/product";
import type { BottleLook } from "../../_lib/product-look";
import { stillAlt } from "../../_lib/stills";
import { LivePoster, ProductPhoto, Still } from "../still";
import { BottleCanvas } from "./bottle-canvas";

/** The product fields a bottle picture needs; any `ProductCard` or `Product` fits. */
export type BottleProduct = Pick<ProductCard, "slug" | "title" | "contains" | "separately" | "parts" | "looks" | "photos" | "baked" | "colour">;

type Props = {
  shot: Shot;
  /** A product (its pre-baked stills when it has them, else composited live), or the range's group shot. */
  product?: BottleProduct | "range";
  /** Any look as data alone: always composited live. */
  look?: BottleLook;
  alt?: string;
  sizes?: string;
  priority?: boolean;
  quality?: 75 | 90;
  /** Show the product's first photo under a live composite until it is drawn (and without JS). */
  fallback?: boolean;
  className?: string;
};

/** The template bottle as one product, filling its positioned parent. */
export function Bottle({ shot, product, look, alt, sizes, priority, quality, fallback = true, className }: Props) {
  if (product === "range" || product?.baked) {
    const text = alt ?? stillAlt(product, shot);
    const subject = product === "range" ? "range" : product.slug;
    return <Still product={subject} shot={shot} alt={text} sizes={sizes} priority={priority} quality={quality} fill className={className} />;
  }
  const looks = look ? [look] : (product?.looks ?? []);
  const photo = product?.photos[0];
  // No bottle to draw: the product's photo stands in, or the dark set in its colour.
  if (!looks.length) {
    if (photo) return <ProductPhoto photo={photo} alt={alt} sizes={sizes} priority={priority} quality={quality} className={className} />;
    return product ? <LivePoster tint={product.colour.tint} className={className} /> : null;
  }
  const text = alt ?? (product ? stillAlt(product, shot) : `${looks[0].label.name} ${looks[0].label.strength} serum in a glass dropper bottle`);
  // The first photo is what the server and no-JS visitors see; the live composite fades in over it.
  return (
    <>
      {fallback && photo && <ProductPhoto photo={photo} alt="" sizes={sizes} priority={priority} quality={quality} className={className} />}
      <BottleCanvas looks={looks} shot={shot} alt={text} className={className} />
    </>
  );
}

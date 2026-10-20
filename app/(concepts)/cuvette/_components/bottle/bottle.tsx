import type { ProductCard, Shot } from "../../_lib/product";
import type { BottleLook } from "../../_lib/product-look";
import { stillAlt } from "../../_lib/stills";
import { LivePoster, MerchantPhoto, Still } from "../still";
import { BottleCanvas } from "./bottle-canvas";

/** The product fields a bottle picture needs; any `ProductCard` or `Product` fits. */
export type BottleProduct = Pick<ProductCard, "slug" | "title" | "contains" | "separately" | "parts" | "looks" | "images" | "baked" | "colour">;

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
  /** Show the merchant's first upload under a live composite until it is drawn (and without JS). */
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
  const upload = product?.images[0];
  // No bottle metafields in Shopify: the merchant's own photo stands in, or the dark set in the product's colour.
  if (!looks.length) {
    if (upload) return <MerchantPhoto image={upload} alt={alt} sizes={sizes} priority={priority} quality={quality} className={className} />;
    return product ? <LivePoster tint={product.colour.tint} className={className} /> : null;
  }
  const text = alt ?? (product ? stillAlt(product, shot) : `${looks[0].label.name} ${looks[0].label.strength} serum in a glass dropper bottle`);
  // The merchant's first upload is what the server and no-JS visitors see; the live composite fades in over it.
  return (
    <>
      {fallback && upload && <MerchantPhoto image={upload} alt="" sizes={sizes} priority={priority} quality={quality} className={className} />}
      <BottleCanvas looks={looks} shot={shot} alt={text} className={className} />
    </>
  );
}

import type { MerchantImage, Product, Shot } from "../../_lib/product";
import { galleryShots, hasStill, stillAlt } from "../../_lib/stills";
import { Bottle } from "../../_components/bottle/bottle";
import { LivePoster, MerchantPhoto } from "../../_components/still";
import { GalleryView, type GalleryFrame } from "./gallery-view";

type Frame = { kind: "bottle"; shot: Shot; caption: string } | { kind: "upload"; image: MerchantImage; caption: string };

/** Shots the page gives a full-bleed band of their own further down, so the gallery leaves them out. */
const BAND_SHOTS: Shot[] = ["drop"];

/** The bottle shots first (baked or composited live), then whatever the merchant uploaded in Shopify admin. */
function framesFor(product: Product): Frame[] {
  const bottle = galleryShots(product)
    .filter((f) => !BAND_SHOTS.includes(f.shot))
    .map((f): Frame => ({ kind: "bottle", shot: f.shot, caption: f.caption }));
  const uploads = product.images.map((image): Frame => ({ kind: "upload", image, caption: "From the studio" }));
  return [...bottle, ...uploads];
}

/** The wide lead crop on desktop comes from the hero render when there is one; a lone frame stays 4:5. */
function leadShot(slug: Product["slug"], shot: Shot): Shot {
  return shot === "pack" && hasStill(slug, "hero-wide") ? "hero-wide" : shot;
}

// Merchant uploads are often packshots on white, so they sit inset on the dark card like a mounted print.
const MATTE = "p-6 sm:p-10";

function pictures(product: Product, frame: Frame, i: number, wide: boolean, lone: boolean) {
  const gridSizes = wide || lone ? "(min-width: 1024px) 58vw, 1px" : "(min-width: 1024px) 29vw, 1px";
  if (frame.kind === "upload") {
    const { image } = frame;
    return {
      alt: image.alt,
      grid: <MerchantPhoto image={image} priority={i === 0} quality={90} sizes={gridSizes} contain className={MATTE} />,
      strip: <MerchantPhoto image={image} priority={i === 0} sizes="(min-width: 1024px) 1px, 88vw" contain className={MATTE} />,
      full: <MerchantPhoto image={image} quality={90} sizes="(min-aspect-ratio: 4/5) 80vh, 100vw" contain />,
    };
  }
  const alt = stillAlt(product, frame.shot);
  const gridShot = i === 0 && wide ? leadShot(product.slug, frame.shot) : frame.shot;
  // A live composite fades in over the dark set, never over an unrelated merchant photo.
  const poster = product.baked ? null : <LivePoster tint={product.colour.tint} />;
  return {
    alt,
    grid: (
      <>
        {poster}
        <Bottle product={product} shot={gridShot} alt={alt} priority={i === 0} quality={90} sizes={gridSizes} fallback={false} />
      </>
    ),
    strip: (
      <>
        {poster}
        <Bottle product={product} shot={frame.shot} alt={alt} priority={i === 0} sizes="(min-width: 1024px) 1px, 88vw" fallback={false} />
      </>
    ),
    full: (
      <>
        {poster}
        <Bottle product={product} shot={frame.shot} alt={alt} quality={90} sizes="(min-aspect-ratio: 4/5) 80vh, 100vw" className="object-contain" fallback={false} />
      </>
    ),
  };
}

export function Gallery({ product }: { product: Product }) {
  const frames = framesFor(product);
  const rest = frames.length - 1;

  const view: GalleryFrame[] = frames.map((frame, i) => {
    const wide = rest > 0 && (i === 0 || (rest % 2 === 1 && i === frames.length - 1));
    return {
      key: frame.kind === "upload" ? frame.image.url : frame.shot,
      caption: frame.caption,
      // The label macro prints its own lot line along the bottom.
      captionTop: frame.kind === "bottle" && frame.shot === "label",
      wide,
      ...pictures(product, frame, i, wide, rest === 0),
    };
  });

  return <GalleryView frames={view} title={product.title} />;
}

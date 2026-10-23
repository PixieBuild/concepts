import type { Photo, Product, Shot } from "../../_lib/product";
import { galleryShots, hasStill, stillAlt } from "../../_lib/stills";
import { Bottle } from "../../_components/bottle/bottle";
import { LivePoster, ProductPhoto } from "../../_components/still";
import { GalleryView, type GalleryFrame } from "./gallery-view";

type Frame = { kind: "bottle"; shot: Shot; caption: string } | { kind: "photo"; photo: Photo; caption: string };

/** Shots the page gives a full-bleed band of their own further down, so the gallery leaves them out. */
const BAND_SHOTS: Shot[] = ["drop"];

/** The bottle shots first (baked or composited live), then the product's photos. */
function framesFor(product: Product): Frame[] {
  const bottle = galleryShots(product)
    .filter((f) => !BAND_SHOTS.includes(f.shot))
    .map((f): Frame => ({ kind: "bottle", shot: f.shot, caption: f.caption }));
  const photos = product.photos.map((photo): Frame => ({ kind: "photo", photo, caption: "From the studio" }));
  return [...bottle, ...photos];
}

/** The wide lead crop on desktop comes from the hero render when there is one; a lone frame stays 4:5. */
function leadShot(slug: Product["slug"], shot: Shot): Shot {
  return shot === "pack" && hasStill(slug, "hero-wide") ? "hero-wide" : shot;
}

// Photos sit inset like a mounted print, so any crop fits and none competes with the full-bleed bottle shots.
const MATTE = "p-6 sm:p-10";

function pictures(product: Product, frame: Frame, i: number, wide: boolean, lone: boolean) {
  const gridSizes = wide || lone ? "(min-width: 1024px) 58vw, 1px" : "(min-width: 1024px) 29vw, 1px";
  if (frame.kind === "photo") {
    const { photo } = frame;
    return {
      alt: photo.alt,
      grid: <ProductPhoto photo={photo} priority={i === 0} quality={90} sizes={gridSizes} contain className={MATTE} />,
      strip: <ProductPhoto photo={photo} priority={i === 0} sizes="(min-width: 1024px) 1px, 88vw" contain className={MATTE} />,
      full: <ProductPhoto photo={photo} quality={90} sizes="(min-aspect-ratio: 4/5) 80vh, 100vw" contain />,
    };
  }
  const alt = stillAlt(product, frame.shot);
  const gridShot = i === 0 && wide ? leadShot(product.slug, frame.shot) : frame.shot;
  // A live composite fades in over the dark set, never over an unrelated photo.
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
      key: frame.kind === "photo" ? frame.photo.url : frame.shot,
      caption: frame.caption,
      // The label macro prints its own lot line along the bottom.
      captionTop: frame.kind === "bottle" && frame.shot === "label",
      wide,
      ...pictures(product, frame, i, wide, rest === 0),
    };
  });

  return <GalleryView frames={view} title={product.title} />;
}

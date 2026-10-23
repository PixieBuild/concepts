import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";

import { getProduct } from "../_lib/catalog";
import { priceShort } from "../_lib/format";
import { isSet, priceOf, sizeLabel as sizeOf, type Product } from "../_lib/product";
import { INK, MUTED, OG_SIZE, PAPER, asJpeg, ogFonts, photoDataUri, stillDataUri } from "../_og/assets";

export const contentType = "image/jpeg";

const PHOTO = { width: 504, height: OG_SIZE.height };

function altFor(p: Product): string {
  const price = priceShort(priceOf(p));
  const photo = p.photos[0];
  if (photo) return `Cuvette ${p.title}, ${price}: ${photo.alt}`;
  if (!p.baked) return `Cuvette ${p.title}, ${p.descriptor.toLowerCase()}, ${price}`;
  const what = isSet(p) ? `${p.parts.map((part) => part.title).join(" and ")} dropper bottles` : `${p.title} serum in a glass dropper bottle`;
  return `Cuvette ${p.title}: ${what} on a basalt plinth, ${price}`;
}

/** The first photo, else the baked packshot, else none: the card is type alone. */
async function photoFor(p: Product): Promise<string | null> {
  const photo = p.photos[0];
  if (photo) return photoDataUri(photo.url, PHOTO.width, PHOTO.height);
  return p.baked ? stillDataUri(p.slug, "pack", PHOTO.width, PHOTO.height) : null;
}

export function generateImageMetadata({ params }: { params: { product: string } }) {
  const p = getProduct(params.product);
  return p ? [{ id: "card", alt: altFor(p), size: OG_SIZE, contentType }] : [];
}

function Strength({ product }: { product: Product }) {
  if (!isSet(product)) return <span style={{ color: product.colour.onDark }}>{product.strength}</span>;
  const parts = product.parts;
  return (
    <span style={{ display: "flex", gap: 28 }}>
      {parts.map((part, i) => (
        <span key={part.slug} style={{ display: "flex", gap: 28 }}>
          {i > 0 && <span style={{ color: MUTED }}>+</span>}
          <span style={{ color: part.colour.onDark }}>{part.strength.replace("%", "")}</span>
        </span>
      ))}
    </span>
  );
}

export default async function OpengraphImage({ params }: { params: Promise<{ product: string }> }) {
  const product = getProduct((await params).product) ?? notFound();
  const [image, fonts] = await Promise.all([photoFor(product), ogFonts()]);
  const spec = isSet(product) ? [sizeOf(product), product.when.includes("AM") && !product.when.includes("PM") ? "Mornings" : "Daily"] : [product.ph && `pH ${product.ph}`, sizeOf(product)].filter(Boolean);

  const card = new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: INK, color: PAPER, fontFamily: "Mona Sans" }}>
        {image && <img src={image} width={PHOTO.width} height={PHOTO.height} alt="" />}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "52px 60px 50px 64px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 500, fontSize: 22, letterSpacing: "0.34em" }}>CUVETTE</span>
            <span style={{ fontFamily: "Fragment Mono", fontSize: 15, letterSpacing: "0.08em", color: MUTED }}>
              {[product.code, product.lot.code && `LOT ${product.lot.code}`].filter(Boolean).join(" · ")}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontWeight: 300, fontSize: 64, lineHeight: 1, letterSpacing: "-0.035em" }}>{product.name}</span>
            <div style={{ display: "flex", fontWeight: 200, fontSize: 172, lineHeight: 0.9, letterSpacing: "-0.045em", marginTop: 14, marginLeft: -6 }}>
              <Strength product={product} />
            </div>
            <span style={{ fontWeight: 300, fontSize: 25, lineHeight: 1.3, color: MUTED, marginTop: 26, maxWidth: 520 }}>{product.descriptor}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: "1px solid rgba(235,235,232,0.16)", paddingTop: 22 }}>
            <span style={{ fontFamily: "Fragment Mono", fontSize: 16, letterSpacing: "0.08em", color: MUTED, textTransform: "uppercase" }}>
              {[...spec, "Filled in Porto"].join(" · ")}
            </span>
            <span style={{ fontWeight: 300, fontSize: 40, lineHeight: 1, letterSpacing: "-0.02em" }}>{priceShort(priceOf(product))}</span>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts },
  );
  return asJpeg(card, contentType);
}

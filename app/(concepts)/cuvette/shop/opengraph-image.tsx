import { ImageResponse } from "next/og";

import { listProducts } from "../_lib/catalog";
import { isSet, rangeSummary, type Product } from "../_lib/product";
import { INK, MUTED, OG_SIZE, PAPER, asJpeg, imageDataUri, ogFonts, stillDataUri } from "../_og/assets";

export const alt = "The Cuvette shop: every serum in the range, each in a glass dropper bottle under a single light";
export const size = OG_SIZE;
export const contentType = "image/jpeg";

const FRAME = { width: 320, height: OG_SIZE.height / 2 };

/** The baked packshot, cropped from the top so the dropper keeps its headroom, for local demo products, else the merchant's first upload; null leaves the frame out. */
async function frameFor(p: Product): Promise<string | null> {
  if (p.baked) return stillDataUri(p.slug, "pack", FRAME.width, FRAME.height, "north");
  return p.images[0] ? imageDataUri(p.images[0].url, FRAME.width, FRAME.height) : null;
}

export default async function OpengraphImage() {
  const [products, fonts] = await Promise.all([listProducts(), ogFonts()]);
  const serums = products.filter((p) => !isSet(p));
  const frames = (await Promise.all(serums.map(async (p) => ({ p, src: await frameFor(p) })))).filter((f): f is { p: Product; src: string } => !!f.src).slice(0, 4);

  const card = new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: INK, color: PAPER, fontFamily: "Mona Sans" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "52px 48px 48px 64px" }}>
          <span style={{ fontWeight: 500, fontSize: 24, letterSpacing: "0.34em" }}>CUVETTE</span>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontFamily: "Fragment Mono", fontSize: 16, letterSpacing: "0.08em", color: MUTED, marginBottom: 22 }}>{`SHOP · ${rangeSummary(products).toUpperCase()}`}</span>
            <span style={{ fontWeight: 300, fontSize: 52, lineHeight: 1.04, letterSpacing: "-0.035em" }}>Every bottle we fill,</span>
            <span style={{ fontWeight: 300, fontSize: 52, lineHeight: 1.04, letterSpacing: "-0.035em", color: MUTED }}>priced per litre.</span>
          </div>
          <span style={{ fontFamily: "Fragment Mono", fontSize: 16, letterSpacing: "0.08em", color: MUTED }}>FRAGRANCE-FREE · FILLED IN PORTO</span>
        </div>
        {frames.length > 0 && (
          <div style={{ width: FRAME.width * 2, display: "flex", flexWrap: "wrap" }}>
            {frames.map(({ p, src }, i) => (
              <div key={p.slug} style={{ width: FRAME.width, height: FRAME.height, display: "flex", position: "relative" }}>
                <img src={src} width={FRAME.width} height={FRAME.height} alt="" />
                <span style={{ position: "absolute", left: 16, top: 16, fontFamily: "Fragment Mono", fontSize: 14, letterSpacing: "0.08em", color: PAPER }}>
                  {`${String(i + 1).padStart(2, "0")}  ${p.title.toUpperCase()}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    ),
    { ...OG_SIZE, fonts },
  );
  return asJpeg(card, contentType);
}

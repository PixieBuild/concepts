import { ImageResponse } from "next/og";

import { listProducts } from "./_lib/catalog";
import { isSet } from "./_lib/product";
import { INK, MUTED, OG_SIZE, PAPER, asJpeg, ogFonts, stillDataUri } from "./_og/assets";

export const alt = "Cuvette: clinical serums in glass dropper bottles on a basalt plinth, lit in a dark studio";
export const size = OG_SIZE;
export const contentType = "image/jpeg";

const IMAGE_WIDTH = 640;
const WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];

export default async function OpengraphImage() {
  const [image, fonts, products] = await Promise.all([stillDataUri("range", "group", IMAGE_WIDTH, OG_SIZE.height), ogFonts(), listProducts()]);
  const serums = products.filter((p) => !isSet(p));
  const count = WORDS[serums.length] ?? String(serums.length);

  const card = new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: INK, color: PAPER, fontFamily: "Mona Sans" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "52px 48px 48px 64px" }}>
          <span style={{ fontWeight: 500, fontSize: 24, letterSpacing: "0.34em" }}>CUVETTE</span>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontWeight: 300, fontSize: 60, lineHeight: 1.02, letterSpacing: "-0.035em" }}>{`${count} serum${serums.length === 1 ? "" : "s"},`}</span>
            <span style={{ fontWeight: 300, fontSize: 60, lineHeight: 1.02, letterSpacing: "-0.035em", color: MUTED }}>one lead active</span>
            <span style={{ fontWeight: 300, fontSize: 60, lineHeight: 1.02, letterSpacing: "-0.035em", color: MUTED }}>each.</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, fontFamily: "Fragment Mono", fontSize: 16, letterSpacing: "0.08em" }}>
            {serums.slice(0, 4).map((p) => (
              <span key={p.slug} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ width: 10, height: 10, borderRadius: 5, background: p.colour.band }} />
                <span>{p.title.toUpperCase()}</span>
              </span>
            ))}
            <span style={{ color: MUTED, marginTop: 6 }}>FILLED IN PORTO</span>
          </div>
        </div>
        <img src={image} width={IMAGE_WIDTH} height={OG_SIZE.height} alt="" />
      </div>
    ),
    { ...OG_SIZE, fonts },
  );
  return asJpeg(card, contentType);
}

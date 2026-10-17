import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";

export const alt = "Brèche, mountain guides in Chamonix: Mont Blanc at first light with the Goûter route drawn to the summit";
export const size = { width: 1200, height: 630 };
export const contentType = "image/jpeg";

const INK = "#0f1724";
const SNOW = "#eef1f3";
const GLACIER = "#93c4dd";
const SIGNAL = "#c8471f";

const asset = (file: string) => readFile(join(process.cwd(), "app/(concepts)/breche/_og", file));
const [summit, expanded800, expanded900, condensed500] = await Promise.all([
  asset("summit.jpg"),
  asset("archivo-expanded-800.ttf"),
  asset("archivo-expanded-900.ttf"),
  asset("archivo-condensed-500.ttf"),
]);
const background = `data:image/jpeg;base64,${summit.toString("base64")}`;

export default async function OpengraphImage() {
  const card = new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: INK, color: SNOW, fontFamily: "Archivo Condensed" }}>
        <img src={background} width={1200} height={630} alt="" style={{ position: "absolute", top: 0, left: 0 }} />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            backgroundImage: `linear-gradient(90deg, ${INK} 0%, rgba(15,23,36,0.9) 30%, rgba(15,23,36,0.45) 52%, rgba(15,23,36,0) 70%)`,
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            padding: "60px 72px 56px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18, fontFamily: "Archivo Condensed", fontSize: 26, color: SNOW }}>
            <div style={{ display: "flex", width: 44, height: 3, background: SIGNAL }} />
            <span>Compagnie de guides · Chamonix</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontFamily: "Archivo Expanded", fontWeight: 900, fontSize: 150, lineHeight: 1, letterSpacing: -3 }}>
              Brèche
            </div>
            <div style={{ display: "flex", flexDirection: "column", marginTop: 30 }}>
              <span style={{ fontFamily: "Archivo Expanded", fontWeight: 800, fontSize: 40, lineHeight: 1.1 }}>Guided climbs</span>
              <span style={{ fontFamily: "Archivo Condensed", fontSize: 44, lineHeight: 1.15, color: GLACIER }}>on the Mont Blanc massif</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16, fontFamily: "Archivo Condensed", fontSize: 26 }}>
            <span>Chamonix 1 035 m</span>
            <div style={{ display: "flex", width: 56, height: 2, background: SIGNAL }} />
            <span>Mont Blanc 4 808 m</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Archivo Expanded", data: expanded800, weight: 800, style: "normal" },
        { name: "Archivo Expanded", data: expanded900, weight: 900, style: "normal" },
        { name: "Archivo Condensed", data: condensed500, weight: 500, style: "normal" },
      ],
    },
  );
  // A photographic PNG is ~470 KB; WhatsApp drops link previews above ~300 KB.
  const jpeg = await sharp(Buffer.from(await card.arrayBuffer())).jpeg({ quality: 86, mozjpeg: true }).toBuffer();
  return new Response(new Uint8Array(jpeg), { headers: { "content-type": contentType } });
}

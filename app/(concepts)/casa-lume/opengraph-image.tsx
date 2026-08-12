import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Casa Lume — a boutique hotel on the Ligurian coast";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const mark = await readFile(
    join(process.cwd(), "public/concepts/casa-lume/mark.png"),
  );
  const markSrc = `data:image/png;base64,${mark.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 84,
          background: "#faf7f1",
          color: "#2b2724",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 24,
            letterSpacing: 6,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <img src={markSrc} width={88} height={88} alt="" />
            <span style={{ display: "flex" }}>CASA LUME</span>
          </div>
          <span style={{ display: "flex", color: "#8a7f74" }}>
            LIGURIA, ITALY
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{ display: "flex", width: 96, height: 3, background: "#b56a4a" }}
          />
          <div
            style={{ display: "flex", fontSize: 88, lineHeight: 1.04, maxWidth: 900 }}
          >
            Where the hills meet the sea.
          </div>
          <div style={{ display: "flex", fontSize: 28, color: "#6e655c" }}>
            Seventeen rooms above a cove · April – November
          </div>
        </div>
      </div>
    ),
    size,
  );
}

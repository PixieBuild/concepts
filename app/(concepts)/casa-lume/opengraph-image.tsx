import { ImageResponse } from "next/og";

import { OG_MARK, OG_TERRACE } from "./_lib/og-assets";

export const alt = "Casa Lume — seventeen rooms above the Ligurian sea";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#faf7f1",
          color: "#2b2724",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: 660,
            padding: "64px 56px 64px 72px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <img src={OG_MARK} width={64} height={64} alt="" />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ display: "flex", fontSize: 26, letterSpacing: 7 }}>
                CASA LUME
              </span>
              <span
                style={{
                  display: "flex",
                  marginTop: 6,
                  fontSize: 12,
                  letterSpacing: 5,
                  color: "#8a7f74",
                }}
              >
                MONTEROSSO, LIGURIA
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
            <div style={{ display: "flex", width: 72, height: 2, background: "#b56a4a" }} />
            <div style={{ display: "flex", fontSize: 66, lineHeight: 1.06 }}>
              Seventeen rooms, ninety steps above the sea.
            </div>
            <div style={{ display: "flex", fontSize: 22, color: "#6e655c" }}>
              A family house on the terraces · April to November
            </div>
          </div>
        </div>

        <img
          src={OG_TERRACE}
          width={540}
          height={630}
          alt=""
          style={{ objectFit: "cover" }}
        />
      </div>
    ),
    size,
  );
}

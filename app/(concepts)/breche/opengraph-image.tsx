import { ImageResponse } from "next/og";

export const alt = "Brèche — Mountain guides, Chamonix";
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
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#12181d",
          color: "#e8eaea",
          padding: "54px 60px",
          fontFamily: "Helvetica, Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 21, color: "#9fb6c4" }}>
          <span>Compagnie de guides, Chamonix</span>
          <span>Chamonix 1 035 m — Mont Blanc 4 808 m</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", width: 132, height: 6, background: "#c8471f", marginBottom: 30 }} />
          <div style={{ display: "flex", fontSize: 224, fontWeight: 900, letterSpacing: -4, lineHeight: 1 }}>BRÈCHE</div>
        </div>
        <div style={{ display: "flex", fontSize: 30, maxWidth: 760, lineHeight: 1.25 }}>
          Roped to someone who has climbed it four hundred times.
        </div>
      </div>
    ),
    size,
  );
}

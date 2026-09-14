import { ImageResponse } from "next/og";

export const alt = "Ottoline — Parfumeur, Grasse";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#2a0f1e", color: "#f2e6da", fontFamily: "Georgia, 'Times New Roman', serif" }}>
        <div style={{ display: "flex", fontSize: 150, fontWeight: 900, letterSpacing: 4 }}>OTTOLINE</div>
        <div style={{ display: "flex", fontSize: 40, fontStyle: "italic", color: "#c39a72", marginTop: -10 }}>Parfums</div>
        <div style={{ display: "flex", fontSize: 18, letterSpacing: 8, color: "#b89aa9", marginTop: 40 }}>PARFUMEUR · GRASSE · DEPUIS 1962</div>
      </div>
    ),
    size,
  );
}

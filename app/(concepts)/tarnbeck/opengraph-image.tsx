import { ImageResponse } from "next/og";

export const alt = "Tarnbeck — Pocket watches made in Kendal since 1898";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0b0b0c", color: "#e8e4da", fontFamily: "Helvetica, Arial, sans-serif" }}>
        <div style={{ display: "flex", fontSize: 210, letterSpacing: 8, lineHeight: 1 }}>TARNBECK</div>
        <div style={{ display: "flex", fontSize: 18, letterSpacing: 6, color: "#c9a66b", marginTop: 30 }}>NO. 3 · HUNTER · KENDAL, CUMBRIA · SINCE 1898</div>
      </div>
    ),
    size,
  );
}

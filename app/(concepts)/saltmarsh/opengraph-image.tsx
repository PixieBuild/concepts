import { ImageResponse } from "next/og";

export const alt = "Saltmarsh — Nine houses on the Suffolk shore";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", background: "linear-gradient(180deg,#7f92a3,#1f2a44)", color: "#e9e7e1", padding: "0 0 0 40px", fontFamily: "Impact, 'Arial Narrow Bold', sans-serif", overflow: "hidden" }}>
        <div style={{ display: "flex", fontSize: 34, fontFamily: "Georgia, serif", fontStyle: "italic", marginBottom: 10 }}>Nine houses on the Suffolk shore</div>
        <div style={{ display: "flex", fontSize: 250, lineHeight: 0.85, letterSpacing: -4, marginBottom: -40 }}>SALTMARSH</div>
      </div>
    ),
    size,
  );
}

import { ImageResponse } from "next/og";

export const alt = "Skerry — Design studio for things that have to last";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", background: "linear-gradient(135deg,#0e0f14 20%,#3b60c5 70%,#8e5a3b)", color: "#fdf2de", padding: "60px 70px", fontFamily: "Helvetica, Arial, sans-serif" }}>
        <div style={{ display: "flex", fontSize: 20, letterSpacing: 6, marginBottom: 24 }}>SKERRY</div>
        <div style={{ display: "flex", fontSize: 84, lineHeight: 1, letterSpacing: -2, maxWidth: 900 }}>Design studio for things that have to last.</div>
      </div>
    ),
    size,
  );
}

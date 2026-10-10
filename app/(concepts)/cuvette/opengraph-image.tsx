import { ImageResponse } from "next/og";

export const alt = "Cuvette — One active, at the strength that works";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#ebe4d9", color: "#1c1a17", padding: "56px 64px", fontFamily: "Georgia, 'Times New Roman', serif" }}>
        <div style={{ display: "flex", fontSize: 44 }}>Cuvette</div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 104, lineHeight: 0.98, letterSpacing: -2 }}>
          <span>One active,</span>
          <span>at the strength</span>
          <span style={{ fontStyle: "italic" }}>that works.</span>
        </div>
        <div style={{ display: "flex", fontSize: 20, letterSpacing: 3, fontFamily: "Helvetica, Arial, sans-serif", color: "#6f675c" }}>
          VITAMIN C 15% · HYALURONIC 2% · NIACINAMIDE 10%
        </div>
      </div>
    ),
    size,
  );
}

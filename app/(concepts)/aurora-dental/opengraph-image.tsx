import { ImageResponse } from "next/og";

export const alt = "Aurora Dental — Gentle, modern dentistry";
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
          padding: 80,
          background: "linear-gradient(135deg, #f2fafd 0%, #d9eef7 100%)",
          color: "#152438",
        }}
      >
        <div style={{ display: "flex", fontSize: 32, fontWeight: 600 }}>
          Aurora Dental
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 68, lineHeight: 1.1, maxWidth: 900 }}>
            Dentistry that doesn&apos;t make you brace for it.
          </div>
          <div style={{ fontSize: 30, color: "#3d6478" }}>
            Same-week appointments · Transparent pricing
          </div>
        </div>
      </div>
    ),
    size,
  );
}

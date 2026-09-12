import { ImageResponse } from "next/og";

export const alt = "Meridian — Men's Grooming Lounge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f3f2f2",
          color: "#201e1d",
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 30, height: 30, background: "#ec3013" }} />
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: 6 }}>MERIDIAN</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2 }}>A precise cut.</div>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2 }}>A proper shave.</div>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2, color: "#ec3013" }}>
            Zero fuss.
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 24, color: "#5c5a58", letterSpacing: 1 }}>
          Rated 4.9/5 · Men&apos;s grooming lounge · Downtown Chicago
        </div>
      </div>
    ),
    { ...size },
  );
}

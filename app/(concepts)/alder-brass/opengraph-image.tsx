import { ImageResponse } from "next/og";

import { OG_CUP, OG_MARK } from "./_lib/og-assets";

export const alt = "Alder & Brass — Coffee house and roastery, Portland, since 2009";
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
          background: "#eceae3",
          color: "#182019",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: 720,
            padding: "60px 24px 56px 72px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <img src={OG_MARK} width={64} height={64} alt="" />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 30, letterSpacing: 6 }}>
                ALDER <span style={{ fontStyle: "italic", color: "#a8874a", margin: "0 12px", letterSpacing: 0 }}>&amp;</span> BRASS
              </div>
              <div style={{ display: "flex", marginTop: 8, fontSize: 12, letterSpacing: 4, color: "#5e665f" }}>
                COFFEE HOUSE &amp; ROASTERY · PORTLAND · SINCE 2009
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div style={{ display: "flex", width: 72, height: 5, borderTop: "1px solid #182019", borderBottom: "1px solid #182019" }} />
            <div style={{ display: "flex", flexDirection: "column", fontSize: 62, lineHeight: 1.06, letterSpacing: -1 }}>
              <span>Slow coffee,</span>
              <span style={{ fontStyle: "italic", color: "#1e3a2f" }}>warm rooms.</span>
            </div>
            <div style={{ display: "flex", fontSize: 21, color: "#5e665f" }}>
              214 Alder Street · Open today till six · No bookings, walk in
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 480,
            height: 630,
            background: "#1e3a2f",
          }}
        >
          <img src={OG_CUP} width={360} height={323} alt="" />
        </div>
      </div>
    ),
    size,
  );
}

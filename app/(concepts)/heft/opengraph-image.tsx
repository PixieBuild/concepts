import { ImageResponse } from "next/og";

export const alt = "Heft — Strength classes in Leeds, first week free";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PILE = [
  { label: "STRENGTH", bg: "#efeee9", ink: "#121212", left: 40, top: 470, rotate: -6 },
  { label: "25", bg: "#d7262e", ink: "#efeee9", left: 330, top: 405, rotate: 0, plate: true },
  { label: "BOXING", bg: "#efeee9", ink: "#121212", left: 520, top: 490, rotate: 8 },
  { label: "20", bg: "#1f5fbf", ink: "#efeee9", left: 790, top: 400, rotate: 0, plate: true },
  { label: "FIRST WEEK FREE", bg: "#d4ff3f", ink: "#121212", left: 740, top: 540, rotate: -3 },
  { label: "SPIN", bg: "#efeee9", ink: "#121212", left: 1010, top: 460, rotate: -14 },
];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#121212", color: "#efeee9", fontFamily: "Impact, 'Arial Narrow Bold', sans-serif", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 56, top: 44, display: "flex", flexDirection: "column", fontSize: 112, lineHeight: 0.9 }}>
          <span>SMALL CLASSES.</span>
          <span>REAL COACHES.</span>
          <span>NO CONTRACT.</span>
        </div>
        {PILE.map((h) => (
          <div
            key={h.label}
            style={{ position: "absolute", display: "flex", alignItems: "center", justifyContent: "center", left: h.left, top: h.top, height: h.plate ? 190 : 90, width: h.plate ? 190 : undefined, padding: h.plate ? 0 : "0 32px", borderRadius: 100, background: h.bg, color: h.ink, fontSize: h.plate ? 64 : 50, transform: `rotate(${h.rotate}deg)` }}
          >
            {h.label}
          </div>
        ))}
      </div>
    ),
    size,
  );
}

import { ImageResponse } from "next/og";

export const alt = "Stängel — Flower studio, Neukölln";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CARDS = [
  { tone: "#f2a38b", left: 150, top: 70, rotate: -7 },
  { tone: "#e4572e", left: 470, top: 40, rotate: 5 },
  { tone: "#5b7bd5", left: 790, top: 80, rotate: -4 },
];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#dfe5cc", color: "#1f2618", fontFamily: "Helvetica, Arial, sans-serif", overflow: "hidden" }}>
        {CARDS.map((c) => (
          <div key={c.tone} style={{ position: "absolute", display: "flex", left: c.left, top: c.top, width: 220, height: 293, background: c.tone, transform: `rotate(${c.rotate}deg)` }} />
        ))}
        <div style={{ position: "absolute", display: "flex", left: 0, right: 0, bottom: -70, justifyContent: "center", fontSize: 300, fontWeight: 800, letterSpacing: -18 }}>stängel</div>
      </div>
    ),
    size,
  );
}

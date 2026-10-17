import type { Danger } from "../_lib/content";

const FILL: Record<Danger["level"], string> = { 1: "#ccff66", 2: "#ffff00", 3: "#ff9900", 4: "#ff0000", 5: "#ff0000" };

/** The European avalanche danger scale diamond, with the level's official fill. */
export function AvalancheBadge({ danger }: { danger: Danger }) {
  return (
    <svg
      viewBox="0 0 80 80"
      role="img"
      aria-label={`Avalanche danger ${danger.level} of 5, ${danger.label.toLowerCase()}, ${danger.where}`}
      className="w-16 shrink-0 sm:w-20"
    >
      <defs>
        <pattern id="avalanche-check" width="10" height="10" patternUnits="userSpaceOnUse">
          <rect width="10" height="10" fill="#ff0000" />
          <rect width="5" height="5" fill="#0f1724" />
          <rect x="5" y="5" width="5" height="5" fill="#0f1724" />
        </pattern>
      </defs>
      <path d="M40 3 77 40 40 77 3 40Z" fill={danger.level === 5 ? "url(#avalanche-check)" : FILL[danger.level]} stroke="#0f1724" strokeWidth={3} strokeLinejoin="round" />
      <path d="M24 34 33 23 38 28 45 19 56 34Z" fill="#0f1724" />
      <text x="40" y="60" textAnchor="middle" fontSize={22} fontWeight={600} fontStretch="75%" fill="#0f1724" style={{ fontFamily: "inherit" }}>
        {danger.level}
      </text>
    </svg>
  );
}

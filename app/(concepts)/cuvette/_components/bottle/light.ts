import type { LiveLight } from "./compositor";

/** The eased pointer over the stage, -1..1 across it, and how present it is (0 once it leaves). */
export type Pointer = { x: number; y: number; on: number };

// At each chapter the light rests behind the bottle and the serum glows; between them it swings out and back, lighting
// the set and sliding a highlight round the glass. A mouse over the stage leans the light towards itself: the pool on
// the wall follows it, a specular stripe rides the glass on its side and the plinth's lit edge catches it.
export function lightAt(q: number, pointer: Pointer | null): LiveLight {
  const sweep = Math.sin(Math.PI * 3 * q);
  const px = pointer?.x ?? 0;
  const py = pointer?.y ?? 0;
  const on = pointer?.on ?? 0;
  const travel = Math.min(1, Math.abs(sweep) / 0.6);
  return {
    pool: [2.4 * sweep + 1.2 * px, 0.85 - 0.3 * py],
    set: 0.75,
    glow: 1,
    glint: [-0.85 * sweep * (1 - 0.6 * on) + 0.55 * px * on, Math.max(0.9 * travel * travel * (3 - 2 * travel), 0.8 * on)],
    sheen: [1.8 * px, 0.9 * on, 1.5],
    haze: 0.014,
    drift: q * 9,
  };
}

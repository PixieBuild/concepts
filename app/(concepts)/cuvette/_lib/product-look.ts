/** What the printed label says. */
export type LabelCopy = {
  name: string;
  strength: string;
  active: string;
  sizeMl: number;
  ph: string;
  pao: string;
  lot: string;
  filled: string;
};

// Light through the serum takes on `liquid.colour`, deepening along its path at `liquid.density` (≈0.05 water-clear
// to ≈1.5 deep amber), so edges stay pale and highlights white: the colour ramp follows from those two numbers. The
// compositor holds a pale tint at a floor so it never washes out to grey, and lets a near-clear serum show the set.
export type BottleLook = {
  id: string;
  label: LabelCopy;
  liquid: { colour: string; density: number };
  ink: string;
  accent: string;
};

export const ENAMEL = "#ecebe6";

/** A stable key for caching anything drawn from a look. */
export function lookKey(look: BottleLook): string {
  const l = look.label;
  return [look.id, l.name, l.strength, l.active, l.sizeMl, l.ph, l.pao, l.lot, l.filled, look.liquid.colour, look.liquid.density, look.ink, look.accent].join("|");
}

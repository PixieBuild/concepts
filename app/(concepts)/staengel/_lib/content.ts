export const BRAND = "stängel";
export const IMAGE_BASE = "/concepts/staengel";
export const ADDRESS = "Weserstraße 38, Neukölln";
export const HOURS = "Tue–Sat, 9–18";

export const LINE = "Stems from the Großmarkt at five, tied by hand before we open at nine.";

export type Stem = { name: string; tone: string; photo?: string };

export const STEMS: Stem[] = [
  { name: "Ranunkel", tone: "#f2a38b" },
  { name: "Mohn", tone: "#e4572e" },
  { name: "Tulpe Brown Sugar", tone: "#c98a4b" },
  { name: "Schneeball", tone: "#c3d49a" },
  { name: "Rittersporn", tone: "#5b7bd5" },
  { name: "Fritillaria", tone: "#6b3b57" },
  { name: "Anemone", tone: "#f4f1ea" },
  { name: "Clematis", tone: "#b79ad8" },
];

export const TODAY: [string, string][] = [
  ["Ranunkel", "3,50"],
  ["Mohn", "4,00"],
  ["Tulpe Brown Sugar", "3,00"],
  ["Schneeball", "6,50"],
];

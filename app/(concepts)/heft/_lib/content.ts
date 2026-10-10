export const BRAND = "Heft";
export const OFFER = "First week free";
export const HOURS = "Open 05:30–22:00, every day";

export const HEADLINE = ["Small classes.", "Real coaches.", "No contract."];
export const INTRO =
  "A strength and conditioning gym in the old tram shed on Kirkstall Road, Leeds. Classes of twelve, a coach on the floor all day, and your first week on us.";

export const NEXT_CLASS = { name: "Barbell strength", time: "18:00", coach: "with Priya", size: 12, booked: 9 };

export type Hold = { label: string; unit?: string; color: string; ink: string; shape: "pill" | "plate" };

const CHALK = "#efeee9";
const COAL = "#121212";

// Competition bumper plate colours, heaviest first.
const PLATES: Hold[] = [
  { label: "25", unit: "kg", color: "#d7262e", ink: CHALK, shape: "plate" },
  { label: "20", unit: "kg", color: "#1f5fbf", ink: CHALK, shape: "plate" },
  { label: "15", unit: "kg", color: "#f2c230", ink: COAL, shape: "plate" },
  { label: "10", unit: "kg", color: "#2f9b57", ink: CHALK, shape: "plate" },
  { label: "5", unit: "kg", color: CHALK, ink: COAL, shape: "plate" },
];

const CLASSES = ["Strength", "Spin", "Boxing", "HIIT", "Kettlebells", "Mobility", "Open gym", "Rowing", "Sauna", "Personal training"];

export const HOLDS: Hold[] = [
  ...CLASSES.flatMap((name, i) => {
    const pill: Hold = { label: name, color: CHALK, ink: COAL, shape: "pill" };
    return i < PLATES.length ? [pill, PLATES[i]] : [pill];
  }),
  { label: "First week free", color: "#d4ff3f", ink: COAL, shape: "pill" },
  { ...PLATES[0], label: "25" },
  { ...PLATES[1], label: "20" },
];

export const BRAND = "Cuvette";
export const IMAGE_BASE = "/concepts/cuvette";
/** Prices, delivery rates and JSON-LD are in euros only; the catalogue warns about a variant priced in anything else. */
export const CURRENCY = "EUR";

export const END_OF_LIFE = [
  { part: "Bottle", material: "Clear glass, 30% recycled", bin: "Glass bank" },
  { part: "Collar", material: "Stainless steel", bin: "Metal recycling" },
  { part: "Bulb", material: "Natural rubber", bin: "General waste" },
  { part: "Carton", material: "FSC board, no lamination", bin: "Paper recycling" },
];

export const POLICY = {
  freeOver: 4000,
  giftOver: 7500,
  gift: "10 ml Hyaluronic 2%",
  /** The product the travel-size gift is a small one of. */
  giftHandle: "hyaluronic",
  vat: 0.23,
  cutoff: "14:00",
  tz: "Europe/Lisbon",
  returnsDays: 30,
  withdrawalDays: 14,
  refundDays: 14,
  sampleMl: 2,
  samples: 2,
  promo: { code: "PORTO10", off: 0.1, appliesTo: "serums" as const },
  rates: {
    standard: { PT: 390, ES: 590, EU: 790 },
    express: { PT: 790, ES: 1490, EU: 1490 },
  },
  transit: {
    standard: { PT: [1, 2], ES: [2, 3], EU: [3, 5] },
    express: { PT: [1, 1], ES: [2, 2], EU: [2, 2] },
  },
  holidays: ["2026-10-05", "2026-11-01", "2026-12-01", "2026-12-08", "2026-12-25", "2027-01-01"],
} as const;

export const COMPANY = {
  legal: "Cuvette Lda.",
  city: "Porto",
  country: "Portugal",
  countryCode: "PT",
  email: "hello@cuvette.example",
  formulator: { name: "Marta", role: "formulation" },
} as const;

export const ANNOUNCEMENT = ["Free delivery over €40", "Two samples with every order", "Ships from Porto in 1 working day"] as const;

export const HELP = {
  delivery: [
    { title: "Dispatch", body: "Monday to Friday from Porto. Order before 14:00 Lisbon time and it leaves the same day. Portuguese public holidays are skipped." },
    { title: "Standard (CTT)", body: "Portugal 1–2 working days, €3.90. Spain 2–3 working days, €5.90. Rest of the EU 3–5 working days, €7.90. Free on orders over €40." },
    { title: "Express", body: "Portugal next working day, €7.90. EU 2 working days, €14.90." },
  ],
  returns: [
    { title: "30-day returns", body: "Send it back within 30 days, opened or not. Returns are free from Portugal; we email a prepaid CTT label." },
    { title: "Your legal right", body: "On top of the EU 14-day right of withdrawal, not instead of it. Refunds go back to the original payment within 14 days of the return arriving." },
    { title: "Lot and recycling", body: "Every carton carries a lot number and fill date. Glass, steel and board all recycle; the rubber bulb goes in general waste." },
  ],
  contact: [
    { title: "Email", body: "hello@cuvette.example. A person in Porto answers within one working day." },
    { title: "Formulation questions", body: "Ask about layering, reactions or ingredients and Marta, our formulator, replies herself." },
  ],
} as const;

/** VAT contained in a VAT-inclusive price, in cents. */
export function vatInside(cents: number, rate: number = POLICY.vat): number {
  return Math.round(cents - cents / (1 + rate));
}

/** What each INCI line is there for, in the voice of the formulator. */
export const INCI_ROLES: Record<string, string> = {
  Aqua: "Water. The base everything else dissolves in.",
  "Ascorbic Acid": "Vitamin C itself, as pure L-ascorbic acid.",
  Ethoxydiglycol: "A solvent that carries the vitamin C into the skin.",
  Propanediol: "A plant-derived humectant that keeps the serum fluid.",
  Glycerin: "Draws water into the skin and holds it there.",
  Tocopherol: "Vitamin E. Steadies the vitamin C.",
  "Laureth-23": "Keeps the oil-soluble vitamin E dissolved in water.",
  "Ferulic Acid": "Extends the antioxidant life of C and E together.",
  Panthenol: "Vitamin B5. Softens and supports the barrier.",
  "Sodium Hyaluronate": "Hyaluronic acid as a salt. Holds water at the surface.",
  "Sodium Hydroxide": "A trace that sets the pH, used up as it does.",
  "Disodium EDTA": "Binds metal traces that would oxidise the vitamin C.",
  Phenoxyethanol: "The preservative, under 1%.",
  Ethylhexylglycerin: "Lets the preservative work at a lower dose.",
  "Pentylene Glycol": "A humectant that also helps the preservative.",
  "Hydrolyzed Sodium Hyaluronate": "Smaller hyaluronic acid that reaches further in.",
  "Sodium Acetylated Hyaluronate": "Hyaluronic acid that clings to the skin for longer.",
  "Hydrolyzed Hyaluronic Acid": "The smallest of the five weights.",
  "Sodium Hyaluronate Crosspolymer": "A fine mesh of hyaluronic acid that sits on top.",
  "Sodium Phytate": "Binds metal traces so the formula stays stable.",
  "Citric Acid": "A trace that sets the pH.",
  Niacinamide: "Vitamin B3, the lead active.",
  "Zinc PCA": "Zinc, for shine and the look of pores.",
  "Xanthan Gum": "Gives the serum its slip.",
  Allantoin: "Soothes.",
  Squalane: "A light oil the skin already makes. Cushions the barrier.",
  "Caprylic/Capric Triglyceride": "A coconut-derived oil that carries the retinal.",
  Retinal: "Retinaldehyde, the lead active, held in capsules.",
  Bisabolol: "From chamomile. Calms redness.",
  "Helianthus Annuus Seed Oil": "Sunflower oil, rich in linoleic acid.",
};

export const GLASS_RETURN = {
  perEnvelope: 5,
  credit: 300,
} as const;

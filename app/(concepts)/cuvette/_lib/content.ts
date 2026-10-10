export const BRAND = "Cuvette";
export const IMAGE_BASE = "/concepts/cuvette";
export const ORIGIN = "Formulated and filled in Porto";
export const ANNOUNCEMENT = "Free delivery over €40 · Two samples with every order";

export type Fact = { name: string; amount: string };

export type Product = {
  slug: string;
  name: string;
  percent: string;
  inci: string;
  line: string;
  benefit: string;
  price: string;
  ph: string;
  facts: Fact[];
  liquid: string;
  card: string;
};

export const PRODUCTS: Product[] = [
  {
    slug: "vitamin-c",
    name: "Vitamin C",
    percent: "15%",
    inci: "L-ascorbic acid",
    line: "L-ascorbic acid with ferulic acid and vitamin E",
    benefit: "Brightens dull skin and fades dark marks. Mornings, before SPF.",
    price: "€34",
    ph: "pH 3.2",
    facts: [
      { name: "L-ascorbic acid", amount: "15%" },
      { name: "Ferulic acid", amount: "0.5%" },
      { name: "Vitamin E", amount: "1%" },
    ],
    liquid: "#e3962c",
    card: "#eadfce",
  },
  {
    slug: "hyaluronic",
    name: "Hyaluronic",
    percent: "2%",
    inci: "Hyaluronic acid",
    line: "Five weights of hyaluronic acid with vitamin B5",
    benefit: "Holds water in the skin all day. Morning and night, on damp skin.",
    price: "€26",
    ph: "pH 6.0",
    facts: [
      { name: "Hyaluronic acid, five weights", amount: "2%" },
      { name: "Panthenol (vitamin B5)", amount: "1%" },
      { name: "Glycerin", amount: "3%" },
    ],
    liquid: "#7fb0e6",
    card: "#e1e2e0",
  },
  {
    slug: "niacinamide",
    name: "Niacinamide",
    percent: "10%",
    inci: "Niacinamide",
    line: "Niacinamide with 1% zinc PCA",
    benefit: "Calms redness and tightens the look of pores. Morning and night.",
    price: "€24",
    ph: "pH 5.8",
    facts: [
      { name: "Niacinamide", amount: "10%" },
      { name: "Zinc PCA", amount: "1%" },
      { name: "Allantoin", amount: "0.2%" },
    ],
    liquid: "#9cc97f",
    card: "#e3e3d6",
  },
];

export const STEPS = [
  { title: "Cleanse, then pat dry.", body: "Actives absorb best on clean, dry skin." },
  { title: "Three drops, pressed in.", body: "Warm them between your fingertips and press into face and neck. No rubbing." },
  { title: "SPF, every morning.", body: "Vitamin C and sunscreen protect better together than either alone." },
];

export const RESULTS = [
  { value: "91%", label: "said skin looked brighter" },
  { value: "84%", label: "saw dark marks fade" },
  { value: "96%", label: "would buy it again" },
];

export const STUDY = "Independent consumer study of Vitamin C 15%, 32 participants, twice daily for four weeks, 2026.";

export const SET = { name: "The morning set", items: "Vitamin C 15% and Hyaluronic 2%", price: "€52", saving: "Save €8" };

export const QUOTE = {
  text: "I stopped buying serums with twelve ingredients. One bottle, one job, and my skin has never looked this even.",
  by: "Inês M., Lisbon",
  product: "Vitamin C 15%",
};

import { POLICY, vatInside } from "./content";
import type { BottleLook } from "./product-look";

/** A Shopify product handle: the URL segment and the key everything else is stored under. */
export type Slug = string;

/** Shots a rendered still can exist for; files are `{product}-{shot}.jpg` (see `_lib/stills.ts`). */
export type Shot =
  | "hero-wide"
  | "hero-tall"
  | "pack"
  | "three-quarter"
  | "label"
  | "label-wide"
  | "drop"
  | "drop-stone"
  | "carton"
  | "thumb"
  | "group"
  | "group-wide";

export type Colour = {
  /** CSS custom property for text in the product's colour; it switches to the paper ink inside `.paper`. */
  cssVar: `--${string}`;
  onDark: string;
  onPaper: string;
  band: string;
  liquid: string;
  /** The colour light takes on through the serum, and how strongly per 26 mm of path; near 0 reads water-clear. */
  tint: string;
  density: number;
};

export type Study = {
  n: number;
  ages: string;
  skin: string;
  use: string;
  weeks: number;
  measure: string;
  year: number;
  results: { value: number; label: string }[];
  note: string;
};

export type SkinType = "Dry" | "Oily" | "Combination" | "Sensitive" | "Normal";

export type Review = {
  id: string;
  name: string;
  city: string;
  skin: SkinType;
  age: string;
  concern: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title: string;
  body: string;
  /** ISO date */
  date: string;
  usedFor: string;
  helpful: number;
  verified: boolean;
  /** Quoted on the home page when no skin type is chosen. */
  home?: boolean;
  reply?: { by: string; role: string; body: string };
};

export type Size = { ml: number; price: number; variantId: string; available: boolean };
export type Purchase = "once" | "subscribe";
export type Daypart = "AM" | "PM";

/** A photo the merchant uploaded to the product in Shopify admin, in admin order. */
export type MerchantImage = { url: string; alt: string; width: number; height: number };

/** One serum's place in a routine, from the `cuvette.routine` metafield. */
export type RoutineSlot = { step: number; dose: string; note: string; sensitive?: { step?: number; note?: string } };

export type RoutineMeta = {
  am?: RoutineSlot;
  pm?: RoutineSlot;
  /** Goes on damp skin, so the cleanser step before it says to leave the face damp. */
  damp: boolean;
  sensitiveSafe: boolean;
  /** Products the routine builder adds alongside this one, and when. */
  pairsWith: { handle: Slug; when: Daypart[] }[];
  note?: string;
  sensitiveNote?: string;
};

export type Rating = { average: number; count: number; display: string };

type CardFields = {
  slug: Slug;
  /** Shopify GID. */
  id: string;
  code: string;
  name: string;
  strength: string;
  /** Lead active, as printed on the label. */
  lead: string;
  /** Full display name, e.g. "Vitamin C 15%". */
  title: string;
  seoTitle: string;
  descriptor: string;
  benefit: string;
  /** Shopify product type, e.g. "Serum" or "Set". */
  type: string;
  tags: string[];
  job: string;
  jobs: string[];
  concerns: string[];
  keywords: string[];
  sizes: Size[];
  /** Cents; set from the variant's compare-at price. */
  compareAt: number | null;
  available: boolean;
  subscribe: { weeks: number; discount: number };
  ph: string;
  texture: string;
  dose: string;
  pao: string;
  when: Daypart[];
  actives: { name: string; amount: string; does: string }[];
  inci: string[];
  lot: { code: string; filled: string };
  colour: Colour;
  gallery: { shot: Shot; caption: string }[];
  histogram: [five: number, four: number, three: number, two: number, one: number];
  /** One per bottle in the shot, composited live from the template; empty when the bottle metafields are missing. */
  looks: BottleLook[];
  images: MerchantImage[];
  /** Local demo products only: pre-baked stills in public/ stand in for the live composite. */
  baked: boolean;
  /** A set's component handles, in the order you use them; empty for a single product. */
  contains: Slug[];
  /** What a set's components cost apart, in cents; null for a single product. */
  separately: number | null;
  routine: RoutineMeta | null;
  /** Editorial slots this product fills, from `cuvette.features`, e.g. "colour-clock". */
  features: string[];
  hero: number | null;
  updatedAt: string;
};

/** Everything a list, a card, the bag or search needs. Safe to send to the client. A set's `parts` are its serums. */
export type ProductCard = CardFields & { parts: ProductCard[] };

/** A product with its page copy: how-to, study, costs, reviews. Server-side; send `toCard(product)` to the client. */
export type Product = CardFields & {
  howTo: { headline: string; steps: string[]; layering: string; avoid: string };
  storage?: { headline: string; body: string; strip: { day: number; label: string; colour: string }[] };
  study: Study | null;
  /** Listed costs in cents, excluding margin and VAT (both derived in `costBar`). */
  costs: { label: string; cents: number }[];
  endOfLife: { part: string; material: string; bin: string }[];
  reviews: Review[];
  formulaNote?: string;
  next?: Slug;
  /** INCI lines that make up the lead active, and the strengths the label states. */
  inciLead?: { lines: string[]; amounts: Record<string, string> };
  /** What each INCI line does, by INCI name; lines left out fall back to the house glossary. */
  inciRoles?: Record<string, string>;
  parts: Product[];
};

export type SetFields = { contains: [Slug, ...Slug[]]; separately: number };

export function isSet<T extends Pick<ProductCard, "contains" | "separately">>(product: T): product is T & SetFields {
  return product.contains.length > 0 && product.separately !== null;
}

const PAGE_ONLY = ["howTo", "storage", "study", "costs", "endOfLife", "reviews", "formulaNote", "next", "inciLead", "inciRoles"] as const;

/** Strips everything a client list doesn't need, so a product can travel to the browser cheaply. */
export function toCard(product: Product): ProductCard {
  const card: Record<string, unknown> = { ...product, parts: product.parts.map(toCard) };
  for (const key of PAGE_ONLY) delete card[key];
  return card as ProductCard;
}

export function priceOf(product: Pick<ProductCard, "sizes">): number {
  return product.sizes[0]?.price ?? 0;
}

export function subscribePrice(product: Pick<ProductCard, "sizes" | "subscribe">): number {
  return Math.round(priceOf(product) * (1 - product.subscribe.discount));
}

/** The one rating function: the visible summary and the JSON-LD both read it. */
export function rating(product: Pick<ProductCard, "histogram">): Rating {
  const count = product.histogram.reduce((sum, n) => sum + n, 0);
  if (count === 0) return { average: 0, count: 0, display: "–" };
  const total = product.histogram.reduce((sum, n, i) => sum + n * (5 - i), 0);
  const average = Math.round((total / count) * 10) / 10;
  return { average, count, display: average.toFixed(1) };
}

/** The serums a product puts on the skin: a set's components, or the product itself. */
export function serumsIn(product: Pick<ProductCard, "slug" | "contains">): Slug[] {
  return product.contains.length ? product.contains : [product.slug];
}

export function sizeLabel(product: ProductCard): string {
  if (isSet(product)) {
    const ml = product.parts.map((p) => p.sizes[0]?.ml ?? 30);
    return ml.every((m) => m === ml[0]) ? `${ml.length} × ${ml[0]} ml` : ml.map((m) => `${m} ml`).join(" + ");
  }
  return `${product.sizes[0]?.ml ?? 30} ml`;
}

export function productHref(slug: Slug): string {
  return `/cuvette/${slug}`;
}

/** Listed costs, then margin and VAT derived so the segments always sum to the price. */
export function costBar(product: Product): { label: string; cents: number; derived?: true }[] {
  const price = priceOf(product);
  const vat = vatInside(price);
  const listed = product.costs.reduce((sum, c) => sum + c.cents, 0);
  return [...product.costs, { label: "Margin", cents: price - vat - listed, derived: true }, { label: `VAT (${POLICY.vat * 100}%)`, cents: vat, derived: true }];
}

/** Serums a shopper can pick as a free sample: single products, in stock, not tagged `no-sample`. */
export function canSample(product: ProductCard): boolean {
  return !isSet(product) && product.available && !product.tags.includes("no-sample") && !product.tags.includes("hidden");
}

/** "Tight or dehydrated" is "tight-or-dehydrated": a concern's id in filters and URLs. */
export function concernId(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** "4 serums and a set", "5 serums, a cleanser and 2 sets": the range counted by Shopify product type. */
export function rangeSummary(products: Pick<ProductCard, "type">[]): string {
  const counts = new Map<string, number>();
  for (const p of products) counts.set(p.type.toLowerCase(), (counts.get(p.type.toLowerCase()) ?? 0) + 1);
  const parts = [...counts].map(([type, n]) => (n === 1 ? `${/^[aeiou]/.test(type) ? "an" : "a"} ${type}` : `${n} ${type}s`));
  return parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}` : (parts[0] ?? "");
}

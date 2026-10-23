import "server-only";

import { concernId, isSet, priceOf, rating, toCard, type Colour, type Product, type ProductCard, type SetFields, type Slug } from "./product";
import { ENAMEL } from "./product-look";
import { CONCERNS, PRODUCTS, type ProductData, type SerumData, type SetData } from "./products";
import { hasBakedStills } from "./stills";

export type SetProduct = Product & SetFields;
export type Concern = { id: string; label: string; products: Slug[] };
export type ProductSort = "featured" | "price-asc" | "price-desc" | "name" | "newest" | "rating";
export type ProductFilter = { tag?: string; type?: string; concern?: string; sort?: ProductSort };

/** Tag that keeps a product reachable by URL and search but out of every list. */
const HIDDEN_TAG = "hidden";
const HERO_MAX = 4;

function fromData<T extends ProductData>(data: T) {
  return {
    ...data,
    compareAt: data.compareAt ?? null,
    features: data.features ?? [],
    photos: data.photos ?? [],
    inci: "inci" in data ? data.inci : [],
    hero: data.hero ?? null,
    routine: data.routine ?? null,
    baked: hasBakedStills(data.slug),
    parts: [],
  };
}

function serum(data: SerumData): Product {
  const { accent, onPaper, liquid, density } = data.colour;
  const colour: Colour = { cssVar: `--p-${data.slug}`, onDark: accent, onPaper, band: accent, liquid, tint: liquid, density };
  const label = { name: data.name, strength: data.strength, active: data.lead, sizeMl: data.sizes[0].ml, ph: data.ph, pao: data.pao, lot: data.lot.code, filled: data.lot.filled };
  return {
    ...fromData(data),
    colour,
    looks: [{ id: data.slug, label, liquid: { colour: liquid, density }, ink: ENAMEL, accent }],
    contains: [],
    separately: null,
  };
}

function set(data: SetData, serums: Map<Slug, Product>): Product {
  const parts = data.contains.map((slug) => {
    const part = serums.get(slug);
    if (!part) throw new Error(`${data.slug} contains "${slug}", which is not a serum in the range`);
    return part;
  });
  return {
    ...fromData(data),
    strength: parts.map((p) => p.strength.replace("%", "")).join(" + "),
    lead: parts.map((p) => p.title).join(" and "),
    ph: [...new Set(parts.map((p) => p.ph))].join(" and "),
    pao: parts[0].pao,
    lot: parts[0].lot,
    colour: { ...parts[0].colour, cssVar: `--p-${data.slug}` },
    looks: parts.flatMap((p) => p.looks),
    parts,
    separately: parts.reduce((sum, p) => sum + priceOf(p), 0),
  };
}

const isSetData = (d: ProductData): d is SetData => "contains" in d;

function build(data: ProductData[]): Product[] {
  const serums = new Map(data.filter((d): d is SerumData => !isSetData(d)).map((d) => [d.slug, serum(d)]));
  return data.map((d) => (isSetData(d) ? set(d, serums) : serums.get(d.slug)!));
}

const CATALOG = build(PRODUCTS);

const listed = (p: Product) => !p.tags.includes(HIDDEN_TAG);

const SORTS: Record<ProductSort, (a: Product, b: Product) => number> = {
  featured: () => 0,
  "price-asc": (a, b) => priceOf(a) - priceOf(b),
  "price-desc": (a, b) => priceOf(b) - priceOf(a),
  name: (a, b) => a.title.localeCompare(b.title),
  newest: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
  rating: (a, b) => rating(b).average - rating(a).average || rating(b).count - rating(a).count,
};

/** The range in its listed order, optionally narrowed. Hidden products are never listed. */
export function listProducts(filter: ProductFilter = {}): Product[] {
  return CATALOG.filter(listed)
    .filter((p) => !filter.tag || p.tags.includes(filter.tag))
    .filter((p) => !filter.type || p.type.toLowerCase() === filter.type.toLowerCase())
    .filter((p) => !filter.concern || p.concerns.some((c) => concernId(c) === filter.concern) || p.parts.some((part) => part.concerns.some((c) => concernId(c) === filter.concern)))
    .sort(SORTS[filter.sort ?? "featured"]);
}

/** Every product, listed or not: what gets a page. */
export function allProducts(): Product[] {
  return CATALOG;
}

/** Any product in the range, listed or not; null when there is none (the caller decides on notFound()). */
export function getProduct(slug: string): Product | null {
  return CATALOG.find((p) => p.slug === slug) ?? null;
}

/** The home stage's switcher: products with a `hero` place, in that order, at most four; each needs a bottle. */
export function heroProducts(): Product[] {
  return listProducts()
    .filter((p) => p.hero !== null && !isSet(p) && p.looks.length > 0)
    .sort((a, b) => (a.hero ?? 99) - (b.hero ?? 99))
    .slice(0, HERO_MAX);
}

/** Serums with a routine: what the routine builder can put in a routine. */
export function routineProducts(): Product[] {
  return listProducts().filter((p) => !isSet(p) && p.routine);
}

/** Sets, each with its "bought separately" price. */
export function bundles(): SetProduct[] {
  return listProducts().filter((p): p is SetProduct => isSet(p));
}

/** The skin concerns, in their order, that a listed serum answers, with those serums. */
export function concerns(): Concern[] {
  const serums = listProducts().filter((p) => !isSet(p));
  return CONCERNS.map((label) => ({ id: concernId(label), label, products: serums.filter((p) => p.concerns.includes(label)).map((p) => p.slug) })).filter(
    (c) => c.products.length > 0,
  );
}

export function productTypes(): { type: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of listProducts()) counts.set(p.type, (counts.get(p.type) ?? 0) + 1);
  return [...counts].map(([type, count]) => ({ type, count }));
}

/** Products that fill an editorial slot (`features`), in range order. */
export function featuredProducts(slot: string): Product[] {
  return listProducts().filter((p) => p.features.includes(slot));
}

/** The one product for a slot: the one that fills it, else the first listed product that `fits`. */
export function featuredProduct(slot: string, fits: (p: Product) => boolean = () => true): Product | null {
  const all = listProducts();
  return all.find((p) => p.features.includes(slot) && fits(p)) ?? all.find(fits) ?? null;
}

/** Every product as a client card, for the catalogue provider: the bag, search, header and checkout read these. */
export function catalogCards(): ProductCard[] {
  return CATALOG.map(toCard);
}

import "server-only";

import { cache } from "react";

import { concernId, isSet, priceOf, rating, toCard, type Product, type ProductCard, type SetFields, type Slug } from "./product";
import { productFromShopify, warn, warnStore, type Mapped } from "./shopify/map";
import { CONCERN_TYPE } from "./shopify/storefront";
import { catalogSource, fetchCollectionNodes, fetchConcernNodes, fetchProductNode, fetchProductNodes } from "./shopify/source";
import { hasBakedStills } from "./stills";

export { catalogSource };

export type SetProduct = Product & SetFields;
export type Concern = { id: string; label: string; products: Slug[] };
export type Collection = { handle: string; title: string; description: string; products: Slug[] };
export type ProductSort = "featured" | "price-asc" | "price-desc" | "name" | "newest" | "rating";
export type ProductFilter = { tag?: string; type?: string; concern?: string; collection?: string; sort?: ProductSort };

/** Tag that keeps a product reachable by URL and search but out of every list. */
export const HIDDEN_TAG = "hidden";
export const HERO_TAG = "hero";
export const HERO_MAX = 4;

function mapAll(nodes: Awaited<ReturnType<typeof fetchProductNodes>>): Mapped[] {
  return nodes.flatMap((node) => {
    try {
      return [productFromShopify(node)];
    } catch (error) {
      // One half-set-up product in admin must not take the shop down.
      warn(node.handle, `skipped: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  });
}

/** A set draws its bottle, strength, colour and "bought separately" price from its components. */
function resolveSet(set: Product, bySlug: Map<Slug, Product>): Product | null {
  const parts = set.contains.flatMap((slug) => bySlug.get(slug) ?? []);
  if (parts.length < set.contains.length) warn(set.slug, `bundle component(s) not in the catalogue: ${set.contains.filter((s) => !bySlug.has(s)).join(", ")}`);
  if (!parts.length) return null;
  const unique = (values: string[]) => [...new Set(values.filter(Boolean))];
  return {
    ...set,
    contains: parts.map((p) => p.slug),
    parts,
    looks: parts.flatMap((p) => p.looks),
    separately: parts.reduce((sum, p) => sum + priceOf(p), 0),
    strength: set.strength || parts.map((p) => p.strength.replace("%", "")).join(" + "),
    lead: set.lead || parts.map((p) => p.title).join(" and "),
    ph: set.ph || unique(parts.map((p) => p.ph)).join(" and "),
    pao: set.pao || parts[0].pao,
    lot: set.lot.code ? set.lot : parts[0].lot,
    colour: set.looks.length ? set.colour : { ...parts[0].colour, cssVar: set.colour.cssVar },
    when: set.when.length ? set.when : (unique(parts.flatMap((p) => p.when)) as Product["when"]),
    actives: set.actives.length ? set.actives : parts.flatMap((p) => p.actives.slice(0, 1)),
  };
}

type CuratedConcern = { id: string; label: string; matches: Set<string>; position: number };

/** The `cuvette_concern` metaobjects. Empty (concerns are then taken as products name them) if the store has none. */
const curatedConcerns = cache(async (): Promise<CuratedConcern[]> => {
  let nodes: Awaited<ReturnType<typeof fetchConcernNodes>> = [];
  try {
    nodes = await fetchConcernNodes();
  } catch (error) {
    warnStore(`concern metaobjects unreadable, using product concerns as named: ${error instanceof Error ? error.message : String(error)}`);
  }
  return nodes
    .flatMap((node, index) => {
      const field = (key: string) => node.fields.find((f) => f.key === key)?.value ?? null;
      const label = field("label")?.trim();
      if (!label) return [];
      let aliases: unknown = [];
      try {
        aliases = JSON.parse(field("aliases") ?? "[]");
      } catch {
        warnStore(`${CONCERN_TYPE} "${node.handle}": aliases must be a list of text`);
      }
      const names = [node.handle, label, ...(Array.isArray(aliases) ? aliases.filter((a): a is string => typeof a === "string") : [])];
      // The id follows the label, since client code matches a product's concern labels by concernId(label).
      return [{ id: concernId(label), label, matches: new Set(names.map(concernId)), position: Number(field("position")) || 1000 + index }];
    })
    .sort((a, b) => a.position - b.position);
});

/** Each product's concerns as the curated labels; a concern the list doesn't know is dropped, so filters stay short. */
function curate(product: Product, curated: CuratedConcern[]): Product {
  if (!curated.length) return product;
  const labels = product.concerns.map((named) => {
    const match = curated.find((c) => c.matches.has(concernId(named)));
    if (!match) warn(product.slug, `concern "${named}" is not a ${CONCERN_TYPE} (label or alias); left out of filters`);
    return match?.label;
  });
  return { ...product, concerns: [...new Set(labels.filter((l): l is string => !!l))] };
}

/** Static routes beside /cuvette/[product]; a product with one of these handles can never be reached. */
const RESERVED_HANDLES = new Set(["shop", "checkout", "render", "api", "sitemap.xml", "opengraph-image"]);

function resolve(mapped: Mapped[], curated: CuratedConcern[]): Product[] {
  for (const { product } of mapped) if (RESERVED_HANDLES.has(product.slug)) warn(product.slug, "this handle is a site route, so its product page is unreachable; change the handle");
  const sorted = [...mapped].sort((a, b) => a.position - b.position || a.createdAt.localeCompare(b.createdAt)).map((m) => m.product);
  const singles = sorted.map((p) => ({ ...curate(p, curated), baked: hasBakedStills(p.slug) }));
  const bySlug = new Map(singles.filter((p) => !p.contains.length).map((p) => [p.slug, p]));
  return singles.flatMap((p) => (p.contains.length ? (resolveSet(p, bySlug) ?? []) : [p]));
}

/** The whole catalogue, fetched once per request (and cached across requests by tag, see shopify/storefront.ts). */
const loadCatalog = cache(async (): Promise<Product[]> => {
  const [nodes, curated] = await Promise.all([fetchProductNodes(), curatedConcerns()]);
  return resolve(mapAll(nodes), curated);
});

const listed = (p: Product) => !p.tags.includes(HIDDEN_TAG);

const SORTS: Record<ProductSort, (a: Product, b: Product) => number> = {
  featured: () => 0,
  "price-asc": (a, b) => priceOf(a) - priceOf(b),
  "price-desc": (a, b) => priceOf(b) - priceOf(a),
  name: (a, b) => a.title.localeCompare(b.title),
  newest: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
  rating: (a, b) => rating(b).average - rating(a).average || rating(b).count - rating(a).count,
};

/** The range in merchant order (`cuvette.position`), optionally narrowed. Hidden products are never listed. */
export async function listProducts(filter: ProductFilter = {}): Promise<Product[]> {
  const all = (await loadCatalog()).filter(listed);
  const inCollection = filter.collection ? new Set((await collections()).find((c) => c.handle === filter.collection)?.products ?? []) : null;
  return all
    .filter((p) => !filter.tag || p.tags.includes(filter.tag))
    .filter((p) => !filter.type || p.type.toLowerCase() === filter.type.toLowerCase())
    .filter((p) => !filter.concern || p.concerns.some((c) => concernId(c) === filter.concern) || p.parts.some((part) => part.concerns.some((c) => concernId(c) === filter.concern)))
    .filter((p) => !inCollection || inCollection.has(p.slug))
    .sort(SORTS[filter.sort ?? "featured"]);
}

/** Any product the store has, listed or not; null when there is none (the caller decides on notFound()). */
export async function getProduct(handle: string): Promise<Product | null> {
  const known = (await loadCatalog()).find((p) => p.slug === handle);
  if (known) return known;
  // Not in the cached listing yet (a product created since): ask for it alone, then resolve it against the catalogue.
  if (catalogSource() === "mock") return null;
  const node = await fetchProductNode(handle);
  const [fresh] = node ? mapAll([node]) : [];
  if (!fresh) return null;
  const product = { ...curate(fresh.product, await curatedConcerns()), baked: hasBakedStills(handle) };
  if (!product.contains.length) return product;
  const singles = (await loadCatalog()).filter((p) => !p.contains.length);
  return resolveSet(product, new Map(singles.map((p) => [p.slug, p])));
}

/** The home stage's switcher: products tagged `hero`, by `cuvette.hero_order`, at most four; each needs a bottle. */
export async function heroProducts(): Promise<Product[]> {
  return (await listProducts({ tag: HERO_TAG }))
    .filter((p) => !isSet(p) && p.looks.length > 0)
    .sort((a, b) => (a.hero ?? 99) - (b.hero ?? 99))
    .slice(0, HERO_MAX);
}

/** Serums with a `cuvette.routine` metafield: what the routine builder can put in a routine. */
export async function routineProducts(): Promise<Product[]> {
  return (await listProducts()).filter((p) => !isSet(p) && p.routine);
}

/** Sets, from the `cuvette.components` metafield, each with its "bought separately" price. */
export async function bundles(): Promise<SetProduct[]> {
  return (await listProducts()).filter((p): p is SetProduct => isSet(p));
}

/** The curated skin concerns (`cuvette_concern` metaobjects, in their order) that a listed serum answers, with those serums. */
export async function concerns(): Promise<Concern[]> {
  const [products, curated] = await Promise.all([listProducts(), curatedConcerns()]);
  const out = new Map<string, Concern>(curated.map(({ id, label }) => [id, { id, label, products: [] }]));
  for (const p of products) {
    if (isSet(p)) continue;
    for (const label of p.concerns) {
      const id = concernId(label);
      const entry = out.get(id) ?? { id, label, products: [] };
      entry.products.push(p.slug);
      out.set(id, entry);
    }
  }
  return [...out.values()].filter((c) => c.products.length > 0);
}

export async function productTypes(): Promise<{ type: string; count: number }[]> {
  const counts = new Map<string, number>();
  for (const p of await listProducts()) counts.set(p.type, (counts.get(p.type) ?? 0) + 1);
  return [...counts].map(([type, count]) => ({ type, count }));
}

export const collections = cache(async (): Promise<Collection[]> => {
  const nodes = await fetchCollectionNodes();
  return nodes.map((c) => ({ handle: c.handle, title: c.title, description: c.description, products: c.products.nodes.map((p) => p.handle) }));
});

/** Products the merchant put in an editorial slot (`cuvette.features`), in range order. */
export async function featuredProducts(slot: string): Promise<Product[]> {
  return (await listProducts()).filter((p) => p.features.includes(slot));
}

/** The one product for a slot: the merchant's pick, else the first listed product that `fits`. */
export async function featuredProduct(slot: string, fits: (p: Product) => boolean = () => true): Promise<Product | null> {
  const all = await listProducts();
  return all.find((p) => p.features.includes(slot) && fits(p)) ?? all.find(fits) ?? null;
}

/** Every product as a client card, for the catalogue provider: the bag, search, header and checkout read these. */
export async function catalogCards(): Promise<ProductCard[]> {
  return (await loadCatalog()).map(toCard);
}

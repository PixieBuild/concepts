import type { Slug } from "../../_lib/product";

export const SORTS = [
  { id: "featured", label: "Featured" },
  { id: "price-asc", label: "Price, low to high" },
  { id: "price-desc", label: "Price, high to low" },
  { id: "newest", label: "Newest" },
] as const;

export type ShopSort = (typeof SORTS)[number]["id"];

/** One filter option and the products it keeps, as the catalogue's own `listProducts(filter)` decided. */
export type Facet = { id: string; label: string; slugs: Slug[] };

export type ShopData = {
  orders: Record<ShopSort, Slug[]>;
  concerns: Facet[];
  types: Facet[];
};

export type ShopQuery = { concern: string | null; type: string | null; sort: ShopSort };

export const DEFAULT_QUERY: ShopQuery = { concern: null, type: null, sort: "featured" };

type Params = { get: (key: string) => string | null };

/** Reads `?concern=&type=&sort=`, dropping any value the catalogue doesn't know so a stale link still shows the shop. */
export function parseQuery(params: Params, data: ShopData): ShopQuery {
  const pick = (key: string, facets: Facet[]) => {
    const value = params.get(key);
    return facets.some((f) => f.id === value) ? value : null;
  };
  const sort = SORTS.find((s) => s.id === params.get("sort"))?.id ?? "featured";
  return { concern: pick("concern", data.concerns), type: pick("type", data.types), sort };
}

export function queryHref(query: ShopQuery): string {
  const params = new URLSearchParams();
  if (query.concern) params.set("concern", query.concern);
  if (query.type) params.set("type", query.type);
  if (query.sort !== "featured") params.set("sort", query.sort);
  const search = params.toString();
  return `/cuvette/shop${search ? `?${search}` : ""}`;
}

export function applyQuery(data: ShopData, query: ShopQuery): Slug[] {
  const keep = (facets: Facet[], id: string | null) => (id ? new Set(facets.find((f) => f.id === id)?.slugs) : null);
  const concern = keep(data.concerns, query.concern);
  const type = keep(data.types, query.type);
  return data.orders[query.sort].filter((slug) => (!concern || concern.has(slug)) && (!type || type.has(slug)));
}

export function isFiltered(query: ShopQuery): boolean {
  return !!(query.concern || query.type);
}

/** "Serum" → "Serums", "Brush" → "Brushes": Shopify product types read as a shelf. */
export function plural(type: string): string {
  return /(s|sh|ch|x)$/i.test(type) ? `${type}es` : `${type}s`;
}

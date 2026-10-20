import { canSample, isSet, type ProductCard, type SetFields, type Slug } from "./product";

export type SetCard = ProductCard & SetFields;

/** The catalogue as the browser sees it: client cards, handed down from the layout. */
export type ClientCatalog = {
  /** Every product, listed or hidden, in range order. */
  products: ProductCard[];
  /** What lists show: everything not tagged `hidden`. */
  listed: ProductCard[];
  get: (slug: Slug) => ProductCard | undefined;
  bundles: SetCard[];
  /** Serums a shopper can take a free sample of. */
  samples: ProductCard[];
};

export function makeCatalog(products: ProductCard[]): ClientCatalog {
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const listed = products.filter((p) => !p.tags.includes("hidden"));
  return {
    products,
    listed,
    get: (slug) => bySlug.get(slug),
    bundles: listed.filter((p): p is SetCard => isSet(p)),
    samples: listed.filter(canSample),
  };
}

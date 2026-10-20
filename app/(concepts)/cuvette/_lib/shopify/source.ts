import "server-only";

import mock from "./mock-store.json";
import {
  COLLECTION_PRODUCTS_QUERY,
  COLLECTIONS_QUERY,
  COLLECTIONS_TAG,
  CONCERNS_QUERY,
  CONCERNS_TAG,
  PRODUCTS_QUERY,
  PRODUCTS_TAG,
  PRODUCT_QUERY,
  productTag,
  storeCredentials,
  storefront,
  type CollectionProductsResponse,
  type CollectionsResponse,
  type ConcernsResponse,
  type ProductResponse,
  type ProductsResponse,
  type StorefrontCollection,
  type StorefrontConcern,
  type StorefrontProduct,
} from "./storefront";

const MOCK = mock as unknown as { data: ProductsResponse & CollectionsResponse & ConcernsResponse };

/** Live as soon as both Storefront env vars are set; the local mock store otherwise. */
export function catalogSource(): "shopify" | "mock" {
  return storeCredentials() ? "shopify" : "mock";
}

const PAGE = 100;

export async function fetchProductNodes(): Promise<StorefrontProduct[]> {
  if (catalogSource() === "mock") return MOCK.data.products.nodes;
  const nodes: StorefrontProduct[] = [];
  let after: string | null = null;
  do {
    const { products }: ProductsResponse = await storefront<ProductsResponse>(PRODUCTS_QUERY, { first: PAGE, after }, { tags: [PRODUCTS_TAG] });
    nodes.push(...products.nodes);
    after = products.pageInfo.hasNextPage ? products.pageInfo.endCursor : null;
  } while (after);
  return nodes;
}

export async function fetchProductNode(handle: string): Promise<StorefrontProduct | null> {
  if (catalogSource() === "mock") return MOCK.data.products.nodes.find((node) => node.handle === handle) ?? null;
  const { product } = await storefront<ProductResponse>(PRODUCT_QUERY, { handle }, { tags: [PRODUCTS_TAG, productTag(handle)] });
  return product;
}

const COLLECTION_TAGS = { tags: [COLLECTIONS_TAG, PRODUCTS_TAG] };

async function restOfCollection(collection: StorefrontCollection): Promise<StorefrontCollection> {
  const handles = [...collection.products.nodes];
  let after = collection.products.pageInfo?.hasNextPage ? collection.products.pageInfo.endCursor : null;
  while (after) {
    const { collection: page }: CollectionProductsResponse = await storefront<CollectionProductsResponse>(
      COLLECTION_PRODUCTS_QUERY,
      { handle: collection.handle, after },
      COLLECTION_TAGS,
    );
    if (!page) break;
    handles.push(...page.products.nodes);
    after = page.products.pageInfo.hasNextPage ? page.products.pageInfo.endCursor : null;
  }
  return { ...collection, products: { nodes: handles } };
}

export async function fetchCollectionNodes(): Promise<StorefrontCollection[]> {
  if (catalogSource() === "mock") return MOCK.data.collections.nodes;
  const nodes: StorefrontCollection[] = [];
  let after: string | null = null;
  do {
    const { collections }: CollectionsResponse = await storefront<CollectionsResponse>(COLLECTIONS_QUERY, { after }, COLLECTION_TAGS);
    nodes.push(...collections.nodes);
    after = collections.pageInfo?.hasNextPage ? collections.pageInfo.endCursor : null;
  } while (after);
  return Promise.all(nodes.map(restOfCollection));
}

/** The merchant's curated `cuvette_concern` metaobjects; empty when the store has not defined any. */
export async function fetchConcernNodes(): Promise<StorefrontConcern[]> {
  if (catalogSource() === "mock") return MOCK.data.concerns.nodes;
  const { concerns } = await storefront<ConcernsResponse>(CONCERNS_QUERY, {}, { tags: [CONCERNS_TAG] });
  return concerns?.nodes ?? [];
}

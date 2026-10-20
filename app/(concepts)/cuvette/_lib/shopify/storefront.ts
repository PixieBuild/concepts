import "server-only";

// Pinned so a Shopify release never changes a response under us. Shopify supports a version for 12 months: bump it yearly.
export const API_VERSION = "2026-10";
export const METAFIELD_NAMESPACE = "cuvette";

export const METAFIELD_KEYS = [
  "strength",
  "active",
  "size_ml",
  "ph",
  "pao",
  "lot",
  "filled",
  "liquid_colour",
  "liquid_density",
  "label_accent",
  "label_ink",
  "ink_on_paper",
  "editorial",
  "routine",
  "components",
  "hero_order",
  "position",
  "features",
] as const;

export type MetafieldKey = (typeof METAFIELD_KEYS)[number];

/** Every product query is tagged with this, so one webhook refreshes the whole catalogue. */
export const PRODUCTS_TAG = "cuvette:products";
export const COLLECTIONS_TAG = "cuvette:collections";
export const CONCERNS_TAG = "cuvette:concerns";
export const productTag = (handle: string) => `cuvette:product:${handle}`;
/** Fallback for a missed webhook: nothing is older than this. */
export const REVALIDATE_SECONDS = 3600;

export type Money = { amount: string; currencyCode: string };

export type StorefrontMetafield = {
  namespace: string;
  key: string;
  type: string;
  value: string;
  references: { nodes: ({ __typename?: string; id?: string; handle?: string } | null)[] } | null;
} | null;

export type StorefrontImage = { url: string; altText: string | null; width: number | null; height: number | null };

export type StorefrontMedia =
  | { mediaContentType: "IMAGE"; alt: string | null; image: StorefrontImage | null }
  | { mediaContentType: "VIDEO" | "EXTERNAL_VIDEO" | "MODEL_3D"; alt: string | null };

export type StorefrontVariant = {
  id: string;
  title: string;
  sku: string | null;
  availableForSale: boolean;
  price: Money;
  compareAtPrice: Money | null;
  selectedOptions: { name: string; value: string }[];
};

export type StorefrontProduct = {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  productType: string;
  vendor: string;
  tags: string[];
  availableForSale: boolean;
  createdAt: string;
  updatedAt: string;
  seo: { title: string | null; description: string | null };
  priceRange: { minVariantPrice: Money; maxVariantPrice: Money };
  featuredImage: StorefrontImage | null;
  variants: { nodes: StorefrontVariant[] };
  media: { nodes: StorefrontMedia[] };
  metafields: StorefrontMetafield[];
};

type PageInfo = { hasNextPage: boolean; endCursor: string | null };

export type StorefrontCollection = {
  id: string;
  handle: string;
  title: string;
  description: string;
  products: { pageInfo?: PageInfo; nodes: { handle: string }[] };
};

/** A `cuvette_concern` metaobject: the curated list of skin concerns the shop filters and the routine builder offer. */
export type StorefrontConcern = { handle: string; fields: { key: string; value: string | null }[] };

export type ProductsResponse = { products: { pageInfo: PageInfo; nodes: StorefrontProduct[] } };
export type ProductResponse = { product: StorefrontProduct | null };
export type CollectionsResponse = { collections: { pageInfo?: PageInfo; nodes: StorefrontCollection[] } };
export type CollectionProductsResponse = { collection: { products: { pageInfo: PageInfo; nodes: { handle: string }[] } } | null };
export type ConcernsResponse = { concerns: { nodes: StorefrontConcern[] } };

const IDENTIFIERS = METAFIELD_KEYS.map((key) => `{ namespace: "${METAFIELD_NAMESPACE}", key: "${key}" }`).join(", ");

const PRODUCT_FIELDS = /* GraphQL */ `
  fragment CuvetteProduct on Product {
    id
    handle
    title
    description
    descriptionHtml
    productType
    vendor
    tags
    availableForSale
    createdAt
    updatedAt
    seo { title description }
    priceRange { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } }
    featuredImage { url altText width height }
    variants(first: 10) {
      nodes {
        id
        title
        sku
        availableForSale
        price { amount currencyCode }
        compareAtPrice { amount currencyCode }
        selectedOptions { name value }
      }
    }
    media(first: 20) {
      nodes {
        mediaContentType
        alt
        ... on MediaImage { image { url altText width height } }
      }
    }
    metafields(identifiers: [${IDENTIFIERS}]) {
      namespace
      key
      type
      value
      references(first: 10) { nodes { __typename ... on Product { id handle } } }
    }
  }
`;

export const PRODUCTS_QUERY = /* GraphQL */ `
  query CuvetteProducts($first: Int!, $after: String) {
    products(first: $first, after: $after, sortKey: CREATED_AT) {
      pageInfo { hasNextPage endCursor }
      nodes { ...CuvetteProduct }
    }
  }
  ${PRODUCT_FIELDS}
`;

export const PRODUCT_QUERY = /* GraphQL */ `
  query CuvetteProduct($handle: String!) {
    product(handle: $handle) { ...CuvetteProduct }
  }
  ${PRODUCT_FIELDS}
`;

export const COLLECTIONS_QUERY = /* GraphQL */ `
  query CuvetteCollections($after: String) {
    collections(first: 100, after: $after, sortKey: TITLE) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id handle title description
        products(first: 250) { pageInfo { hasNextPage endCursor } nodes { handle } }
      }
    }
  }
`;

export const COLLECTION_PRODUCTS_QUERY = /* GraphQL */ `
  query CuvetteCollectionProducts($handle: String!, $after: String) {
    collection(handle: $handle) {
      products(first: 250, after: $after) { pageInfo { hasNextPage endCursor } nodes { handle } }
    }
  }
`;

export const CONCERN_TYPE = "cuvette_concern";

export const CONCERNS_QUERY = /* GraphQL */ `
  query CuvetteConcerns {
    concerns: metaobjects(type: "${CONCERN_TYPE}", first: 50) {
      nodes { handle fields { key value } }
    }
  }
`;

/** For a real checkout later: Shopify's own cart, which hands back a hosted `checkoutUrl`. */
export const CART_CREATE_MUTATION = /* GraphQL */ `
  mutation CuvetteCartCreate($lines: [CartLineInput!]!, $note: String) {
    cartCreate(input: { lines: $lines, note: $note }) {
      cart { id checkoutUrl totalQuantity cost { totalAmount { amount currencyCode } } }
      userErrors { field message }
    }
  }
`;

export type CartLineInput = { merchandiseId: string; quantity: number; sellingPlanId?: string };
export type CartCreateResponse = {
  cartCreate: {
    cart: { id: string; checkoutUrl: string; totalQuantity: number; cost: { totalAmount: Money } } | null;
    userErrors: { field: string[] | null; message: string }[];
  };
};

export function storeCredentials(): { domain: string; token: string } | null {
  const domain = process.env.SHOPIFY_STORE_DOMAIN?.trim();
  const token = process.env.SHOPIFY_STOREFRONT_TOKEN?.trim();
  return domain && token ? { domain, token } : null;
}

type Options = { tags?: string[]; cache?: "force-cache" | "no-store" };

const TIMEOUT_MS = 8000;
const retryable = (status: number) => status === 429 || status >= 500;
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function post(url: string, init: RequestInit): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (attempt === 0 && retryable(response.status)) {
        await pause(Math.min(Number(response.headers.get("retry-after")) * 1000 || 500, 2000));
        continue;
      }
      return response;
    } catch (error) {
      // A timeout is not retried: a second 8 s wait would hang the render for longer than an error page.
      if (attempt > 0 || (error instanceof Error && error.name === "TimeoutError")) throw error;
      await pause(500);
    }
  }
}

/** One typed GraphQL call. Reads are cached under `tags` (POST is only cached when asked, so it always is here). */
export async function storefront<T>(query: string, variables: Record<string, unknown> = {}, { tags = [], cache = "force-cache" }: Options = {}): Promise<T> {
  const store = storeCredentials();
  if (!store) throw new Error("SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_TOKEN are not set");
  const response = await post(`https://${store.domain}/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "content-type": "application/json", "X-Shopify-Storefront-Access-Token": store.token },
    body: JSON.stringify({ query, variables }),
    cache,
    ...(cache === "force-cache" && { next: { tags, revalidate: REVALIDATE_SECONDS } }),
  });
  if (!response.ok) throw new Error(`Storefront API ${response.status} ${response.statusText}`);
  const body = (await response.json()) as { data?: T | null; errors?: { message: string }[] };
  const errors = body.errors?.map((e) => e.message).join("; ");
  if (!body.data) throw new Error(`Storefront API: ${errors || "no data"}`);
  // A field the token can't read (a missing scope, a metafield without storefront access) nulls that field only.
  if (errors) console.warn(`[cuvette catalog] Storefront API returned partial data: ${errors}`);
  return body.data;
}

/** Shopify's hosted checkout for these variant lines. Not wired in: the demo checkout stays on the site. */
export async function createCart(lines: CartLineInput[], note?: string) {
  const data = await storefront<CartCreateResponse>(CART_CREATE_MUTATION, { lines, note }, { cache: "no-store" });
  const { cart, userErrors } = data.cartCreate;
  if (!cart) throw new Error(userErrors.map((e) => e.message).join("; ") || "cartCreate returned no cart");
  return cart;
}

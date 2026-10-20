import { createHmac, timingSafeEqual } from "node:crypto";

import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";

import { COLLECTIONS_TAG, CONCERNS_TAG, PRODUCTS_TAG, productTag } from "../../../_lib/shopify/storefront";

const PRODUCT_TOPICS = new Set(["products/create", "products/update", "products/delete"]);
const COLLECTION_TOPICS = new Set(["collections/create", "collections/update", "collections/delete"]);
const INVENTORY_TOPICS = new Set(["inventory_levels/update", "inventory_items/update"]);
const METAOBJECT_TOPICS = new Set(["metaobjects/create", "metaobjects/update", "metaobjects/delete"]);

/** Shopify signs the raw body (base64 HMAC-SHA256, X-Shopify-Hmac-Sha256) with the secret SHOPIFY-CONNECT.md §5 names. */
function verified(body: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(body, "utf8").digest();
  const given = Buffer.from(signature, "base64");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

// Webhook target for products/*, collections/*, inventory_levels/update and metaobjects/*. Expires the catalogue's cached Storefront
// reads at once, so the change shows on the next request rather than after the hourly fallback.
export async function POST(request: NextRequest) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) return Response.json({ ok: false, error: "SHOPIFY_WEBHOOK_SECRET is not set" }, { status: 503 });

  const body = await request.text();
  if (!verified(body, request.headers.get("x-shopify-hmac-sha256"), secret)) return Response.json({ ok: false }, { status: 401 });

  const topic = request.headers.get("x-shopify-topic") ?? "";
  const tags: string[] = [];
  if (PRODUCT_TOPICS.has(topic)) {
    tags.push(PRODUCTS_TAG, COLLECTIONS_TAG);
    const handle = (JSON.parse(body) as { handle?: unknown }).handle;
    if (typeof handle === "string") tags.push(productTag(handle));
  } else if (COLLECTION_TOPICS.has(topic)) {
    tags.push(COLLECTIONS_TAG);
  } else if (INVENTORY_TOPICS.has(topic)) {
    // The payload names an inventory item, not a product, so the whole listing refreshes its availability.
    tags.push(PRODUCTS_TAG);
  } else if (METAOBJECT_TOPICS.has(topic)) {
    tags.push(CONCERNS_TAG);
  }

  // Shopify retries anything but a 2xx, so an unrelated topic is acknowledged rather than refused.
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  return Response.json({ ok: true, topic, revalidated: tags });
}

"use server";

import { z } from "zod";

import { catalogSource } from "../../_lib/catalog";
import { storefront } from "../../_lib/shopify/storefront";

const VARIANT = /^gid:\/\/shopify\/ProductVariant\/\d+$/;

const requestSchema = z.object({
  lines: z
    .array(
      z.object({
        variantId: z.string().regex(VARIANT),
        qty: z.number().int().min(1).max(99),
        purchase: z.enum(["once", "subscribe"]),
        weeks: z.number().int().min(1).max(52),
        title: z.string().max(120),
      }),
    )
    .min(1)
    .max(30),
  samples: z.array(z.string().max(120)).max(5),
  note: z.string().max(500),
  promo: z.string().max(40).nullable(),
});

export type ShopifyCheckoutRequest = z.input<typeof requestSchema>;
export type ShopifyCheckoutResult = { ok: true; url: string } | { ok: false; error: string };

const SELLING_PLANS_QUERY = /* GraphQL */ `
  query CuvetteSellingPlans($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on ProductVariant {
        id
        sellingPlanAllocations(first: 10) {
          nodes { sellingPlan { id name options { name value } } }
        }
      }
    }
  }
`;

type SellingPlan = { id: string; name: string; options: { name: string | null; value: string | null }[] };
type SellingPlansResponse = {
  nodes: ({ id?: string; sellingPlanAllocations?: { nodes: { sellingPlan: SellingPlan }[] } } | null)[];
};

const CART_CREATE = /* GraphQL */ `
  mutation CuvetteCheckout($input: CartInput!) {
    cartCreate(input: $input) {
      cart { checkoutUrl }
      userErrors { message }
    }
  }
`;

type CartCreateResponse = { cartCreate: { cart: { checkoutUrl: string } | null; userErrors: { message: string }[] } };

/** The plan whose name or options say "every N weeks"; the only plan when there is just one. */
function planFor(plans: SellingPlan[], weeks: number): string | null {
  const says = (text: string | null) => !!text && new RegExp(`\\b${weeks}\\s*-?\\s*weeks?\\b`, "i").test(text);
  const match = plans.find((p) => says(p.name) || p.options.some((o) => says(o.value)));
  return match?.id ?? (plans.length === 1 ? plans[0].id : null);
}

async function sellingPlans(variantIds: string[]): Promise<Map<string, SellingPlan[]>> {
  if (!variantIds.length) return new Map();
  const { nodes } = await storefront<SellingPlansResponse>(SELLING_PLANS_QUERY, { ids: variantIds }, { cache: "no-store" });
  return new Map(nodes.flatMap((n) => (n?.id ? [[n.id, n.sellingPlanAllocations?.nodes.map((a) => a.sellingPlan) ?? []]] : [])));
}

/** Hands the bag to Shopify's hosted checkout: one cart, with samples and the gift note riding along as cart data. */
export async function startShopifyCheckout(request: ShopifyCheckoutRequest): Promise<ShopifyCheckoutResult> {
  if (catalogSource() !== "shopify") return { ok: false, error: "This shop isn't connected to Shopify." };
  const parsed = requestSchema.safeParse(request);
  if (!parsed.success) return { ok: false, error: "Your bag couldn't be read. Open it and try again." };
  const { lines, samples, note, promo } = parsed.data;

  try {
    const subscribed = lines.filter((l) => l.purchase === "subscribe");
    const plans = await sellingPlans([...new Set(subscribed.map((l) => l.variantId))]);
    const input = [];
    for (const line of lines) {
      const sellingPlanId = line.purchase === "subscribe" ? planFor(plans.get(line.variantId) ?? [], line.weeks) : null;
      if (line.purchase === "subscribe" && !sellingPlanId) {
        return { ok: false, error: `${line.title} can't be bought on subscription right now. Switch it to one-time in your bag.` };
      }
      input.push({ merchandiseId: line.variantId, quantity: line.qty, ...(sellingPlanId && { sellingPlanId }) });
    }

    const attributes = samples.length ? [{ key: "Samples", value: samples.join(", ") }] : [];
    const { cartCreate } = await storefront<CartCreateResponse>(
      CART_CREATE,
      { input: { lines: input, attributes, ...(note.trim() && { note: note.trim() }), ...(promo && { discountCodes: [promo] }) } },
      { cache: "no-store" },
    );
    if (!cartCreate.cart) return { ok: false, error: cartCreate.userErrors.map((e) => e.message).join(" ") || "Shopify couldn't open a checkout." };
    return { ok: true, url: cartCreate.cart.checkoutUrl };
  } catch (error) {
    console.error("[cuvette checkout]", error);
    return { ok: false, error: "Checkout is unavailable for a moment. Please try again." };
  }
}

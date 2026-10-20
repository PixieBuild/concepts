import "server-only";

import { CURRENCY, END_OF_LIFE } from "../content";
import type { Colour, Daypart, MerchantImage, Product, RoutineMeta, Shot, Size } from "../product";
import { ENAMEL, type BottleLook } from "../product-look";
import { METAFIELD_NAMESPACE, type MetafieldKey, type StorefrontProduct, type StorefrontVariant } from "./storefront";

/** The editorial half of a product, kept in the `cuvette.editorial` JSON metafield. Every field is optional. */
export type Editorial = Partial<
  Pick<
    Product,
    | "descriptor"
    | "benefit"
    | "job"
    | "jobs"
    | "concerns"
    | "keywords"
    | "texture"
    | "dose"
    | "when"
    | "actives"
    | "inci"
    | "formulaNote"
    | "howTo"
    | "storage"
    | "study"
    | "costs"
    | "endOfLife"
    | "histogram"
    | "reviews"
    | "next"
    | "gallery"
    | "subscribe"
    | "inciLead"
    | "inciRoles"
  >
>;

export type Mapped = { product: Product; position: number; createdAt: string };

/** Fields the bottle composite cannot be drawn without. A product missing one shows its merchant photos instead. */
const BOTTLE_KEYS: MetafieldKey[] = ["strength", "active", "ph", "pao", "lot", "filled", "liquid_colour", "liquid_density", "label_accent"];

const SERUM_GALLERY: Product["gallery"] = [
  { shot: "pack", caption: "On the plinth" },
  { shot: "three-quarter", caption: "Three-quarter" },
  { shot: "label", caption: "Printed on the glass" },
  { shot: "drop", caption: "One drop" },
];
const SET_GALLERY: Product["gallery"] = [{ shot: "pack", caption: "Side by side" }];
const NEUTRAL = "#ebebe8";

const warned = new Set<string>();

/** Logs each distinct catalogue problem once per server process, not on every render. */
export function warnStore(message: string) {
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(`[cuvette catalog] ${message}`);
}

export function warn(handle: string, message: string) {
  warnStore(`Shopify product "${handle}": ${message}`);
}

/** A darker ink of the label colour for text on paper, when the merchant hasn't set `cuvette.ink_on_paper`. */
export function inkOnPaper(hex: string): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const channel = (shift: number) => Math.round(((n >> shift) & 255) * 0.42);
  return `#${[16, 8, 0].map((s) => channel(s).toString(16).padStart(2, "0")).join("")}`;
}

const HEX = /^#[0-9a-f]{6}$/i;
const cents = (amount: string | undefined) => Math.round(parseFloat(amount ?? "0") * 100);

function readMetafields(node: StorefrontProduct) {
  const values = new Map<string, NonNullable<StorefrontProduct["metafields"][number]>>();
  for (const field of node.metafields) if (field?.namespace === METAFIELD_NAMESPACE && field.value) values.set(field.key, field);
  const text = (key: MetafieldKey) => values.get(key)?.value;
  const colour = (key: MetafieldKey) => {
    const value = text(key);
    if (value === undefined) return undefined;
    if (HEX.test(value)) return value;
    warn(node.handle, `${METAFIELD_NAMESPACE}.${key} must be a #rrggbb colour, got "${value}"`);
    return undefined;
  };
  const number = (key: MetafieldKey) => {
    const value = text(key);
    const n = value === undefined ? NaN : Number(value);
    return Number.isFinite(n) ? n : undefined;
  };
  const json = <T>(key: MetafieldKey): T | undefined => {
    const value = text(key);
    if (value === undefined) return undefined;
    try {
      return JSON.parse(value) as T;
    } catch {
      warn(node.handle, `${METAFIELD_NAMESPACE}.${key} is not valid JSON`);
      return undefined;
    }
  };
  const handles = (key: MetafieldKey) =>
    (values.get(key)?.references?.nodes ?? []).flatMap((ref) => (ref?.handle ? [ref.handle] : []));
  return { text, colour, number, json, handles, has: (key: MetafieldKey) => values.has(key) };
}

/** "30 ml" is 30; "2 × 30 ml" is 60. */
function mlOf(label: string | undefined): number | undefined {
  if (!label) return undefined;
  const multi = label.match(/(\d+)\s*[×x]\s*(\d+(?:\.\d+)?)\s*ml/i);
  if (multi) return Number(multi[1]) * Number(multi[2]);
  const single = label.match(/(\d+(?:\.\d+)?)\s*ml/i);
  return single ? Number(single[1]) : undefined;
}

function sizesOf(handle: string, variants: StorefrontVariant[], fallbackMl: number): Size[] {
  return variants.map((variant) => {
    if (variant.price.currencyCode !== CURRENCY) warn(handle, `priced in ${variant.price.currencyCode}, but the site labels every price in ${CURRENCY}; set the store currency to ${CURRENCY}`);
    const option = variant.selectedOptions.find((o) => o.name.toLowerCase() === "size")?.value;
    return { ml: mlOf(option) ?? mlOf(variant.title) ?? fallbackMl, price: cents(variant.price.amount), variantId: variant.id, available: variant.availableForSale };
  });
}

function imagesOf(node: StorefrontProduct): MerchantImage[] {
  return node.media.nodes.flatMap((media) => {
    if (media.mediaContentType !== "IMAGE" || !media.image?.width || !media.image.height) return [];
    const { url, altText, width, height } = media.image;
    return [{ url, alt: media.alt || altText || node.title, width, height }];
  });
}

function routineOf(raw: unknown): RoutineMeta | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<RoutineMeta>;
  if (!r.am && !r.pm) return null;
  return {
    am: r.am,
    pm: r.pm,
    damp: !!r.damp,
    sensitiveSafe: r.sensitiveSafe !== false,
    pairsWith: Array.isArray(r.pairsWith) ? r.pairsWith.filter((p) => typeof p?.handle === "string") : [],
    note: r.note,
    sensitiveNote: r.sensitiveNote,
  };
}

function cssVarFor(handle: string): Colour["cssVar"] {
  return `--p-${handle.toLowerCase().replace(/[^a-z0-9-]/g, "-")}`;
}

/** One Storefront product as a Cuvette product: commerce from Shopify core, the bottle from metafields, copy from editorial. */
export function productFromShopify(node: StorefrontProduct): Mapped {
  const m = readMetafields(node);
  const editorial = m.json<Editorial>("editorial") ?? {};
  if (!m.has("editorial")) warn(node.handle, `no ${METAFIELD_NAMESPACE}.editorial, so the page falls back to the Shopify description`);

  const components = m.handles("components");
  const isSet = components.length > 0;
  if (!isSet && !editorial.actives?.length) warn(node.handle, `${METAFIELD_NAMESPACE}.editorial has no actives, so the product page leaves out its formula band`);
  const strength = m.text("strength") ?? "";
  const name = (strength ? node.title.replace(strength, "") : node.title).trim() || node.title;
  const variants = node.variants.nodes;
  const sizes = sizesOf(node.handle, variants, m.number("size_ml") ?? 30);
  const compareAt = variants[0]?.compareAtPrice ? cents(variants[0].compareAtPrice.amount) : null;

  const accent = m.colour("label_accent") ?? NEUTRAL;
  const liquid = m.colour("liquid_colour") ?? accent;
  const colour: Colour = {
    cssVar: cssVarFor(node.handle),
    onDark: accent,
    onPaper: m.colour("ink_on_paper") ?? inkOnPaper(accent),
    band: accent,
    liquid,
    tint: liquid,
    density: m.number("liquid_density") ?? 0.3,
  };

  const missing = isSet ? [] : BOTTLE_KEYS.filter((key) => !m.has(key));
  if (missing.length) warn(node.handle, `missing ${missing.map((k) => `${METAFIELD_NAMESPACE}.${k}`).join(", ")}; showing its merchant photos instead of the bottle`);

  const lot = { code: m.text("lot") ?? "", filled: m.text("filled") ?? "" };
  const look: BottleLook | null =
    isSet || missing.length
      ? null
      : {
          id: node.handle,
          label: { name, strength, active: m.text("active")!, sizeMl: sizes[0]?.ml ?? 30, ph: m.text("ph")!, pao: m.text("pao")!, lot: lot.code, filled: lot.filled },
          liquid: { colour: colour.tint, density: colour.density },
          ink: m.colour("label_ink") ?? ENAMEL,
          accent,
        };

  const description = node.description.trim();
  const features = m.json<unknown>("features");
  const product: Product = {
    slug: node.handle,
    id: node.id,
    code: variants[0]?.sku || node.handle.toUpperCase(),
    name,
    strength,
    lead: m.text("active") ?? "",
    title: node.title,
    seoTitle: node.seo.title || node.title,
    descriptor: editorial.descriptor ?? description.split(/(?<=\.)\s/)[0]?.replace(/\.$/, "") ?? "",
    benefit: editorial.benefit ?? description,
    type: node.productType || (isSet ? "Set" : "Serum"),
    tags: node.tags,
    job: editorial.job ?? node.productType,
    jobs: editorial.jobs ?? (editorial.job ? [editorial.job] : []),
    concerns: editorial.concerns ?? [],
    keywords: editorial.keywords ?? node.tags.map((t) => t.toLowerCase()),
    sizes,
    compareAt,
    available: node.availableForSale,
    subscribe: editorial.subscribe ?? { weeks: 8, discount: 0.1 },
    ph: m.text("ph") ?? "",
    texture: editorial.texture ?? "",
    dose: editorial.dose ?? "",
    pao: m.text("pao") ?? "",
    when: (editorial.when ?? []).filter((d): d is Daypart => d === "AM" || d === "PM"),
    actives: editorial.actives ?? [],
    inci: editorial.inci ?? [],
    lot,
    colour,
    gallery: ((editorial.gallery ?? (isSet ? SET_GALLERY : SERUM_GALLERY)) as { shot: Shot; caption: string }[]),
    histogram: editorial.histogram ?? [0, 0, 0, 0, 0],
    looks: look ? [look] : [],
    images: imagesOf(node),
    baked: false,
    contains: components,
    separately: isSet ? 0 : null,
    routine: isSet ? null : routineOf(m.json("routine")),
    features: Array.isArray(features) ? features.filter((f): f is string => typeof f === "string") : [],
    hero: node.tags.includes("hero") ? (m.number("hero_order") ?? 99) : null,
    updatedAt: node.updatedAt,
    howTo: { headline: "How to use", steps: [], layering: "", avoid: "", ...editorial.howTo },
    storage: editorial.storage,
    study: editorial.study ?? null,
    costs: editorial.costs ?? [],
    endOfLife: editorial.endOfLife ?? END_OF_LIFE,
    reviews: editorial.reviews ?? [],
    formulaNote: editorial.formulaNote,
    next: editorial.next,
    inciLead: editorial.inciLead,
    inciRoles: editorial.inciRoles,
    parts: [],
  };

  return { product, position: m.number("position") ?? Number.MAX_SAFE_INTEGER, createdAt: node.createdAt };
}

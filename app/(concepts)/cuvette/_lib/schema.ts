import { BRAND, COMPANY, CURRENCY, POLICY } from "./content";
import { COUNTRIES, shippingCost, type Zone } from "./delivery";
import { isSet, priceOf, rating, sizeLabel, type Product, type ProductCard, type Review, type Shot } from "./product";
import { findStill, galleryShots, resolveStill, type StillSubject } from "./stills";
import { SITE_URL, url } from "../site";

type Json = Record<string, unknown>;

export const ORG_ID = url("#org");
export const WEBSITE_ID = url("#website");

/** Serialises JSON-LD for a `<script type="application/ld+json">`, escaping `<`. */
export function jsonLd(data: Json): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Absolute URL of the still actually served for this subject and shot. */
export function stillUrl(subject: StillSubject, shot: Shot): string {
  return `${SITE_URL}${resolveStill(subject, shot).src}`;
}

function bakedUrls(p: ProductCard): string[] {
  if (!p.baked) return [];
  const own = galleryShots(p).flatMap((frame) => findStill(p.slug, frame.shot) ?? []);
  const parts = p.contains.flatMap((s) => findStill(s, "pack") ?? []);
  return [findStill(p.slug, "pack")!, ...own, ...parts].map((still) => `${SITE_URL}${still.src}`);
}

/** The product's photos first (the first is the one search and share cards lead with), then any baked stills; absolute, no repeats. */
export function productImages(p: ProductCard): string[] {
  return [...new Set([...p.photos.map((photo) => `${SITE_URL}${photo.url}`), ...bakedUrls(p)])];
}

const SHIPS_TO = Object.keys(COUNTRIES);

/** Layout graph: the shop and the site. No SearchAction: search is client-side only. */
export function siteGraph(description: string): Json {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Organization", "OnlineStore"],
        "@id": ORG_ID,
        name: BRAND,
        legalName: COMPANY.legal,
        description,
        url: url(),
        email: COMPANY.email,
        address: { "@type": "PostalAddress", addressLocality: COMPANY.city, addressCountry: COMPANY.countryCode },
        hasMerchantReturnPolicy: returnPolicy(),
      },
      { "@type": "WebSite", "@id": WEBSITE_ID, url: url(), name: BRAND, inLanguage: "en", publisher: { "@id": ORG_ID } },
    ],
  };
}

export function returnPolicy(): Json {
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: SHIPS_TO,
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: POLICY.returnsDays,
    returnMethod: "https://schema.org/ReturnByMail",
    returnFees: "https://schema.org/FreeReturn",
  };
}

/** ItemList of product URLs, for the home page and the shop. */
export function itemList(products: ProductCard[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: products.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: url(`/${p.slug}`), name: p.title })),
  };
}

const ZONES: { zone: Zone; countries: string[] }[] = [
  { zone: "PT", countries: ["PT"] },
  { zone: "ES", countries: ["ES"] },
  { zone: "EU", countries: SHIPS_TO.filter((c) => c !== "PT" && c !== "ES") },
];

const days = (min: number, max: number) => ({ "@type": "QuantitativeValue", minValue: min, maxValue: max, unitCode: "DAY" });

/** Standard (CTT) delivery per zone, priced for one unit of this product. */
function shippingDetails(cents: number): Json[] {
  return ZONES.map(({ zone, countries }) => {
    const [min, max] = POLICY.transit.standard[zone];
    return {
      "@type": "OfferShippingDetails",
      shippingRate: { "@type": "MonetaryAmount", value: (shippingCost(countries[0] as keyof typeof COUNTRIES, "standard", cents) / 100).toFixed(2), currency: CURRENCY },
      shippingDestination: { "@type": "DefinedRegion", addressCountry: countries },
      deliveryTime: { "@type": "ShippingDeliveryTime", handlingTime: days(0, 1), transitTime: days(min, max) },
    };
  });
}

const SKIN_CARE = "Health & Beauty > Personal Care > Cosmetics > Skin Care";

/** Google's product taxonomy from the product type: serums (and sets of only serums) go one level deeper. */
function categoryOf(p: Product): string {
  const serums = isSet(p) ? p.parts.every((part) => /serum/i.test(part.type)) : /serum/i.test(p.type);
  return serums ? `${SKIN_CARE} > Facial Serums` : SKIN_CARE;
}

/** PDP Product. `reviews` must be exactly the reviews visible on the page. */
export function productJsonLd(p: Product, reviews: Review[]): Json {
  const slug = p.slug;
  const { average, count } = rating(p);
  const price = priceOf(p);
  const ml = p.sizes[0]?.ml ?? 30;
  const images = productImages(p);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": url(`/${slug}#product`),
    name: p.seoTitle,
    description: `${p.descriptor}. ${p.benefit}`,
    sku: p.code,
    brand: { "@type": "Brand", name: BRAND },
    ...(images.length > 0 && { image: images }),
    category: categoryOf(p),
    size: sizeLabel(p),
    ...(isSet(p) && { isRelatedTo: p.parts.map((part) => ({ "@type": "Product", name: part.seoTitle, url: url(`/${part.slug}`) })) }),
    offers: {
      "@type": "Offer",
      price: (price / 100).toFixed(2),
      priceCurrency: CURRENCY,
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: ((price / ml) * 10).toFixed(2),
        priceCurrency: CURRENCY,
        referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "LTR" },
      },
      availability: p.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      url: url(`/${slug}`),
      seller: { "@id": ORG_ID },
      shippingDetails: shippingDetails(price),
      hasMerchantReturnPolicy: returnPolicy(),
    },
    ...(count > 0 && { aggregateRating: { "@type": "AggregateRating", ratingValue: average, reviewCount: count, bestRating: 5, worstRating: 1 } }),
    review: reviews.map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.name },
      datePublished: r.date,
      reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 },
      name: r.title,
      reviewBody: r.body,
    })),
  };
}

/** Brand > Shop > product; without a product, the trail for the shop page itself. */
export function breadcrumbJsonLd(p?: Pick<ProductCard, "slug" | "title">): Json {
  const trail = [
    { name: BRAND, item: url() },
    { name: "Shop", item: url("/shop") },
    ...(p ? [{ name: p.title, item: url(`/${p.slug}`) }] : []),
  ];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, i) => ({ "@type": "ListItem", position: i + 1, ...crumb })),
  };
}

import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";

import { concerns, listProducts, productTypes } from "../_lib/catalog";
import { BRAND } from "../_lib/content";
import { concernId, isSet, rangeSummary, type Slug } from "../_lib/product";
import { breadcrumbJsonLd, itemList, jsonLd } from "../_lib/schema";
import { Footer } from "../_components/footer";
import { Header } from "../_components/header";
import { path, url } from "../site";
import { ShopFromUrl, ShopView } from "./_components/shop-view";
import { DEFAULT_QUERY, SORTS, plural, type ShopData, type ShopSort } from "./_lib/query";

const slugs = (products: { slug: Slug }[]) => products.map((p) => p.slug);

/** Each filter's products come from `listProducts(filter)`, so the shop narrows exactly as the catalogue defines it. */
async function shopData(): Promise<ShopData> {
  const [concernList, typeList, ...orders] = await Promise.all([concerns(), productTypes(), ...SORTS.map((s) => listProducts({ sort: s.id }))]);
  const [concernFacets, typeFacets] = await Promise.all([
    Promise.all(concernList.map(async (c) => ({ id: c.id, label: c.label, slugs: slugs(await listProducts({ concern: c.id })) }))),
    Promise.all(typeList.map(async ({ type }) => ({ id: concernId(type), label: type, slugs: slugs(await listProducts({ type })) }))),
  ]);
  return {
    orders: Object.fromEntries(SORTS.map((s, i) => [s.id, slugs(orders[i])])) as Record<ShopSort, Slug[]>,
    concerns: concernFacets,
    types: typeFacets,
  };
}

/** "serums and sets", from the Shopify product types the store carries. */
async function shelves(): Promise<string> {
  const names = (await productTypes()).map(({ type }) => plural(type).toLowerCase());
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}` : (names[0] ?? "products");
}

export async function generateMetadata(): Promise<Metadata> {
  const [products, kinds] = await Promise.all([listProducts(), shelves()]);
  const titles = products.filter((p) => !isSet(p)).map((p) => p.title);
  const named = titles.length > 1 ? `${titles.slice(0, -1).join(", ")} and ${titles.at(-1)}` : (titles[0] ?? "");
  const title = `Shop all ${kinds}`;
  const description = `${rangeSummary(products)}${named ? `: ${named}` : ""}. Filter by skin concern; every bottle priced per litre, fragrance-free and filled in Porto.`;
  return {
    title,
    description,
    alternates: { canonical: path("/shop") },
    openGraph: { type: "website", siteName: BRAND, locale: "en_GB", title: `${title} — ${BRAND}`, description, url: url("/shop") },
    twitter: { card: "summary_large_image", title: `${title} — ${BRAND}`, description },
  };
}

export default async function ShopPage() {
  const [products, data, kinds] = await Promise.all([listProducts(), shopData(), shelves()]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(itemList(products)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbJsonLd()) }} />
      <Header variant="solid" />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <nav aria-label="Breadcrumb" className="px-(--gutter) pt-5 pb-4">
          <ol className="label flex gap-3 text-muted-foreground">
            <li>
              <Link href="/cuvette" className="inline-flex min-h-11 items-center hover:text-foreground">
                {BRAND}
              </Link>
            </li>
            <li aria-hidden className="inline-flex items-center">
              /
            </li>
            <li className="inline-flex items-center text-foreground" aria-current="page">
              Shop
            </li>
          </ol>
        </nav>

        <header className="px-(--gutter) pt-4 pb-8 sm:pt-6 sm:pb-10">
          <h1 className="heading">
            All {kinds}. <span className="text-muted-foreground">One lead active each.</span>
          </h1>
        </header>

        <div className="px-(--gutter) pb-28 sm:pb-36">
          <Suspense fallback={<ShopView data={data} query={DEFAULT_QUERY} />}>
            <ShopFromUrl data={data} />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}

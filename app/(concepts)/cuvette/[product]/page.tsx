import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { bundles, getProduct, listProducts } from "../_lib/catalog";
import { BRAND } from "../_lib/content";
import { priceShort } from "../_lib/format";
import { isSet, priceOf, rating, sizeLabel, type Product } from "../_lib/product";
import { jsonLd, breadcrumbJsonLd, productJsonLd } from "../_lib/schema";
import { Footer } from "../_components/footer";
import { Header } from "../_components/header";
import { path, url } from "../site";
import { visibleReviews } from "./_lib/reviews";
import { BuyBox } from "./_components/buy-box";
import { ColourClock } from "./_components/colour-clock";
import { SheetButton } from "./_components/detail-sheet";
import { Gallery } from "./_components/gallery";
import { ProductSheets, SHEETS } from "./_components/product-sheets";
import { PurchaseProvider } from "./_components/purchase";
import { Reviews } from "./_components/reviews";
import { Costs, DropBand, LabelBand, MorningOrder, NextStep, Results, SpecStrip } from "./_components/sections";
import { StickyAdd } from "./_components/sticky-add";
import { StickyColumn } from "./_components/sticky-column";

// Every product the store lists is prerendered; one added in Shopify since renders on its first visit.
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await listProducts()).map((p) => ({ product: p.slug }));
}

function describe(p: Product): string {
  const price = priceShort(priceOf(p));
  if (isSet(p)) {
    const order = p.parts.map((part) => part.title).join(" then ");
    return `${p.seoTitle}: ${order}, ${sizeLabel(p)} in the order you use them. ${price} (${priceShort(p.separately)} apart), fragrance-free, filled in Porto.`;
  }
  const what = /^[A-Z][a-z]/.test(p.descriptor) ? p.descriptor.charAt(0).toLowerCase() + p.descriptor.slice(1) : p.descriptor;
  const rest = `${what}${p.ph ? ` at pH ${p.ph}` : ""}. ${sizeLabel(p)}, ${price}, fragrance-free, dated by lot and filled in Porto.`;
  const short = `${p.seoTitle}: ${rest}`;
  return short.length >= 140 || !p.jobs.length ? short : `${p.seoTitle} to ${p.jobs.join(" and ").toLowerCase()}: ${rest}`;
}

async function productFrom(params: Promise<{ product: string }>): Promise<Product> {
  const { product } = await params;
  return (await getProduct(product)) ?? notFound();
}

export async function generateMetadata(props: PageProps<"/cuvette/[product]">): Promise<Metadata> {
  const product = await productFrom(props.params);
  const description = describe(product);
  return {
    title: product.seoTitle,
    description,
    alternates: { canonical: path(`/${product.slug}`) },
    openGraph: { type: "website", siteName: BRAND, locale: "en_GB", title: `${product.seoTitle} — ${BRAND}`, description, url: url(`/${product.slug}`) },
    twitter: { card: "summary_large_image", title: `${product.seoTitle} — ${BRAND}`, description },
  };
}

export default async function ProductPage(props: PageProps<"/cuvette/[product]">) {
  const product = await productFrom(props.params);
  const { display, count } = rating(product);
  const set = isSet(product);
  const featured = visibleReviews(product.reviews);
  const [next, sets] = await Promise.all([product.next ? getProduct(product.next) : null, bundles()]);
  const offers = sets.filter((s) => s.contains.includes(product.slug));
  const clock = product.features.includes("colour-clock") ? product.storage : undefined;

  return (
    <PurchaseProvider>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(productJsonLd(product, featured)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbJsonLd(product)) }} />
      <Header variant="solid" />
      <main className="flex-1">
        <nav aria-label="Breadcrumb" className="px-(--gutter) pt-5 pb-4">
          <ol className="label flex min-w-0 gap-3 text-muted-foreground">
            <li className="shrink-0">
              <Link href="/cuvette" className="inline-flex min-h-11 items-center hover:text-foreground">
                {BRAND}
              </Link>
            </li>
            <li aria-hidden className="inline-flex items-center">
              /
            </li>
            <li className="shrink-0">
              <Link href="/cuvette/shop" className="inline-flex min-h-11 items-center hover:text-foreground">
                Shop
              </Link>
            </li>
            <li aria-hidden className="inline-flex items-center">
              /
            </li>
            <li className="min-w-0 self-center truncate text-foreground" aria-current="page">
              {product.title}
            </li>
          </ol>
        </nav>

        <div className="grid items-start gap-2 lg:grid-cols-12 lg:gap-6 lg:px-(--gutter)">
          <div className="lg:col-span-7">
            <Gallery product={product} />
          </div>
          <StickyColumn className="lg:col-span-5">
            <BuyBox product={product} sets={offers} />
          </StickyColumn>
        </div>

        <div className="mt-20 space-y-28 pb-28 sm:mt-28 sm:space-y-36 sm:pb-36">
          <SpecStrip product={product} />
          {set ? (
            <MorningOrder product={product} />
          ) : (
            <>
              <LabelBand product={product} />
              <Results product={product} />
              <DropBand product={product} />
              {clock && (
                <ColourClock
                  product={{ title: product.title, lot: product.lot, colour: product.colour, storage: clock }}
                  more={
                    <SheetButton id={SHEETS.storage} className="link mt-8">
                      How to store it
                    </SheetButton>
                  }
                />
              )}
            </>
          )}
          <Costs product={product} />
          {count > 0 && <Reviews title={product.title} reviews={product.reviews} histogram={product.histogram} average={display} count={count} />}
          <NextStep product={product} next={next} />
        </div>
      </main>
      <Footer />
      <div aria-hidden className="h-[calc(4.5rem+env(safe-area-inset-bottom))] lg:hidden" />
      <ProductSheets product={product} />
      <StickyAdd slug={product.slug} />
    </PurchaseProvider>
  );
}

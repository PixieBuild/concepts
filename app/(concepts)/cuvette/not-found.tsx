import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { listProducts } from "./_lib/catalog";
import { priceShort } from "./_lib/format";
import { isSet, priceOf, type Product } from "./_lib/product";
import { Bottle } from "./_components/bottle/bottle";
import { Footer } from "./_components/footer";
import { Header } from "./_components/header";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

function Row({ product }: { product: Product }) {
  return (
    <li>
      <Link
        href={`/cuvette/${product.slug}`}
        className="group grid min-h-11 grid-cols-[4rem_1fr_auto] items-center gap-4 border-b border-border py-3 hover:text-foreground sm:grid-cols-[4.5rem_1fr_auto_auto] sm:gap-6"
      >
        <span className="relative block aspect-square overflow-hidden bg-[#0c0d0e]">
          <Bottle product={product} shot="thumb" sizes="72px" alt="" />
        </span>
        <span className="min-w-0">
          <span className="product-name block text-[1.0625rem]">{product.title}</span>
          <span className="block truncate text-[0.875rem] text-muted-foreground">{isSet(product) ? product.descriptor : product.benefit}</span>
        </span>
        <span className="hidden text-[0.9375rem] text-muted-foreground sm:block">{priceShort(priceOf(product))}</span>
        <ArrowRightIcon aria-hidden className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
      </Link>
    </li>
  );
}

export default function NotFound() {
  const products = listProducts();
  return (
    <>
      <Header variant="solid" />
      <main className="flex-1">
        <div className="grid items-end gap-12 px-4 pt-10 pb-24 sm:px-10 sm:pt-16 lg:grid-cols-12 lg:gap-6 lg:pb-32">
          <div className="lg:col-span-6 lg:pb-4">
            <p className="label text-muted-foreground">404 · Not on the shelf</p>
            <h1 className="display mt-5 max-w-[13ch]">
              Nothing on this plinth. <span className="text-muted-foreground">The range is below.</span>
            </h1>
            <p className="lead mt-8 max-w-[44ch] text-muted-foreground">
              The link may be old, or the product is no longer filled. These are the serums we make today, each at the strength printed on the glass.
            </p>
            <ul className="mt-10 border-t border-border">
              {products.map((p) => (
                <Row key={p.slug} product={p} />
              ))}
            </ul>
            <Link href="/cuvette" className="link mt-8 inline-flex min-h-11 items-center text-[0.9375rem]">
              Back to the front page
            </Link>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden bg-card lg:col-span-5 lg:col-start-8">
            <Bottle product="range" shot="group" sizes="(min-width: 1024px) 40vw, 100vw" alt="" priority />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

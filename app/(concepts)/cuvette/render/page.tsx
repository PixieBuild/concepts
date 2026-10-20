import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { listProducts } from "../_lib/catalog";
import { isSet, priceOf } from "../_lib/product";
import { BakeHost } from "./_components/bake-host";
import { BottleLab } from "./_components/bottle-lab";

export const metadata: Metadata = {
  title: "Bottle lab",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};

// Dev-only. `?bake` hosts the compositor for scripts/cuvette/bake-stills.mjs; otherwise it shows the first catalogue
// product that has no baked still, composited from its Shopify data alone, in the hero, a product page and the bag.
export default async function RenderPage({ searchParams }: PageProps<"/cuvette/render">) {
  if (process.env.NODE_ENV === "production") notFound();
  const { bake } = await searchParams;
  const products = (await listProducts()).filter((p) => p.looks.length > 0);
  const live = products.filter((p) => !p.baked && !isSet(p)).map((p) => p.looks[0]);
  if (bake !== undefined) {
    const baked = products.filter((p) => p.baked);
    return <BakeHost slugs={baked.map((p) => p.slug)} looks={Object.fromEntries(baked.map((p) => [p.slug, p.looks]))} fixtures={live} />;
  }
  const serums = products.filter((p) => !isSet(p));
  const subject = live[0] ?? serums[0]?.looks[0];
  if (!subject) notFound();
  return <BottleLab looks={serums.map((p) => p.looks[0])} subject={subject} prices={Object.fromEntries(serums.map((p) => [p.slug, priceOf(p)]))} />;
}

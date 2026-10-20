"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { closeBag } from "../../_lib/cart";
import { priceShort } from "../../_lib/format";
import { priceOf, productHref, sizeLabel } from "../../_lib/product";
import { AddToBag } from "../add-to-bag";
import { Bottle } from "../bottle/bottle";
import { useCatalog } from "../catalog-provider";
import { ProductName } from "./product-name";

const SUGGESTIONS = 3;

export function BagEmpty() {
  const { listed } = useCatalog();
  const picks = [...listed].sort((a, b) => (a.hero ?? Infinity) - (b.hero ?? Infinity)).slice(0, SUGGESTIONS);
  return (
    <div className="py-8">
      <p className="text-[0.95rem]">Your bag is empty.</p>
      <Button
        nativeButton={false}
        render={<Link href="/cuvette/shop" />}
        onClick={closeBag}
        className="mt-5 h-12 w-full text-[0.95rem] font-normal"
      >
        Shop all products
      </Button>
      {picks.length > 0 && (
        <>
          <p className="label mt-10 text-muted-foreground">Or start with</p>
          <ul className="mt-2 divide-y divide-border border-y border-border">
            {picks.map((p) => (
              <li key={p.slug} className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-x-4 py-3">
                <div className="relative size-14 overflow-hidden bg-[#0e0f10]">
                  <Bottle product={p} shot="thumb" sizes="56px" alt="" />
                </div>
                <div className="min-w-0">
                  <Link href={productHref(p.slug)} onClick={closeBag} className="text-[0.95rem] underline-offset-4 hover:underline">
                    <ProductName product={p} />
                  </Link>
                  <p className="label mt-1 text-muted-foreground">
                    {sizeLabel(p)} · {p.job}
                  </p>
                </div>
                <AddToBag
                  slug={p.slug}
                  variant="outline"
                  label={`Add · ${priceShort(priceOf(p))}`}
                  className="h-11 border-foreground bg-transparent px-4 text-sm"
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { makeCatalog, type ClientCatalog } from "../_lib/client-catalog";
import type { ProductCard, Slug } from "../_lib/product";
import { ProductInks } from "./bag/product-inks";

const CatalogContext = createContext<ClientCatalog | null>(null);

/** Mounted once by the layout with every product's card; the bag, search, header and checkout read it. */
export function CatalogProvider({ products, children }: { products: ProductCard[]; children: ReactNode }) {
  const catalog = useMemo(() => makeCatalog(products), [products]);
  return (
    <CatalogContext value={catalog}>
      <ProductInks products={products} />
      {children}
    </CatalogContext>
  );
}

export function useCatalog(): ClientCatalog {
  const catalog = useContext(CatalogContext);
  if (!catalog) throw new Error("useCatalog() needs <CatalogProvider> above it (the Cuvette layout mounts one)");
  return catalog;
}

export function useProduct(slug: Slug): ProductCard | undefined {
  return useCatalog().get(slug);
}

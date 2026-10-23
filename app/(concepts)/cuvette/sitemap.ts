import type { MetadataRoute } from "next";

import { heroProducts, listProducts } from "./_lib/catalog";
import { productImages, stillUrl } from "./_lib/schema";
import { url } from "./site";

export default function sitemap(): MetadataRoute.Sitemap {
  const products = listProducts();
  const [hero] = heroProducts();
  const latest = products.reduce((max, p) => (p.updatedAt > max ? p.updatedAt : max), "");
  return [
    {
      url: url(),
      lastModified: latest ? new Date(latest) : undefined,
      changeFrequency: "weekly",
      priority: 1,
      images: [...(hero?.baked ? [stillUrl(hero.slug, "hero-wide")] : []), stillUrl("range", "group-wide")],
    },
    {
      url: url("/shop"),
      lastModified: latest ? new Date(latest) : undefined,
      changeFrequency: "weekly",
      priority: 0.9,
      images: products.flatMap((p) => productImages(p).slice(0, 1)),
    },
    ...products.map((p) => ({
      url: url(`/${p.slug}`),
      lastModified: new Date(p.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: productImages(p),
    })),
  ];
}

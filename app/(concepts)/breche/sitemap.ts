import type { MetadataRoute } from "next";

import { url } from "./site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: url(), lastModified: new Date("2026-10-10"), changeFrequency: "weekly", priority: 1 }];
}

import type { MetadataRoute } from "next";

import { url } from "./site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: url(),
      lastModified: new Date("2026-09-14"),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}

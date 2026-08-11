import type { MetadataRoute } from "next";

import { url } from "./site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-08-11");

  return [
    { url: url(), lastModified, changeFrequency: "monthly", priority: 1 },
    {
      url: url("/services"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}

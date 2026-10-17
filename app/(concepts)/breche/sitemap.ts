import type { MetadataRoute } from "next";

import { IMAGE_BASE, OBJECTIVES, SLOTS } from "./_lib/content";
import { SITE_URL, url } from "./site";

const photos = ["og-summit.jpg", SLOTS.office.src, ...OBJECTIVES.map((objective) => objective.slot.src), SLOTS.valley.src];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: url(),
      lastModified: new Date("2026-10-17"),
      changeFrequency: "daily",
      priority: 1,
      images: photos.map((file) => `${SITE_URL}${IMAGE_BASE}/${file}`),
    },
  ];
}

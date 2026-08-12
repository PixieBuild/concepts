import type { MetadataRoute } from "next";

import { ROOMS } from "./_lib/content";
import { url } from "./site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-08-11");

  const pages = [
    { path: "", priority: 1 },
    { path: "/rooms", priority: 0.9 },
    { path: "/dining", priority: 0.8 },
    { path: "/experiences", priority: 0.8 },
    { path: "/gallery", priority: 0.7 },
    { path: "/location", priority: 0.7 },
    { path: "/booking", priority: 0.9 },
  ];

  return [
    ...pages.map((page) => ({
      url: url(page.path),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: page.priority,
    })),
    ...ROOMS.map((room) => ({
      url: url(`/rooms/${room.slug}`),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}

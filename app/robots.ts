import type { MetadataRoute } from "next";

import { getConcepts, conceptUrl } from "@/lib/concepts";
import { absoluteUrl } from "@/lib/site";

// `Disallow: /$` hides the gallery home without blocking concept routes.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/$"],
    },
    sitemap: getConcepts().map((concept) =>
      conceptUrl(concept.slug, "/sitemap.xml"),
    ),
    host: absoluteUrl("/"),
  };
}

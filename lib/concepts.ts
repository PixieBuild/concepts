import { absoluteUrl } from "@/lib/site";

export const CONCEPT_CATEGORIES = {
  agency: "Agency & Studio",
  saas: "SaaS & Product",
  ecommerce: "E-commerce",
  healthcare: "Healthcare",
  hospitality: "Restaurant & Hospitality",
  "real-estate": "Real Estate",
  education: "Education",
  finance: "Finance & Fintech",
  portfolio: "Portfolio & Personal",
  events: "Events",
  editorial: "Blog & Editorial",
  nonprofit: "Non-profit",
} as const;

export type ConceptCategory = keyof typeof CONCEPT_CATEGORIES;

export type ConceptStatus = "draft" | "ready" | "archived";

export type ConceptPage = {
  path: string;
  label: string;
};

export type Concept = {
  /** URL segment AND the folder name under `app/(concepts)/`. Must match exactly. */
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: ConceptCategory;
  industry: string;
  tags: string[];
  bestFor?: string;
  status: ConceptStatus;
  addedAt: string;
  theme: {
    fonts: string;
    accent: string;
    supportsDarkMode: boolean;
  };
  /** Shown on the gallery card. The concept owns its own sitemap. */
  pages: ConceptPage[];
  /** Screenshot for the gallery card, e.g. "/previews/casa-lume.png". */
  thumbnail?: string;
};

export const CONCEPTS: Concept[] = [
  {
    slug: "casa-lume",
    name: "Casa Lume",
    tagline: "Editorial luxury hotel site with a full booking flow",
    description:
      "A secluded Ligurian boutique hotel built on quiet luxury — Cormorant Garamond at display scale, terracotta on warm ivory, and generous whitespace. Includes a four-step room booking flow, restaurant reservation, and experience booking, all validated on the frontend.",
    category: "hospitality",
    industry: "Boutique hotel",
    tags: [
      "hotel",
      "editorial",
      "booking",
      "multi-page",
      "terracotta",
      "mediterranean",
      "motion",
      "serif",
    ],
    bestFor:
      "Hospitality and travel clients who want restraint and strong typography rather than a conventional hotel template.",
    status: "ready",
    addedAt: "2026-08-11",
    theme: {
      fonts: "Cormorant Garamond / Manrope",
      accent: "#B56A4A",
      supportsDarkMode: false,
    },
    pages: [
      { path: "", label: "Home" },
      { path: "/rooms", label: "Rooms" },
      { path: "/rooms/sea-view-suite", label: "Room detail" },
      { path: "/dining", label: "Dining" },
      { path: "/experiences", label: "Experiences" },
      { path: "/gallery", label: "Gallery" },
      { path: "/location", label: "Location" },
      { path: "/booking", label: "Booking" },
    ],
    thumbnail: "/previews/casa-lume.webp",
  },
];

export function getConcepts(): Concept[] {
  return CONCEPTS.filter((c) => c.status !== "archived").sort((a, b) =>
    b.addedAt.localeCompare(a.addedAt),
  );
}

export function conceptPath(slug: string, path = ""): string {
  return `/${slug}${path}`;
}

export function conceptUrl(slug: string, path = ""): string {
  return absoluteUrl(conceptPath(slug, path));
}

export function getUsedCategories(): ConceptCategory[] {
  const used = new Set(getConcepts().map((c) => c.category));
  return (Object.keys(CONCEPT_CATEGORIES) as ConceptCategory[]).filter((c) =>
    used.has(c),
  );
}

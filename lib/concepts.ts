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
  /** Screenshot for the gallery card, e.g. "/previews/aurora-dental.png". */
  thumbnail?: string;
};

export const CONCEPTS: Concept[] = [
  {
    slug: "aurora-dental",
    name: "Aurora Dental",
    tagline: "Calm, trust-first clinic site with online booking",
    description:
      "A modern dental practice site built around reassurance rather than hard sell. Soft cyan palette, generous whitespace, and a booking call-to-action that follows the visitor down the page.",
    category: "healthcare",
    industry: "Dental clinic",
    tags: ["clinic", "booking", "soft", "rounded", "single-page", "light"],
    bestFor:
      "Local health practices that want to look modern and approachable without feeling corporate.",
    status: "ready",
    addedAt: "2026-08-11",
    theme: {
      fonts: "Fraunces / Inter",
      accent: "oklch(0.62 0.13 220)",
      supportsDarkMode: true,
    },
    pages: [
      { path: "", label: "Home" },
      { path: "/services", label: "Services" },
    ],
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

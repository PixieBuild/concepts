import { absoluteUrl } from "@/lib/site";

export const CONCEPT_CATEGORIES = {
  agency: "Agency & Studio",
  saas: "SaaS & Product",
  ecommerce: "E-commerce",
  healthcare: "Healthcare",
  hospitality: "Restaurant & Hospitality",
  fitness: "Gyms & Fitness",
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
    thumbnail: "/previews/casa-lume-v2.webp",
  },
  {
    slug: "alder-brass",
    name: "Alder & Brass",
    tagline: "Printed-matter coffee house: masthead, plates, price list, roast sheet",
    description:
      "A Portland coffee house and roastery set like something the shop would have printed — a centred Old Standard masthead with a seal and double rules, photographs framed as captioned plates, the menu as a labelled price list, and a door-green roast sheet. The cup in the first plate detaches on scroll and lands as No. 1 on the counter list.",
    category: "hospitality",
    industry: "Coffee shop",
    tags: [
      "cafe",
      "roastery",
      "one-page",
      "menu",
      "vintage",
      "printed",
      "serif",
      "green",
      "scroll-driven",
    ],
    bestFor:
      "Cafés, bakeries and roasters who want a considered, typographic site with a menu and one memorable scroll moment, but no booking flow.",
    status: "ready",
    addedAt: "2026-09-11",
    theme: {
      fonts: "Old Standard TT / Libre Franklin",
      accent: "#1e3a2f",
      supportsDarkMode: false,
    },
    pages: [{ path: "", label: "Home" }],
    thumbnail: "/previews/alder-brass.jpg",
  },
  {
    slug: "breche",
    name: "Brèche",
    tagline: "Climb Mont Blanc by scrolling: the massif rendered live from elevation data",
    description:
      "A one-page site for a Chamonix guiding company, built around the mountain itself. The massif is rendered live from public elevation data, and scrolling climbs the Goûter route stage by stage: the camera, the altimeter, the light and a route drawn in real coordinates run on one clock, from late morning through a night at the hut to a gold summit over a cloud sea. Below it, ink and snow sections alternate: the office and its terms, six objectives over a relief map with a route sheet each, a conditions bulletin written for the season, twelve guides, and an enquiry form that offers only the weeks an objective is in season.",
    category: "hospitality",
    industry: "Mountain guides",
    tags: ["landing-page", "3d", "webgl", "terrain", "scroll-driven", "outdoor", "enquiry-form", "photography", "editorial"],
    bestFor:
      "Experience operators who sell expertise and judgement rather than stock: mountain and ski guides, dive and sailing schools, climbing and expedition outfits, safari and wilderness lodges, and specialist tour operators. One page, one enquiry, no catalogue to maintain.",
    status: "ready",
    addedAt: "2026-09-15",
    theme: { fonts: "Archivo, expanded to compressed widths", accent: "#c8471f", supportsDarkMode: false },
    pages: [{ path: "", label: "Landing page" }],
    thumbnail: "/previews/breche.jpg",
  },
  {
    slug: "staengel",
    name: "Stängel",
    tagline: "Cursor-trail hero: flower photographs follow the pointer across a pistachio shop front",
    description:
      "A Neukölln flower studio with its name set enormous along the bottom edge and today's stems priced like a shop board. Moving the cursor leaves a trail of single-stem photographs that open and fall away; left alone, the trail wanders on its own.",
    category: "ecommerce",
    industry: "Florist",
    tags: ["cursor", "image-trail", "playful", "colour", "typography", "hero"],
    bestFor:
      "Florists, bakeries, ceramicists and fashion labels with a set of strong product photographs.",
    status: "draft",
    addedAt: "2026-09-15",
    theme: { fonts: "Funnel Display / Funnel Sans", accent: "#e4572e", supportsDarkMode: false },
    pages: [{ path: "", label: "Home" }],
    thumbnail: "/previews/staengel.jpg",
  },
  {
    slug: "heft",
    name: "Heft",
    tagline: "Physics hero for gyms: weight plates and class names drop in and can be thrown",
    description:
      "A Leeds strength gym whose first screen is a pile of competition bumper plates and class names falling under gravity. Visitors grab and fling them, one jumps off the pile every few seconds, and the next class with spots left sits beside the headline ready to book. Condensed poster type on black, no photography.",
    category: "fitness",
    industry: "Gym and fitness studio",
    tags: ["physics", "interactive", "fitness", "gym", "booking", "dark", "hero", "no-assets"],
    bestFor:
      "Gyms, boutique fitness studios, boxing clubs and personal trainers who want a first screen people play with and a class they can book.",
    status: "draft",
    addedAt: "2026-09-15",
    theme: { fonts: "Big Shoulders / Geist Mono", accent: "#d4ff3f", supportsDarkMode: false },
    pages: [{ path: "", label: "Home" }],
    thumbnail: "/previews/heft.jpg",
  },
  {
    slug: "cuvette",
    name: "Cuvette",
    tagline: "Skincare shop built on one path-traced bottle, composited per product and ready for Shopify",
    description:
      "A Porto serum brand with four single-active serums and a morning set. The hero is one path-traced bottle scrubbed frame by frame as you scroll, with each product's label and serum colour composited live from its data, so a new Shopify product gets its own bottle without a render. Around it sit a products page with filters, product pages with a rendered gallery and editorial reviews, a routine builder, a bag with a set upsell and samples, and a three-step checkout that ends on a demo payment and a confirmation.",
    category: "ecommerce",
    industry: "Skincare brand",
    tags: ["3d", "path-traced", "product", "skincare", "beauty", "scroll-driven", "ecommerce", "shopify", "cart", "checkout", "dark"],
    bestFor:
      "Skincare, cosmetics, fragrance and drinks brands selling a small range of bottled products online, where the product page and the checkout have to feel as considered as the hero.",
    status: "draft",
    addedAt: "2026-09-15",
    theme: { fonts: "Mona Sans, expanded / Fragment Mono", accent: "#f3a948", supportsDarkMode: false },
    pages: [
      { path: "", label: "Home" },
      { path: "/shop", label: "Shop" },
      { path: "/vitamin-c", label: "Vitamin C" },
      { path: "/hyaluronic", label: "Hyaluronic" },
      { path: "/niacinamide", label: "Niacinamide" },
      { path: "/retinal", label: "Retinal" },
      { path: "/morning-set", label: "Morning set" },
      { path: "/checkout", label: "Checkout" },
    ],
    thumbnail: "/previews/cuvette.jpg",
  },
];

/**
 * Drafts are work in progress: visible while developing, never shipped. This is
 * the single gate — the gallery, the category filter and robots.txt all read it.
 */
export function getConcepts(): Concept[] {
  const hidden: ConceptStatus[] =
    process.env.NODE_ENV === "production" ? ["archived", "draft"] : ["archived"];
  return CONCEPTS.filter((c) => !hidden.includes(c.status)).sort((a, b) =>
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

import { absoluteUrl } from "@/lib/site";

export const CONCEPT_CATEGORIES = {
  agency: "Agency & Studio",
  saas: "SaaS & Product",
  ecommerce: "E-commerce",
  healthcare: "Healthcare",
  hospitality: "Restaurant & Hospitality",
  beauty: "Beauty & Grooming",
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
    slug: "meridian",
    name: "Meridian",
    tagline: "Bold barber-shop landing page with an inline booking form",
    description:
      "A men's grooming lounge in Chicago with a loud, confident voice — Archivo at heavy weights, hot orange on warm grey, squared-off marks. Services and pricing, a barber picker, and a validated booking form with date and time pickers, all on one page.",
    category: "beauty",
    industry: "Barber shop",
    tags: [
      "barber",
      "salon",
      "booking",
      "one-page",
      "bold",
      "orange",
      "form",
    ],
    bestFor:
      "Barbers, salons and appointment-based local businesses that want a punchy single page with booking built in.",
    status: "draft",
    addedAt: "2026-09-11",
    theme: {
      fonts: "Archivo",
      accent: "#ec3013",
      supportsDarkMode: false,
    },
    pages: [{ path: "", label: "Home" }],
    thumbnail: "/previews/meridian-v2.jpg",
  },
  {
    slug: "tarnbeck",
    name: "Tarnbeck",
    tagline: "Dark luxury product hero: a lit pocket watch cutting through its own wordmark",
    description:
      "A Cumbrian pocket-watch maker told in one frame — the watch floats in studio light on near-black while the name stands enormous behind it, the object cutting through the letters. Built in WebGL with HDRI lighting, contact shadow, bloom and film grain; the watch turns with the cursor.",
    category: "ecommerce",
    industry: "Watchmaker",
    tags: ["3d", "webgl", "product", "dark", "luxury", "hero", "typography"],
    bestFor:
      "Product brands with one hero object — watches, audio, bottles — who want a single cinematic frame rather than a catalogue.",
    status: "draft",
    addedAt: "2026-09-14",
    theme: { fonts: "Bricolage Grotesque / IBM Plex Mono", accent: "#c9a66b", supportsDarkMode: false },
    pages: [{ path: "", label: "Home" }],
    thumbnail: "/previews/tarnbeck.jpg",
  },
  {
    slug: "saltmarsh",
    name: "Saltmarsh",
    tagline: "Cinematic photograph hero with one word cropped by the bottom edge",
    description:
      "Nine houses on the Suffolk shore, told with one full-bleed photograph, an italic line, a thin grid of rules and the name set so large the viewport crops it. The picture opens with a slow push and the word parallaxes against it on scroll.",
    category: "real-estate",
    industry: "Residential development",
    tags: ["photography", "typography", "editorial", "coastal", "hero", "parallax"],
    bestFor:
      "Developments, hotels and destinations with one photograph strong enough to carry the whole first screen.",
    status: "draft",
    addedAt: "2026-09-14",
    theme: { fonts: "Anton / Instrument Serif / Inter Tight", accent: "#1f2a44", supportsDarkMode: false },
    pages: [{ path: "", label: "Home" }],
    thumbnail: "/previews/saltmarsh.jpg",
  },
  {
    slug: "ottoline",
    name: "Ottoline",
    tagline: "Colour-field hero: ornate serif wordmark, script flourish and a drifting watermark",
    description:
      "A Grasse perfumer on a single aubergine field — the name in a black Bodoni with a script flourish beneath, two spaced words either side, a bevelled frame, and the name again as a vast script watermark drifting behind. A warm bloom follows the cursor. Type only, no photography.",
    category: "ecommerce",
    industry: "Perfumer",
    tags: ["typography", "serif", "script", "colour-field", "luxury", "hero", "no-assets"],
    bestFor:
      "Fragrance, jewellery and heritage brands that want a first screen with the presence of packaging and no photography budget.",
    status: "draft",
    addedAt: "2026-09-14",
    theme: { fonts: "Bodoni Moda / Pinyon Script / IBM Plex Mono", accent: "#c39a72", supportsDarkMode: false },
    pages: [{ path: "", label: "Home" }],
    thumbnail: "/previews/ottoline.jpg",
  },
  {
    slug: "skerry",
    name: "Skerry",
    tagline: "WebGL glass hero: a refracting form over a slow, grainy two-colour gradient",
    description:
      "A design studio in Leith and Lisbon behind a single piece of glass — a transmissive form floats and refracts a shader gradient that breathes on noise, with chromatic fringing at its edges and a pool of light under the cursor. Wide grotesk headline, mono labels. Generated entirely in the browser, no image files.",
    category: "agency",
    industry: "Design studio",
    tags: ["webgl", "shader", "glass", "3d", "studio", "hero", "no-assets"],
    bestFor:
      "Studios and software brands that want the current award-site look without commissioning 3D or photography.",
    status: "draft",
    addedAt: "2026-09-14",
    theme: { fonts: "Archivo / IBM Plex Mono", accent: "#3b60c5", supportsDarkMode: false },
    pages: [{ path: "", label: "Home" }],
    thumbnail: "/previews/skerry.jpg",
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

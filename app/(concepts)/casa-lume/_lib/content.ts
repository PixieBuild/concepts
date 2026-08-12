export const IMAGE_BASE = "/concepts/casa-lume";

export type Photo = { src: string; alt: string };

export type Room = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  longDescription: string[];
  priceFrom: number;
  guests: number;
  size: string;
  view: string;
  bed: string;
  amenities: string[];
  photo: Photo;
  card: string;
  gallery: Photo[];
};

export const ROOMS: Room[] = [
  {
    slug: "garden-suite",
    name: "Garden Suite",
    tagline: "Ground floor, opening onto the lemon terrace",
    description:
      "A cool, shuttered room on the garden level, with a private terrace under the lemon trees.",
    longDescription: [
      "The Garden Suites occupy the oldest part of the house, where the walls are thick enough to keep the afternoon out. Lime plaster, a beamed ceiling, and floors of reclaimed Ligurian terracotta that stay cool underfoot all summer.",
      "Glass doors open onto a private terrace shaded by lemon trees the family planted in the 1950s. Breakfast is served here if you ask, usually around nine, usually without a menu.",
    ],
    priceFrom: 420,
    guests: 2,
    size: "38 m²",
    view: "Lemon garden",
    bed: "King or twin",
    amenities: [
      "Private garden terrace",
      "Rain shower in Carrara marble",
      "Hand-thrown ceramics by a Vernazza potter",
      "Linen by Società Anonima",
      "Nespresso and a stocked pantry",
      "Air conditioning",
    ],
    photo: { src: `${IMAGE_BASE}/room-garden.webp`, alt: "A shaded garden terrace with potted citrus" },
    card: `${IMAGE_BASE}/room-garden-card.webp`,
    gallery: [
      { src: `${IMAGE_BASE}/room-garden-bed.webp`, alt: "Bed dressed in white linen, morning light across the wall" },
      { src: `${IMAGE_BASE}/room-garden-terrace.webp`, alt: "A lemon tree on the private terrace above the sea" },
      { src: `${IMAGE_BASE}/room-garden-bath.webp`, alt: "Freestanding bath in a warm plastered bathroom" },
    ],
  },
  {
    slug: "sea-view-suite",
    name: "Sea View Suite",
    tagline: "First floor, with the whole gulf in the window",
    description:
      "Tall shuttered windows framing the gulf, a deep soaking tub, and light that moves across the room all day.",
    longDescription: [
      "On the first floor the ceilings lift and the windows grow tall. Each Sea View Suite faces due west across the gulf, which means the room fills with a long copper light for the last hour before sunset.",
      "There is a freestanding tub set where you can see the water from it, a writing desk that no one uses for work, and a pair of chairs angled toward the window rather than the television.",
    ],
    priceFrom: 620,
    guests: 2,
    size: "52 m²",
    view: "Open sea, west facing",
    bed: "King",
    amenities: [
      "Freestanding soaking tub",
      "West-facing balcony",
      "Separate dressing room",
      "Marble bathroom with double basin",
      "Evening aperitivo service",
      "Air conditioning",
    ],
    photo: { src: `${IMAGE_BASE}/room-seaview.webp`, alt: "A tall window framing the open sea" },
    card: `${IMAGE_BASE}/room-seaview-card.webp`,
    gallery: [
      { src: `${IMAGE_BASE}/room-seaview-interior.webp`, alt: "Suite interior with linen curtains and daylight" },
      { src: `${IMAGE_BASE}/room-seaview-tub.webp`, alt: "Freestanding tub set beside the window" },
      { src: `${IMAGE_BASE}/room-seaview-balcony.webp`, alt: "The balcony railing above the water" },
    ],
  },
  {
    slug: "signature-suite",
    name: "Casa Lume Signature",
    tagline: "The whole top floor, and the terrace above it",
    description:
      "Two rooms, a private roof terrace with a plunge pool, and the only view in the house that takes in both headlands.",
    longDescription: [
      "The Signature occupies what was the family's own floor. A sitting room, a bedroom behind heavy linen curtains, and a stair that climbs to a roof terrace no other guest can reach.",
      "Up there: a plunge pool, four sun beds, an outdoor shower, and the only vantage in the house that holds both headlands at once. Most guests take breakfast up and stay through lunch.",
    ],
    priceFrom: 1180,
    guests: 4,
    size: "96 m²",
    view: "Panoramic, both headlands",
    bed: "King plus sofa bed",
    amenities: [
      "Private roof terrace",
      "Plunge pool and outdoor shower",
      "Separate sitting room",
      "Dedicated house manager",
      "Airport transfer included",
      "Daily provisioning of your choosing",
    ],
    photo: { src: `${IMAGE_BASE}/room-signature.webp`, alt: "The roof terrace with loungers facing the sea" },
    card: `${IMAGE_BASE}/room-signature-card.webp`,
    gallery: [
      { src: `${IMAGE_BASE}/room-signature-sitting.webp`, alt: "Sitting room in quiet neutral tones" },
      { src: `${IMAGE_BASE}/room-signature-pool.webp`, alt: "The plunge pool on the private terrace" },
      { src: `${IMAGE_BASE}/room-signature-bed.webp`, alt: "Bedroom in linen and pale plaster" },
    ],
  },
  {
    slug: "olive-room",
    name: "Olive Room",
    tagline: "Tucked into the hillside, quietest in the house",
    description:
      "The smallest and most private room, set back into the terraces with a window full of olive branches.",
    longDescription: [
      "Built into the hill behind the main house, the Olive Room is the one guests return for. It is the smallest room we have and the one that books first.",
      "A single deep window looks straight into the olive terraces. You hear nothing but the cicadas and, twice a day, the bell in the village below.",
    ],
    priceFrom: 340,
    guests: 2,
    size: "28 m²",
    view: "Olive terraces",
    bed: "Queen",
    amenities: [
      "Deep window seat",
      "Walk-in shower",
      "Handmade wool throws",
      "Direct access to the hill path",
      "Air conditioning",
    ],
    photo: { src: `${IMAGE_BASE}/room-olive.webp`, alt: "A small white room under a beamed ceiling" },
    card: `${IMAGE_BASE}/room-olive-card.webp`,
    gallery: [
      { src: `${IMAGE_BASE}/room-olive-interior.webp`, alt: "The room in soft afternoon daylight" },
      { src: `${IMAGE_BASE}/room-olive-window.webp`, alt: "An open shutter over the roofs and the water" },
      { src: `${IMAGE_BASE}/room-olive-terraces.webp`, alt: "Olive branches backlit on the terraces" },
    ],
  },
];

export function getRoom(slug: string): Room | undefined {
  return ROOMS.find((room) => room.slug === slug);
}

export type Experience = {
  slug: string;
  name: string;
  category: string;
  duration: string;
  price: string;
  description: string;
  photo: Photo;
};

export const EXPERIENCES: Experience[] = [
  {
    slug: "spa",
    name: "The Spa at Casa Lume",
    category: "Wellness",
    duration: "60 – 120 minutes",
    price: "From €140",
    description:
      "Two treatment rooms in the old cellar, cut into the rock and kept cool without air conditioning. Oils pressed from the estate's own olives.",
    photo: { src: `${IMAGE_BASE}/spa.webp`, alt: "A treatment room cut into the old cellar" },
  },
  {
    slug: "infinity-pool",
    name: "The Infinity Pool",
    category: "The house",
    duration: "All day",
    price: "Included",
    description:
      "Set on the lowest terrace so the water meets the horizon. Twelve loungers, never more. Towels and a jug of something cold arrive without asking.",
    photo: { src: `${IMAGE_BASE}/pool.webp`, alt: "The pool edge meeting the horizon" },
  },
  {
    slug: "private-boat",
    name: "A Boat for the Day",
    category: "On the water",
    duration: "Half or full day",
    price: "From €680",
    description:
      "A restored 1970s gozzo and a skipper who grew up in the next bay. Swim off the coves that the ferries cannot reach, and lunch somewhere with no road to it.",
    photo: { src: `${IMAGE_BASE}/boat.webp`, alt: "A wooden boat on flat water at dusk" },
  },
  {
    slug: "coastal-hike",
    name: "The Headland Path",
    category: "Walking",
    duration: "3 hours",
    price: "From €90",
    description:
      "A guided walk out along the old mule track at first light, before the heat. Ends at a chapel above the water with coffee and focaccia.",
    photo: { src: `${IMAGE_BASE}/headland-path.webp`, alt: "The coastal path along the headland" },
  },
  {
    slug: "wine-tasting",
    name: "Vermentino & Sciacchetrà",
    category: "Food & wine",
    duration: "2 hours",
    price: "From €120",
    description:
      "Six wines from growers working the terraces within twenty kilometres, poured in the cellar by the person who made most of them.",
    photo: { src: `${IMAGE_BASE}/wine.webp`, alt: "Bottles resting in the cellar" },
  },
  {
    slug: "sunset-dinner",
    name: "Dinner on the Point",
    category: "Dining",
    duration: "Evening",
    price: "From €260 for two",
    description:
      "One table, carried out to the far terrace at seven. Five courses, no menu, and the sun going down behind Punta Mesco.",
    photo: { src: `${IMAGE_BASE}/sunset-dinner.webp`, alt: "A single table laid outdoors at sunset" },
  },
];

export type Testimonial = {
  quote: string;
  name: string;
  origin: string;
  rating: number;
};

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "We came for four nights and changed our flights twice. By the third morning the kitchen knew how we took our coffee and had stopped asking.",
    name: "Marguerite Ellery",
    origin: "London",
    rating: 5,
  },
  {
    quote:
      "I have stayed in larger hotels on this coast and remembered none of them. This one I could draw from memory — the stair, the smell of the cellar, the light at six.",
    name: "Tomas Lindqvist",
    origin: "Stockholm",
    rating: 5,
  },
  {
    quote:
      "It is not a hotel that performs for you. Nothing is announced. Things simply appear at the moment you were about to want them.",
    name: "Anaïs Reverdy",
    origin: "Lyon",
    rating: 5,
  },
];

export const GALLERY = [
  { src: `${IMAGE_BASE}/village-dusk.webp`, alt: "The village below the house at dusk", span: "md:col-span-12", ratio: "aspect-21/9" },

  { src: `${IMAGE_BASE}/terrace-last-light.webp`, alt: "The terrace at last light", span: "md:col-span-6", ratio: "aspect-3/2" },
  { src: `${IMAGE_BASE}/coastline.webp`, alt: "The coast below the olive terraces", span: "md:col-span-6", ratio: "aspect-3/2" },

  { src: `${IMAGE_BASE}/shutters-sq.webp`, alt: "Shutters closed against the afternoon", span: "md:col-span-4", ratio: "aspect-square" },
  { src: `${IMAGE_BASE}/wine-sq.webp`, alt: "Terracotta on a shelf in the hall", span: "md:col-span-4", ratio: "aspect-square" },
  { src: `${IMAGE_BASE}/bread-sq.webp`, alt: "Hands, focaccia, flour", span: "md:col-span-4", ratio: "aspect-square" },

  { src: `${IMAGE_BASE}/terrace-cliff.webp`, alt: "The house on the cliff above the water", span: "md:col-span-6", ratio: "aspect-4/5" },
  { src: `${IMAGE_BASE}/bathing-platform.webp`, alt: "The bathing platform, ninety steps down", span: "md:col-span-6", ratio: "aspect-4/5" },

  { src: `${IMAGE_BASE}/headland-path.webp`, alt: "The headland path at first light", span: "md:col-span-6", ratio: "aspect-3/2" },
  { src: `${IMAGE_BASE}/room-seaview.webp`, alt: "The Sea View Suite", span: "md:col-span-6", ratio: "aspect-3/2" },
] as const;

export const DINING = {
  restaurant: {
    name: "Sale",
    kicker: "The restaurant",
    description:
      "Twenty-six covers on the lower terrace. One menu each evening, written in the afternoon once the boats are in and the garden has been walked.",
    hours: [
      { label: "Breakfast", value: "7:30 – 10:30" },
      { label: "Lunch", value: "12:30 – 15:00" },
      { label: "Dinner", value: "19:30 – 22:00" },
    ],
  },
  bar: {
    name: "Bar Lume",
    kicker: "The bar",
    description:
      "A small marble counter off the courtyard, six stools, and a short list built on Ligurian vermouth, local citrus and things kept in the cellar too long.",
    hours: [
      { label: "Daily", value: "17:00 – late" },
      { label: "Aperitivo", value: "18:00 – 20:00" },
    ],
  },
};

export const NEARBY = [
  { name: "Monterosso al Mare", detail: "12 minutes by car, or 40 on the coast path" },
  { name: "Vernazza", detail: "20 minutes by car" },
  { name: "Portovenere", detail: "45 minutes by car, 25 by boat" },
  { name: "Punta Mesco headland", detail: "A 3 hour walk from the gate" },
];

export const TRAVEL = [
  { name: "Genoa Cristoforo Colombo", detail: "GOA · 1 hr 40 by car" },
  { name: "Pisa Galileo Galilei", detail: "PSA · 1 hr 50 by car" },
  { name: "Milan Malpensa", detail: "MXP · 3 hr 10 by car" },
  { name: "Monterosso station", detail: "15 minutes · we collect you" },
];

export const NAV_LINKS = [
  { href: "/rooms", label: "Rooms" },
  { href: "/dining", label: "Dining" },
  { href: "/experiences", label: "Experiences" },
  { href: "/gallery", label: "Gallery" },
  { href: "/location", label: "Location" },
];

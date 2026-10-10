export const BRAND = "Brèche";
export const IMAGE_BASE = "/concepts/breche";

export const COMPANY = {
  legal: "Brèche, compagnie de guides",
  street: "112 rue du Docteur Paccard",
  town: "74400 Chamonix-Mont-Blanc",
  phone: "+33 4 50 53 00 88",
  email: "bureau@breche.example",
  founded: 1994,
};

// The terms the company works on, in the notation a topo uses.

/** A commissioned photograph. Until the file lands, the slot holds its brief. */
export type Slot = { id: string; alt: string; tone: string; src?: string };

export const SLOTS = {
  valley: { id: "valley", alt: "The Chamonix valley at first light, the Aiguilles above the cloud", tone: "#8fa3b4", src: "valley.webp" },
  snowpack: { id: "snowpack", alt: "A snow pit dug into a slope, layers visible in the wall", tone: "#7d8e9c", src: "snowpack.webp" },
  office: { id: "office", alt: "The guides' office on rue Paccard before six in the morning", tone: "#6f7a80", src: "office.webp" },
} satisfies Record<string, Slot>;

export const TERMS = [
  { value: "1994", unit: "", label: "Guiding from the same office on rue Paccard" },
  { value: "12", unit: "guides", label: "Every one of them carries the IFMGA carnet" },
  { value: "2", unit: "to 1", label: "Climbers to a guide on rock and ice, never more" },
  { value: "3 842", unit: "m", label: "The lift we start from, most mornings of the season" },
];

export type Objective = {
  name: string;
  massif: string;
  discipline: string;
  cotation: string;
  days: number;
  summit: number;
  ascent: number;
  season: string;
  from: number;
  ratio: string;
  slot: Slot;
};

export const OBJECTIVES: Objective[] = [
  { name: "Cosmiques Arête", massif: "Aiguille du Midi", discipline: "Rock and snow", cotation: "AD−", days: 1, summit: 3842, ascent: 180, season: "Jun–Sep", from: 480, ratio: "2:1", slot: { id: "cosmiques", alt: "A climber on the granite blocks of the Cosmiques Arête, the valley two kilometres below", tone: "#7f8c97", src: "cosmiques.webp" } },
  { name: "Mont Blanc, Goûter", massif: "Mont Blanc", discipline: "Snow", cotation: "PD+", days: 3, summit: 4808, ascent: 2300, season: "Jun–Sep", from: 2150, ratio: "1:1", slot: { id: "gouter", alt: "A roped party on the summit snows of Mont Blanc at dawn", tone: "#9aa9b6", src: "gouter.webp" } },
  { name: "Vallée Blanche", massif: "Mer de Glace", discipline: "Ski", cotation: "F", days: 1, summit: 3842, ascent: 0, season: "Dec–May", from: 420, ratio: "4:1", slot: { id: "vallee", alt: "A skier turning on the Glacier du Géant, seracs behind", tone: "#a8b7c2", src: "vallee.webp" } },
  { name: "Petite Aiguille Verte", massif: "Argentière", discipline: "Snow", cotation: "F+", days: 1, summit: 3512, ascent: 450, season: "Jun–Sep", from: 380, ratio: "3:1", slot: { id: "petite-verte", alt: "Beginners learning crampon technique on a gentle snow slope", tone: "#93a0a8", src: "petite-verte.webp" } },
  { name: "Argentière couloirs", massif: "Argentière basin", discipline: "Ice", cotation: "D", days: 2, summit: 3450, ascent: 600, season: "Mar–Jun", from: 990, ratio: "1:1", slot: { id: "argentiere", alt: "Steep blue ice in a north-facing couloir above the Argentière glacier", tone: "#6b7b8a", src: "argentiere.webp" } },
  { name: "Haute Route", massif: "Chamonix–Zermatt", discipline: "Ski touring", cotation: "PD", days: 6, summit: 3796, ascent: 1400, season: "Mar–May", from: 2980, ratio: "4:1", slot: { id: "haute-route", alt: "Ski tourers crossing a glacier plateau, a hut small in the distance", tone: "#9fadb8", src: "haute-route.webp" } },
];

export const CONDITIONS = {
  updated: "2026-09-15T18:00:00+02:00",
  updatedLabel: "Monday 15 September, 18:00",
  author: "Olivier Rey",
  headline: "Cold nights have brought the Goûter back into condition.",
  risk: { level: 1, label: "Low", scale: "Météo-France, above 2 200 m", slot: { id: "olivier", alt: "Portrait of mountain guide Olivier Rey, outdoors in the Alps", tone: "#7d766c", src: "olivier.webp" } },
  readings: [
    { label: "Freezing level", value: "3 150", unit: "m", note: "overnight, 4 000 m by afternoon" },
    { label: "Snow line", value: "3 000", unit: "m", note: "north faces only" },
    { label: "Wind, 4 000 m", value: "25", unit: "km/h", note: "west, easing Wednesday" },
    { label: "Grand Couloir", value: "Quiet", unit: "", note: "cross before 09:00 regardless" },
  ],
  log: [
    { date: "15 Sep", text: "Cosmiques dry and busy from eight. Take the first lift and you have it to yourselves for an hour." },
    { date: "13 Sep", text: "Two parties turned back on the Bosses in 60 km/h wind. The forecast was right; the summit was not worth it." },
    { date: "11 Sep", text: "First proper snow above 3 400 m. Crampons back on for the Petite Verte." },
  ],
};

export type Guide = { name: string; since: number; note: string; slot: Slot };

export const GUIDES: Guide[] = [
  { name: "Olivier Rey", since: 1994, note: "Four hundred summits of Mont Blanc", slot: { id: "olivier", alt: "Portrait of mountain guide Olivier Rey, outdoors in the Alps", tone: "#7d766c", src: "olivier.webp" } },
  { name: "Jean-Marc Favre", since: 1994, note: "Trained half the valley's rescue volunteers", slot: { id: "jean-marc", alt: "Portrait of mountain guide Jean-Marc Favre, outdoors in the Alps", tone: "#6f6a62", src: "jean-marc.webp" } },
  { name: "Nadia Brun", since: 2004, note: "Sixty crossings of the Haute Route", slot: { id: "nadia", alt: "Portrait of mountain guide Nadia Brun, outdoors in the Alps", tone: "#857d72", src: "nadia.webp" } },
  { name: "Camille Berthod", since: 2009, note: "Skis more days a year than anyone here", slot: { id: "camille", alt: "Portrait of mountain guide Camille Berthod, outdoors in the Alps", tone: "#8a8478", src: "camille.webp" } },
  { name: "Sarah Lenoir", since: 2012, note: "Ice, and the patience to teach it", slot: { id: "sarah", alt: "Portrait of mountain guide Sarah Lenoir, outdoors in the Alps", tone: "#79736a", src: "sarah.webp" } },
  { name: "Tom Estève", since: 2019, note: "Most requested for a first summit", slot: { id: "tom", alt: "Portrait of mountain guide Tom Estève, outdoors in the Alps", tone: "#837c70", src: "tom.webp" } },
];

// The massif itself, sampled from public elevation tiles (AWS terrarium, z12) and
// re-encoded to two bytes per pixel. Bounds are what the crop actually covers.
export const TERRAIN = {
  file: `${IMAGE_BASE}/heightmap.png`,
  west: 6.6796875,
  east: 7.03125,
  south: 45.73685954736048,
  north: 45.98169518512227,
  min: 556,
  max: 4791,
  /** Kilometres across the sampled square, at this latitude. */
  span: 27.3,
  /** Vertical exaggeration, the way a relief model overstates a range. */
  relief: 1.55,
};

export type Waypoint = { lat: number; lon: number; altitude: number; place: string; at: string; note: string; label?: boolean };

// The Goûter route, the ordinary way up Mont Blanc, in real coordinates.
export const ROUTE: Waypoint[] = [
  { lat: 45.9237, lon: 6.8694, altitude: 1035, place: "Chamonix", at: "Day 1", note: "Kit check at the office, and an acclimatisation summit before anything is decided.", label: true },
  { lat: 45.8836, lon: 6.7869, altitude: 2372, place: "Nid d'Aigle", at: "Day 2, 10:30", note: "The tramway leaves you here. Four hours of ascent to the hut, carrying what you need.", label: true },
  { lat: 45.8558, lon: 6.8203, altitude: 3167, place: "Grand Couloir", at: "Day 2, 12:40", note: "The crossing everyone writes about. Timed for when the rockfall is quietest, one at a time." },
  { lat: 45.8525, lon: 6.8317, altitude: 3835, place: "Goûter hut", at: "Day 2, 15:00", note: "Soup at six, asleep by eight, boots on at one in the morning.", label: true },
  { lat: 45.842, lon: 6.848, altitude: 4362, place: "Dôme du Goûter", at: "Day 3, 05:40", note: "First light, and where we decide whether the wind on the Bosses will let us finish." },
  { lat: 45.8326, lon: 6.8652, altitude: 4808, place: "Summit", at: "Day 3, 07:20", note: "Twenty minutes, if the weather gives them. Then the long way down.", label: true },
];

export const HERO = {
  lead: "Guided climbs",
  trail: "on the Mont Blanc massif",
  place: "Chamonix-Mont-Blanc, Haute-Savoie",
  headline: "Guided climbs on the Mont Blanc massif.",
  standfirst: "Twelve IFMGA guides working out of one office in Chamonix. Two climbers to a guide on rock and ice, and the day decided the evening before, on conditions.",
  primary: "Ring the office",
  secondary: "See what we run",
};

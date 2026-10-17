import { grouped, metres } from "./format";

export const BRAND = "Brèche";
export const IMAGE_BASE = "/concepts/breche";

export const COMPANY = {
  legal: "Brèche, compagnie de guides",
  street: "112 rue du Docteur Paccard",
  town: "74400 Chamonix-Mont-Blanc",
  phone: "+33 4 65 71 19 94",
  email: "bureau@breche.example",
  founded: 1994,
  hours: { opens: "08:00", closes: "19:00", label: "08:00–19:00, every day" },
  geo: { lat: 45.9237, lon: 6.8694, altitude: 1035 },
};

/** `focus` is the CSS object-position that keeps the subject in frame when the photo is cropped. */
export type Slot = { id: string; alt: string; tone: string; src: string; focus?: string };

export const SLOTS = {
  valley: { id: "valley", alt: "The Chamonix Aiguilles at first light, pink on the summits, above a valley filled with cloud", tone: "#646973", src: "valley.webp", focus: "62% 45%" },
  snowpack: { id: "snowpack", alt: "A gloved hand holding a crystal card against the layers of a snow-pit wall, a notebook and thermometer beside it", tone: "#454d5b", src: "snowpack.webp", focus: "45% 45%" },
  office: { id: "office", alt: "A stone shopfront on a wet cobbled street at blue hour, its window lit and hung with ropes, the Aiguilles above", tone: "#3c3e45", src: "office.webp", focus: "68% 55%" },
} satisfies Record<string, Slot>;

export type Objective = {
  name: string;
  massif: string;
  discipline: string;
  cotation: string;
  days: number;
  /** The altitude that matters, and what to call it: a descent starts high rather than summits. */
  summit: number;
  summitLabel: "Summit" | "Start" | "Top" | "High point";
  ascent: number;
  descent?: number;
  season: string;
  months: number[];
  /** Per person, in a party of `party` climbers to one guide. */
  price: number;
  party: number;
  basis: string;
  extras: string;
  brief: string;
  asks: string;
  slot: Slot;
};

export const OBJECTIVES: Objective[] = [
  {
    name: "Cosmiques Arête",
    massif: "Aiguille du Midi",
    discipline: "Rock and snow",
    cotation: "AD−",
    days: 1,
    summit: 3842,
    summitLabel: "Top",
    ascent: 300,
    season: "Jun–Oct",
    months: [6, 7, 8, 9, 10],
    price: 340,
    party: 2,
    basis: "per person, two climbers to the guide",
    extras: "Aiguille du Midi lift extra",
    brief: "The best short alpine climb in Chamonix: down the Midi snow ridge, along the granite of the arête, and up a ladder onto the lift terrace. Back in town for a late lunch.",
    asks: "Comfortable on a 4c rock climb and easy with exposure. Crampons on the snow sections; we teach what you need on the ridge.",
    slot: { id: "cosmiques", alt: "A roped climber moving along a granite ridge, the Chamonix valley far below", tone: "#7f8c97", src: "cosmiques.webp", focus: "62% 55%" },
  },
  {
    name: "Mont Blanc, Goûter",
    massif: "Mont Blanc",
    discipline: "Snow",
    cotation: "PD+",
    days: 3,
    summit: 4808,
    summitLabel: "Summit",
    ascent: 2440,
    season: "Jun–Sep",
    months: [6, 7, 8, 9],
    price: 2150,
    party: 1,
    basis: "per person, one climber to the guide",
    extras: "Hut and tramway extra",
    brief: "An acclimatisation summit, the tramway to the Nid d’Aigle and up to the hut, then the top at first light by the Dôme and the Bosses. One guide, one climber, the whole way.",
    asks: `Six hours uphill with a pack, and a night above ${metres(3000)} in the month before. We check both before we confirm the dates.`,
    slot: { id: "gouter", alt: "Two climbers roped together on a broad snow ridge at dawn, a sea of cloud below", tone: "#9aa9b6", src: "gouter.webp", focus: "48% 62%" },
  },
  {
    name: "Vallée Blanche",
    massif: "Mer de Glace",
    discipline: "Ski",
    cotation: "F",
    days: 1,
    summit: 3842,
    summitLabel: "Start",
    ascent: 0,
    descent: 2000,
    season: "Dec–May",
    months: [12, 1, 2, 3, 4, 5],
    price: 120,
    party: 4,
    basis: "per person, four skiers to the guide",
    extras: "Lift, train and ski hire extra",
    brief: "Twenty kilometres of glacier from the top of the Midi to Montenvers, past the Géant icefall and under the Requin. Never steep; serious for what lies under the snow.",
    asks: "Confident on red runs in any snow, and steady walking the Midi ridge in ski boots.",
    slot: { id: "vallee", alt: "A skier turning on smooth snow below the blue seracs of a glacier icefall", tone: "#a8b7c2", src: "vallee.webp", focus: "38% 72%" },
  },
  {
    name: "Petite Aiguille Verte",
    massif: "Argentière",
    discipline: "Snow",
    cotation: "F+",
    days: 1,
    summit: 3512,
    summitLabel: "Summit",
    ascent: 450,
    season: "Jun–Sep",
    months: [6, 7, 8, 9],
    price: 210,
    party: 3,
    basis: "per person, three climbers to the guide",
    extras: "Grands Montets lift extra",
    brief: "The first real summit for most people we take up: a short snow ridge, a few rock steps, and the whole Argentière basin below you. A fair test before anything bigger.",
    asks: "Good hill fitness and nothing else. Crampons and axe are taught on the day.",
    slot: { id: "petite-verte", alt: "A guide watching three climbers with ice axes work up a snow slope below an icefall", tone: "#93a0a8", src: "petite-verte.webp", focus: "50% 66%" },
  },
  {
    name: "Argentière couloirs",
    massif: "Argentière basin",
    discipline: "Ice",
    cotation: "D",
    days: 2,
    summit: 3450,
    summitLabel: "Top",
    ascent: 600,
    season: "Oct–Nov, Mar–Jun",
    months: [10, 11, 3, 4, 5, 6],
    price: 990,
    party: 1,
    basis: "per person, one climber to the guide",
    extras: "Hut and lift extra",
    brief: "Two days of steep ice in the north-facing goulottes above the Argentière glacier, with a night at the hut between them. The line is chosen the evening before, from what has actually formed.",
    asks: "Seconding WI3 with confidence, and a long day in cold, shaded ground.",
    slot: { id: "argentiere", alt: "A climber in an orange jacket at the foot of a frozen icefall between dark rock walls", tone: "#6b7b8a", src: "argentiere.webp", focus: "40% 78%" },
  },
  {
    name: "Haute Route",
    massif: "Chamonix–Zermatt",
    discipline: "Ski touring",
    cotation: "PD",
    days: 6,
    summit: 3796,
    summitLabel: "High point",
    ascent: 6200,
    season: "Mar–May",
    months: [3, 4, 5],
    price: 1890,
    party: 4,
    basis: "per person, four skiers to the guide",
    extras: "Huts and the train home extra",
    brief: "Six days on skis from Chamonix to Zermatt, hut to hut across the glaciers between France and Switzerland, finishing under the Matterhorn.",
    asks: `Fit for ${metres(1200)} of skinning a day, six days running, and steady off-piste skiing with a pack.`,
    slot: { id: "haute-route", alt: "Four ski tourers skinning across a white glacier plateau, a stone hut on a rock island beyond", tone: "#9fadb8", src: "haute-route.webp", focus: "62% 66%" },
  },
];

export function inSeason(objective: Objective, month: number): boolean {
  return objective.months.includes(month);
}

type RosterGuide = { name: string; since: number; speciality: string };
type Guide = RosterGuide & { note: string; slot: Slot };

/** `since` is the year each guide qualified. */
export const GUIDES: Guide[] = [
  { name: "Olivier Rey", since: 1994, speciality: "Mont Blanc", note: "Four hundred ascents of Mont Blanc", slot: { id: "olivier", alt: "Olivier Rey by a window in the office, ropes and a mountain print on the wall behind him", tone: "#49413b", src: "olivier.webp", focus: "55% 32%" } },
  { name: "Jean-Marc Favre", since: 1994, speciality: "Crevasse rescue", note: "Trained half the valley’s rescue volunteers", slot: { id: "jean-marc", alt: "Jean-Marc Favre coiling a rope on a boulder field below a granite face", tone: "#6f6a62", src: "jean-marc.webp", focus: "48% 30%" } },
  { name: "Nadia Brun", since: 2004, speciality: "Ski touring", note: "Sixty crossings of the Haute Route", slot: { id: "nadia", alt: "Nadia Brun beside her skis on a snowy top, looking out over a glacier valley", tone: "#857d72", src: "nadia.webp", focus: "30% 45%" } },
  { name: "Camille Berthod", since: 2009, speciality: "Off-piste skiing", note: "Skis more days a year than anyone here", slot: { id: "camille", alt: "Camille Berthod on a hut bench with a tin mug, snowfields behind her", tone: "#8a8478", src: "camille.webp", focus: "62% 30%" } },
  { name: "Sarah Lenoir", since: 2012, speciality: "Ice and mixed", note: "Ice, and the patience to teach it", slot: { id: "sarah", alt: "Sarah Lenoir close up in a frosted helmet, ice in her hair", tone: "#4a4d58", src: "sarah.webp", focus: "50% 40%" } },
  { name: "Tom Estève", since: 2019, speciality: "First summits", note: "Most requested for a first summit", slot: { id: "tom", alt: "Tom Estève leaning in a doorway on a wet cobbled village street, a snowy peak at its end", tone: "#837c70", src: "tom.webp", focus: "62% 30%" } },
];

export const ROSTER: RosterGuide[] = [
  { name: "Mathieu Dubreuil", since: 1998, speciality: "Rock on the Chamonix Aiguilles" },
  { name: "Élodie Perrin", since: 2001, speciality: "Families and first glacier days" },
  { name: "Antoine Morand", since: 2006, speciality: "North faces in the Argentière basin" },
  { name: "Julien Ancey", since: 2011, speciality: "Avalanche courses" },
  { name: "Clara Fournier", since: 2015, speciality: "Ski mountaineering" },
  { name: "Hugo Vallet", since: 2021, speciality: "Granite on the Italian side" },
];

export type Season = "summer" | "autumn" | "winter";

export type Danger = { level: 1 | 2 | 3 | 4 | 5; label: string; scale: string; where: string };

type Reading = { label: string; value: string; unit: string; note: string };

export type Bulletin = {
  season: Season;
  seasonLabel: string;
  issued: { iso: string; label: string; time: string };
  author: string;
  headline: string;
  summary: string;
  /** Metres, so the hero's terrain can draw the same snow line the bulletin reports. */
  freezingLevel: number;
  snowLine: number;
  danger: Danger | null;
  dangerNote: string;
  readings: Reading[];
  running: string[];
  log: { iso: string; date: string; text: string }[];
};

const ZONE = "Europe/Paris";
const DAY = 86_400_000;

const parts = (date: Date, options: Intl.DateTimeFormatOptions) =>
  Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: ZONE, ...options }).formatToParts(date).map((p) => [p.type, p.value]));
const longDay = new Intl.DateTimeFormat("en-GB", { timeZone: ZONE, weekday: "long", day: "numeric", month: "long" });
const shortDay = new Intl.DateTimeFormat("en-GB", { timeZone: ZONE, weekday: "short", day: "numeric", month: "short" });
const weekday = new Intl.DateTimeFormat("en-GB", { timeZone: ZONE, weekday: "long" });

const isoDate = (date: Date) => {
  const { year, month, day } = parts(date, { year: "numeric", month: "2-digit", day: "2-digit" });
  return `${year}-${month}-${day}`;
};

function seasonOf(month: number): Season {
  if (month >= 6 && month <= 9) return "summer";
  if (month >= 10 && month <= 11) return "autumn";
  return "winter";
}

type Draft = Omit<Bulletin, "season" | "issued" | "running" | "log"> & { log: { daysBefore: number; text: string }[] };

// `on(n)` names the weekday n days after the bulletin was written.
const DRAFTS: Record<Season, (on: (n: number) => string) => Draft> = {
  summer: (on) => ({
    seasonLabel: "Summer",
    author: "Olivier Rey",
    headline: "Cold nights have the Goûter in condition. Go early, and go light.",
    summary:
      "Two clear nights in a row have refrozen the Grand Couloir and the snow above the hut. The weather holds until the weekend, so Mont Blanc parties take the tramway as planned. The Cosmiques is dry, and busy from the second car.",
    freezingLevel: 3650,
    snowLine: 3000,
    danger: null,
    dangerNote: "In summer we judge the overnight refreeze ourselves.",
    readings: [
      { label: "Freezing level", value: grouped(3650), unit: "m", note: `overnight; ${metres(4300)} by mid-afternoon` },
      { label: "Snow line", value: grouped(3000), unit: "m", note: `north faces; south faces dry to ${metres(3400)}` },
      { label: `Wind, ${metres(4000)}`, value: "25", unit: "km/h", note: `west, easing ${on(2)}` },
      { label: "Grand Couloir", value: "Quiet", unit: "", note: "cross before 09:00 regardless" },
    ],
    log: [
      { daysBefore: 0, text: "Cosmiques dry and busy from eight. Take the first car and you have the arête to yourselves for an hour." },
      { daysBefore: 2, text: "Two parties turned back on the Bosses in 60 km/h of wind. The forecast was right, and the summit wasn’t worth it." },
      { daysBefore: 4, text: `A storm left ten centimetres above ${metres(3400)}. Crampons back on for the Petite Verte; the Cosmiques step is slow until it melts off.` },
    ],
  }),
  autumn: (on) => ({
    seasonLabel: "Autumn",
    author: "Sarah Lenoir",
    headline: "Short days, dry granite, and nobody else on the ridges.",
    summary:
      "The Goûter hut has closed and Mont Blanc is finished until June. What autumn gives back is the Midi to yourselves: the Cosmiques goes from the first car on dry rock, and the north faces above Argentière are starting to hold ice. Plan to be off the glacier by four; the valley is in shade long before sunset.",
    freezingLevel: 2900,
    snowLine: 2400,
    danger: null,
    dangerNote: "After fresh snow we dig a pit before anyone steps onto a slope.",
    readings: [
      { label: "Freezing level", value: grouped(2900), unit: "m", note: `falling to ${metres(2300)} by ${on(3)}` },
      { label: "Snow line", value: grouped(2400), unit: "m", note: `north faces; south faces dry to ${metres(3000)}` },
      { label: `Wind, ${metres(4000)}`, value: "40", unit: "km/h", note: "north-west, gusting on the ridges" },
      { label: "Glacier", value: "Bare", unit: "", note: `crevasses open to ${metres(3000)}; rope up from the first step` },
    ],
    log: [
      { daysBefore: 0, text: "Cosmiques dry from the first car. Cold hands on the abseil until eleven, warm on the step across. Two ropes on the whole arête." },
      { daysBefore: 2, text: `Fifteen centimetres overnight, down to ${metres(2600)}. We called off the Midi–Plan: fresh snow on old ice, and no sun on the ridge until noon.` },
      { daysBefore: 5, text: "Looked at the north faces from the Argentière glacier. The couloirs are white but not yet ice. Another fortnight of cold nights and they will go." },
    ],
  }),
  winter: (on) => ({
    seasonLabel: "Winter and spring",
    author: "Nadia Brun",
    headline: `Good cold snow above ${metres(2500)}. The wind slabs are where the trouble is.`,
    summary:
      "Thirty centimetres fell on a north wind and it has drifted onto the south and east slopes. The Vallée Blanche is tracked and skiing well by the normal route; we are keeping off the variants, and off anything steep facing the sun, until it settles.",
    freezingLevel: 1400,
    snowLine: 1035,
    danger: { level: 3, label: "Considerable", scale: "Météo-France, Mont Blanc massif", where: `above ${metres(2200)}, on south and east slopes` },
    dangerNote: "Météo-France sets the level. Which slopes we ski is our call.",
    readings: [
      { label: "Freezing level", value: grouped(1400), unit: "m", note: `rising to ${metres(2100)} by ${on(2)}` },
      { label: "Snow line", value: grouped(1035), unit: "m", note: "down to the valley floor in Chamonix" },
      { label: `Wind, ${metres(4000)}`, value: "50", unit: "km/h", note: "north, dropping overnight" },
      { label: "Fresh snow, 72 h", value: "30", unit: "cm", note: "drifted onto south and east slopes" },
    ],
    log: [
      { daysBefore: 0, text: "Vallée Blanche by the normal route, four groups out. Cold snow under the Requin and a firm track down to the Salle à Manger." },
      { daysBefore: 1, text: "A slab cracked under skis on the Col du Passon traverse. We turned and skied out the way we came, which is what the bulletin said to do." },
      { daysBefore: 3, text: "Thirty centimetres overnight. Nobody went up; the morning was a transceiver session in the field behind the office." },
    ],
  }),
};

/** The bulletin a visitor would read on `date`: written at 18:00 Chamonix time, for the next day. */
export function conditionsFor(date: Date): Bulletin {
  const { year, month, day, hour } = parts(date, { year: "numeric", month: "numeric", day: "numeric", hour: "numeric", hourCycle: "h23" });
  const today = Date.UTC(Number(year), Number(month) - 1, Number(day), 12);
  const written = new Date(Number(hour) < 18 ? today - DAY : today);
  const writtenMonth = Number(parts(written, { month: "numeric" }).month);
  const season = seasonOf(writtenMonth);
  const offset = parts(new Date(written.getTime() + 4 * 3_600_000), { timeZoneName: "longOffset" }).timeZoneName.replace("GMT", "") || "+00:00";
  const draft = DRAFTS[season]((n) => weekday.format(new Date(written.getTime() + n * DAY)));

  return {
    ...draft,
    season,
    issued: { iso: `${isoDate(written)}T18:00:00${offset}`, label: longDay.format(written), time: "18:00" },
    running: OBJECTIVES.filter((objective) => inSeason(objective, writtenMonth)).map((objective) => objective.name),
    log: draft.log.map(({ daysBefore, text }) => {
      const at = new Date(written.getTime() - daysBefore * DAY);
      return { iso: isoDate(at), date: shortDay.format(at), text };
    }),
  };
}

// AWS terrarium z12 elevation (4 × 4 tiles, 1024², Web Mercator, rows north to south): metres above
// `min` as red × 256 + green, OpenStreetMap glacier outlines in blue.
export const TERRAIN = {
  file: `${IMAGE_BASE}/heightmap.webp`,
  size: 1024,
  west: 6.6796875,
  east: 7.03125,
  south: 45.73685954736048,
  north: 45.98169518512227,
  min: 555,
  max: 4790,
  /** Kilometres across the sampled square, at this latitude. */
  span: 27.3,
  /** Vertical exaggeration, kept low so the summit stays the broad dome guides know from the north. */
  relief: 1.2,
};

/** `label`: carries a spot height on the terrain. `via` shapes the leg that arrives here;
    `lift` marks a leg covered by cable car and tramway rather than on foot. */
type Waypoint = {
  lat: number;
  lon: number;
  altitude: number;
  place: string;
  at: string;
  note: string;
  label?: boolean;
  via?: [lat: number, lon: number][];
  lift?: boolean;
};

// The Goûter route, the ordinary way up Mont Blanc, in real coordinates checked against the DEM.
export const ROUTE: Waypoint[] = [
  { lat: 45.9237, lon: 6.8694, altitude: 1035, place: "Chamonix", at: "Day 1", note: "Kit check at the office, then an acclimatisation summit first.", label: true },
  {
    lat: 45.8667,
    lon: 6.8058,
    altitude: 2372,
    place: "Nid d’Aigle",
    at: "Day 2, 10:30",
    note: "The tramway stops here. Four hours up to the hut.",
    label: true,
    lift: true,
    via: [
      [45.91, 6.845],
      [45.9016, 6.8317],
      [45.8906, 6.7989],
      [45.8743, 6.7895],
    ],
  },
  {
    lat: 45.8561,
    lon: 6.8233,
    altitude: 3270,
    place: "Grand Couloir",
    at: "Day 2, 12:40",
    note: "The famous crossing, timed for quiet rockfall, one at a time.",
    via: [[45.8641, 6.8131]],
  },
  {
    lat: 45.8488,
    lon: 6.8332,
    altitude: 3835,
    place: "Goûter hut",
    at: "Day 2, 15:00",
    note: "Soup at six, asleep by eight, boots on at three.",
    label: true,
    via: [[45.8527, 6.8268]],
  },
  {
    lat: 45.8422,
    lon: 6.8429,
    altitude: 4304,
    place: "Dôme du Goûter",
    at: "Day 3, 05:40",
    note: "First light. Here we decide if the wind lets us finish.",
    via: [[45.8454, 6.8402]],
  },
  {
    lat: 45.8326,
    lon: 6.8652,
    altitude: 4808,
    place: "Summit",
    at: "Day 3, 07:20",
    note: "Twenty minutes, if the weather gives them. Then the long way down.",
    label: true,
    via: [
      [45.8403, 6.846],
      [45.8378, 6.8525],
      [45.8352, 6.8575],
      [45.834, 6.8605],
    ],
  },
];

export const HERO = {
  lead: "Guided climbs",
  trail: "on the Mont Blanc massif",
  standfirst: "Twelve IFMGA guides, one Chamonix office, two climbers to a guide.",
  primary: "Ring the office",
  secondary: "See what we run",
};

// Below the climb: the route index, the objective sheets, the guides and the enquiry.

/** The shaded relief behind the route index, rendered offline from public elevation tiles (Web Mercator). */
export const RELIEF = { file: `${IMAGE_BASE}/relief.webp`, west: 6.75, east: 7.07, north: 45.995, south: 45.716414, width: 1200, height: 1500 };

export type LatLon = [lat: number, lon: number];
export type Moment = { at: string; text: string };

export type ObjectiveSheet = {
  /** The line drawn on the relief, valley end first; `onward` names where it runs off the map. */
  line: LatLon[];
  /** How many leading segments are lifts and trams rather than climbing; drawn dashed. */
  access?: number;
  mark: LatLon;
  onward?: string;
  days: Moment[];
  included: string[];
};

const MIDI: LatLon = [45.8786, 6.8873];
const GRANDS_MONTETS: LatLon = [45.9555, 6.979];
const ARGENTIERE_HUT: LatLon = [45.9478, 7.0081];

/** Keyed by each objective's photo id, which doubles as its slug. The Goûter's days come from ROUTE. */
export const SHEETS: Record<string, ObjectiveSheet> = {
  cosmiques: {
    line: [MIDI, [45.8752, 6.889], [45.8727, 6.8866], [45.874, 6.8846], [45.8775, 6.8858]],
    mark: MIDI,
    days: [
      { at: "07:00", text: `First car to the Midi. Crampons on in the ice tunnel, then down the snow arête to the col at ${metres(3532)}.` },
      { at: "08:00", text: "Across the Col du Midi to the foot of the ridge, below the Cosmiques hut." },
      { at: "08:30", text: "The arête itself: granite steps, a short abseil, and the 4c corner that is the crux." },
      { at: "11:30", text: "Up the ladder onto the lift terrace, among the visitors, and the car down for a late lunch." },
    ],
    included: ["Your guide for the day", "Harness, helmet, crampons and axe, if you need them", "The plan made the evening before, on the bulletin"],
  },
  gouter: {
    line: ROUTE.map((w): LatLon => [w.lat, w.lon]),
    access: 1,
    mark: [ROUTE[ROUTE.length - 1].lat, ROUTE[ROUTE.length - 1].lon],
    days: [],
    included: ["Your guide for three days, one to one", "The acclimatisation summit on day one", "Your guide’s hut night, lifts and tramway", "Harness, helmet, crampons and axe, if you need them"],
  },
  vallee: {
    line: [MIDI, [45.87, 6.895], [45.866, 6.906], [45.87, 6.923], [45.883, 6.933], [45.895, 6.935], [45.91, 6.931], [45.9283, 6.9186]],
    mark: MIDI,
    days: [
      { at: "08:00", text: "First car to the Midi, and down the arête on foot, roped, skis on the pack." },
      { at: "09:00", text: "The Col du Midi and the Gros Rognon, then the long run under the Requin." },
      { at: "11:30", text: "Lunch at the Requin hut, if the day allows it." },
      { at: "14:00", text: "Down the Mer de Glace to Montenvers, and the train back to town." },
    ],
    included: ["Your guide for the day", "Transceiver, shovel and probe", "Harness and the rope for the arête"],
  },
  "petite-verte": {
    line: [GRANDS_MONTETS, [45.9515, 6.9765], [45.9478, 6.9738]],
    mark: [45.9478, 6.9738],
    days: [
      { at: "08:00", text: "The Grands Montets lift from Argentière to the top station." },
      { at: "08:45", text: "Rope up and kick steps up the snow ridge, learning the axe and crampons as we go." },
      { at: "10:30", text: `The summit, ${metres(3512)}, and the whole Argentière basin below.` },
      { at: "12:30", text: "Back down the same ridge, and coffee at Lognan." },
    ],
    included: ["Your guide for the day", "Harness, helmet, crampons and axe", "A first lesson in moving roped together"],
  },
  argentiere: {
    line: [GRANDS_MONTETS, [45.952, 6.993], ARGENTIERE_HUT, [45.938, 7.01], [45.931, 7.012]],
    mark: [45.931, 7.012],
    days: [
      { at: "Day 1, 10:00", text: `The lift up, and down onto the glacier to the Argentière hut at ${metres(2771)}.` },
      { at: "Day 1, 16:00", text: "An afternoon with binoculars on the north faces. The line is picked from what has actually formed." },
      { at: "Day 2, 04:30", text: "Across the glacier by head torch to the foot of the couloir." },
      { at: "Day 2", text: "Six to eight pitches of ice, abseils back down, and out by the glacier before the light goes." },
    ],
    included: ["Your guide for two days, one to one", "Your guide’s hut night and lift", "Ice screws, ropes and the rack"],
  },
  "haute-route": {
    line: [GRANDS_MONTETS, [45.952, 6.993], [45.958, 7.017], [45.9635, 7.0325], [45.969, 7.055], [45.973, 7.07]],
    mark: [45.9635, 7.0325],
    onward: "to Zermatt",
    days: [
      { at: "Day 1", text: "The Grands Montets, the Col du Chardonnet and the Fenêtre de Saleina to the Trient hut." },
      { at: "Day 2", text: "Down to Champex, across the valley, and up to the Mont Fort hut." },
      { at: "Day 3", text: "The Rosablanche and the Col de Momin to Prafleuri." },
      { at: "Day 4", text: "Along the Lac des Dix to the Dix hut, under the north face of Mont Blanc de Cheilon." },
      { at: "Day 5", text: `Over the Pigne d’Arolla, the high point at ${metres(3796)}, to the Vignettes hut.` },
      { at: "Day 6", text: "Three cols in a day, and the long run down to Zermatt under the Matterhorn." },
    ],
    included: ["Your guide for six days, four skiers to the guide", "Your guide’s huts and transport", "Hut bookings made by the office"],
  },
};

export const VALLEY_CAPTION = {
  place: "The Aiguilles de Chamonix from Planpraz",
  when: "06:40, mid-October",
};

export const ELEVATION_CREDIT = "Terrain and relief from public elevation data: AWS Terrain Tiles (Mapzen), including SRTM and EU-DEM.";

export const OFFICE_FACTS = [
  { value: "1994", unit: "", label: "Guiding since" },
  { value: "12", unit: "", label: "IFMGA guides" },
  { value: "2:1", unit: "", label: "On rock and ice" },
  { value: grouped(3842), unit: "m", label: "Top of the first lift" },
];

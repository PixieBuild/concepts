export const BRAND = "Alder & Brass";
export const EST = 2009;
export const PHONE_DISPLAY = "(503) 555-0142";
export const PHONE_HREF = "tel:+15035550142";
export const EMAIL = "hello@alderandbrass.coffee";

export const ADDRESS = {
  line1: "214 Alder Street",
  line2: "Portland, Oregon 97204",
  short: "214 Alder Street · Portland, Ore.",
  maps: "https://maps.google.com/?q=214+Alder+Street+Portland+OR",
};

export const HOURS = [
  { day: "Monday to Friday", time: "7:00 – 18:00" },
  { day: "Saturday", time: "8:00 – 18:00" },
  { day: "Sunday", time: "8:00 – 15:00" },
];

export const NAV_LINKS = [
  { href: "#counter", label: "The counter", short: "Counter" },
  { href: "#roast", label: "This week's roast", short: "Roast" },
  { href: "#room", label: "The room", short: "Room" },
  { href: "#visit", label: "Find us", short: "Find us" },
];

export const IMAGE_BASE = "/concepts/alder-brass";

export const IMAGES = {
  cup: {
    src: `${IMAGE_BASE}/cup.webp`,
    alt: "The honey oat cortado in a small glass on a white saucer",
    cutout: true,
  },
  counter: {
    src: `${IMAGE_BASE}/plate-counter.webp`,
    alt: "The counter at a quarter past seven, the brass machine steaming and the first batch out of the roaster",
  },
  counterTall: {
    src: `${IMAGE_BASE}/plate-counter-tall.webp`,
    alt: "The counter at a quarter past seven, the brass machine steaming and the first batch out of the roaster",
  },
  archive: {
    src: `${IMAGE_BASE}/archive-2009.webp`,
    alt: "Mara and Tomas behind the new counter on opening day, 2009, the shop still half furnished",
  },
  door: {
    src: `${IMAGE_BASE}/plate-door.webp`,
    alt: "The green door and the shop window, from the pavement on Alder Street",
  },
  map: {
    src: `${IMAGE_BASE}/map.webp`,
    alt: "A hand-drawn map of the four blocks around Alder Street, the shop's door marked in green",
  },
  mark: `${IMAGE_BASE}/mark.webp`,
  dividers: [`${IMAGE_BASE}/divider-bean.webp`, `${IMAGE_BASE}/divider-leaf.webp`],
};

// Where the chalkboard sits in each hero photograph, as fractions of the image.
export const CHALKBOARD = {
  wide: { x: 0.53, y: 0.05, w: 0.215, h: 0.24 },
  tall: { x: 0.43, y: 0.16, w: 0.44, h: 0.2 },
};

export const CHALK_LINES = ["No. 041 Huila", "cola · red apple · panela", "out Friday"];

export const NOTES = {
  plate: "first batch out at 7:15 — T.",
  card: "oat milk in anything, just say — T.",
  archive: "opening day, 2009",
  map: "drawn by Mara, not to scale",
};

export const ROOM_SQUARES = [
  { src: `${IMAGE_BASE}/room-front.webp`, alt: "The front room in morning sun", caption: "The front room" },
  { src: `${IMAGE_BASE}/room-counter.webp`, alt: "A portafilter on a linen cloth at the counter", caption: "The counter" },
  { src: `${IMAGE_BASE}/room-table.webp`, alt: "The round table by the window with a French press", caption: "The table by the window" },
  { src: `${IMAGE_BASE}/room-roaster.webp`, alt: "Green beans going into the drum roaster", caption: "The roaster, rebuilt 2014" },
];

export const HOUSE_CUP = {
  number: "No. 1",
  name: "Honey oat cortado",
  price: "$4.50",
  short: "Double shot, toasted oat milk, a thread of wildflower honey.",
  body: "A double shot cut with toasted oat milk and a thread of raw wildflower honey. The house cup, and the one most regulars never get past.",
};

export const MENU = [
  {
    label: "Espresso",
    note: "House blend or the single origin on the board",
    items: [
      { name: "Espresso", price: "$3.00", desc: "Two ounces, thick crema" },
      { name: "Cortado", price: "$4.00", desc: "Equal parts shot and steamed milk" },
      { name: "Flat white", price: "$4.50", desc: "Silky microfoam, no dry top" },
      { name: "Cappuccino", price: "$4.50" },
      { name: "Oak mocha", price: "$5.25", desc: "Single-origin cocoa, house ganache" },
    ],
  },
  {
    label: "Filter & brew",
    note: "Single origins rotate weekly",
    items: [
      { name: "Hearth pour-over", price: "$5.00", desc: "Poured by hand, to order" },
      { name: "French press", price: "$4.50", desc: "For two, unhurried" },
      { name: "Batch brew", price: "$3.50", desc: "Bottomless before noon" },
      { name: "Barrel-aged cold brew", price: "$5.25", desc: "Eighteen hours, rested in charred oak" },
    ],
  },
  {
    label: "The other menu",
    items: [
      { name: "Golden milk", price: "$5.00", desc: "Turmeric, ginger, black pepper" },
      { name: "Hojicha latte", price: "$5.00", desc: "Roasted green tea, toasty" },
      { name: "Drinking chocolate", price: "$4.50" },
      { name: "Loose-leaf teas", price: "$4.00", desc: "Ask about the tin of the week" },
    ],
  },
  {
    label: "From the kitchen",
    note: "Baked in the back each morning",
    items: [
      { name: "Sourdough & cultured butter", price: "$6.00" },
      { name: "Morning bun", price: "$4.50", desc: "Orange, cardamom, sugar crust" },
      { name: "Seasonal galette", price: "$6.50", desc: "Whatever the market gave us" },
      { name: "Granola, yogurt & honey", price: "$7.00" },
    ],
  },
];

export const TIMELINE = [
  {
    year: "2009",
    text: "A secondhand Probat, a corner shop with good light, and a stubborn idea: coffee tastes better when nobody is rushing.",
  },
  {
    year: "2011",
    text: "The fluorescents came out. The oak shelving came in from a closed library in Sellwood, and the books came with it.",
  },
  {
    year: "2014",
    text: "The drum roaster. Cast iron, 1950s, twelve kilos a batch, rebuilt over one winter by a man named Gus.",
  },
  {
    year: "2019",
    text: "The kitchen opened. Sourdough, a morning bun, and a galette that changes with the market.",
  },
  {
    year: "2024",
    text: "Fifteen years. Same corner, same roaster, a few more chairs.",
  },
];

export const LOTS = [
  { no: "041", origin: "Huila, Colombia", process: "Washed", altitude: "1,750 m", cup: "Cola, red apple, panela" },
  { no: "040", origin: "Sidama, Ethiopia", process: "Natural", altitude: "2,100 m", cup: "Blueberry, bergamot, black tea" },
  { no: "039", origin: "Nyeri, Kenya", process: "Washed", altitude: "1,800 m", cup: "Blackcurrant, grapefruit" },
  { no: "038", origin: "Cajamarca, Peru", process: "Washed", altitude: "1,900 m", cup: "Milk chocolate, plum" },
  { no: "037", origin: "Minas Gerais, Brazil", process: "Pulped natural", altitude: "1,150 m", cup: "Hazelnut, brown sugar" },
];

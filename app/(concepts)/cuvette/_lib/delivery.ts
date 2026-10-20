import { POLICY } from "./content";

export type Zone = "PT" | "ES" | "EU";
export type Method = "standard" | "express";

export const COUNTRIES = {
  PT: { name: "Portugal", zone: "PT", postcode: /^\d{4}-\d{3}$/, example: "4050-123" },
  ES: { name: "Spain", zone: "ES", postcode: /^\d{5}$/, example: "28013" },
  FR: { name: "France", zone: "EU", postcode: /^\d{5}$/, example: "75011" },
  DE: { name: "Germany", zone: "EU", postcode: /^\d{5}$/, example: "10115" },
  IT: { name: "Italy", zone: "EU", postcode: /^\d{5}$/, example: "20121" },
  NL: { name: "Netherlands", zone: "EU", postcode: /^\d{4}\s?[A-Z]{2}$/i, example: "1012 AB" },
  BE: { name: "Belgium", zone: "EU", postcode: /^\d{4}$/, example: "1000" },
  AT: { name: "Austria", zone: "EU", postcode: /^\d{4}$/, example: "1010" },
  DK: { name: "Denmark", zone: "EU", postcode: /^\d{4}$/, example: "1050" },
  LU: { name: "Luxembourg", zone: "EU", postcode: /^(L-?)?\d{4}$/i, example: "1009" },
  IE: { name: "Ireland", zone: "EU", postcode: /^[AC-FHKNPRTV-Y]\d{2}\s?[0-9AC-FHKNPRTV-Y]{4}$/i, example: "D02 X285" },
} as const satisfies Record<string, { name: string; zone: Zone; postcode: RegExp; example: string }>;

export type Country = keyof typeof COUNTRIES;

/** A calendar day in Lisbon, as "YYYY-MM-DD". */
export type Day = string;

const lisbon = new Intl.DateTimeFormat("en-GB", {
  timeZone: POLICY.tz,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

/** Wall-clock date and time in Lisbon, whatever the viewer's own time zone. */
export function lisbonNow(now: Date): { day: Day; seconds: number } {
  const parts = Object.fromEntries(lisbon.formatToParts(now).map((p) => [p.type, p.value]));
  return { day: `${parts.year}-${parts.month}-${parts.day}`, seconds: Number(parts.hour) * 3600 + Number(parts.minute) * 60 + Number(parts.second) };
}

const toDate = (day: Day) => new Date(`${day}T12:00:00Z`);
const toDay = (date: Date): Day => date.toISOString().slice(0, 10);

function addDays(day: Day, n: number): Day {
  const date = toDate(day);
  date.setUTCDate(date.getUTCDate() + n);
  return toDay(date);
}

export function isWorkingDay(day: Day): boolean {
  const weekday = toDate(day).getUTCDay();
  return weekday !== 0 && weekday !== 6 && !(POLICY.holidays as readonly string[]).includes(day);
}

export function addWorkingDays(day: Day, n: number): Day {
  let next = day;
  for (let left = n; left > 0; ) {
    next = addDays(next, 1);
    if (isWorkingDay(next)) left--;
  }
  return next;
}

const CUTOFF_SECONDS = (() => {
  const [h, m] = POLICY.cutoff.split(":").map(Number);
  return h * 3600 + m * 60;
})();

/** The day an order placed `now` leaves Porto. */
export function dispatchDay(now: Date): Day {
  const { day, seconds } = lisbonNow(now);
  if (isWorkingDay(day) && seconds < CUTOFF_SECONDS) return day;
  return addWorkingDays(day, 1);
}

/** Milliseconds left to make today's dispatch, or null when today's van has gone. */
export function cutoffIn(now: Date): number | null {
  const { day, seconds } = lisbonNow(now);
  if (!isWorkingDay(day) || seconds >= CUTOFF_SECONDS) return null;
  return (CUTOFF_SECONDS - seconds) * 1000;
}

export function zoneOf(country: Country): Zone {
  return COUNTRIES[country].zone;
}

export type Eta = { dispatch: Day; earliest: Day; latest: Day };

/** Pure: call it after mount so server and client markup agree. */
export function eta(country: Country, method: Method, now: Date): Eta {
  const dispatch = dispatchDay(now);
  const [min, max] = POLICY.transit[method][zoneOf(country)];
  return { dispatch, earliest: addWorkingDays(dispatch, min), latest: addWorkingDays(dispatch, max) };
}

/** Delivery cost in cents. Standard is free over the threshold; express never is. */
export function shippingCost(country: Country, method: Method, subtotal: number): number {
  if (method === "standard" && subtotal >= POLICY.freeOver) return 0;
  return POLICY.rates[method][zoneOf(country)];
}

/** "Tue 20 Oct" */
export function formatDay(day: Day): string {
  return toDate(day).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}

/** "Tue 20 – Wed 21 Oct", or "Tue 20 Oct" for a single day. */
export function formatWindow({ earliest, latest }: Pick<Eta, "earliest" | "latest">): string {
  if (earliest === latest) return formatDay(earliest);
  const a = toDate(earliest);
  const b = toDate(latest);
  const sameMonth = a.getUTCMonth() === b.getUTCMonth();
  const start = a.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", ...(sameMonth ? {} : { month: "short" }), timeZone: "UTC" });
  return `${start} – ${formatDay(latest)}`;
}

/** "today", "tomorrow" or "Mon 19 Oct", relative to Lisbon's today. */
export function formatDispatch(dispatch: Day, now: Date): string {
  const today = lisbonNow(now).day;
  if (dispatch === today) return "today";
  if (dispatch === addDays(today, 1)) return "tomorrow";
  return formatDay(dispatch);
}

/** "3 h 12 min" */
export function formatCountdown(ms: number): string {
  const minutes = Math.max(1, Math.ceil(ms / 60000));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h} h ${m} min` : `${m} min`;
}

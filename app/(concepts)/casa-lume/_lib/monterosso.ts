const TIME_ZONE = "Europe/Rome";
const LAT = 44.146;
const LON = 9.654;
const RAD = Math.PI / 180;

const clockFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function localTime(date: Date): string {
  return clockFormat.format(date);
}

function romeDate(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

const mod = (v: number, m: number) => ((v % m) + m) % m;

// The NOAA almanac approximation: good to a minute or two, which is all a caption needs.
export function sunset(date: Date): Date {
  const { year, month, day } = romeDate(date);
  const midnight = Date.UTC(year, month - 1, day);
  const dayOfYear = Math.round((midnight - Date.UTC(year, 0, 0)) / 86_400_000);
  const lngHour = LON / 15;
  const t = dayOfYear + (18 - lngHour) / 24;
  const meanAnomaly = 0.9856 * t - 3.289;
  const longitude = mod(
    meanAnomaly + 1.916 * Math.sin(meanAnomaly * RAD) + 0.02 * Math.sin(2 * meanAnomaly * RAD) + 282.634,
    360,
  );
  let ascension = mod(Math.atan(0.91764 * Math.tan(longitude * RAD)) / RAD, 360);
  ascension += Math.floor(longitude / 90) * 90 - Math.floor(ascension / 90) * 90;
  const sinDec = 0.39782 * Math.sin(longitude * RAD);
  const cosDec = Math.cos(Math.asin(sinDec));
  const cosH = (Math.cos(90.833 * RAD) - sinDec * Math.sin(LAT * RAD)) / (cosDec * Math.cos(LAT * RAD));
  const hourAngle = Math.acos(Math.min(1, Math.max(-1, cosH))) / RAD / 15;
  const localMean = hourAngle + ascension / 15 - 0.06571 * t - 6.622;
  const utcHours = mod(localMean - lngHour, 24);
  return new Date(midnight + utcHours * 3_600_000);
}

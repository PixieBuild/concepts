const euros = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const wholeEuros = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const count = new Intl.NumberFormat("en-GB");

/** "€34.00" */
export function price(cents: number): string {
  return euros.format(cents / 100);
}

/** "€34" when whole, "€30.60" otherwise. For headlines and buttons where cents add noise. */
export function priceShort(cents: number): string {
  return cents % 100 === 0 ? wholeEuros.format(cents / 100) : price(cents);
}

/** EU unit price per litre: "€1,133.33 / l". */
export function unitPrice(cents: number, ml: number): string {
  return `${price(Math.round((cents / ml) * 1000))} / l`;
}

/** "1,284" */
export function formatCount(value: number): string {
  return count.format(value);
}

/** "15 Oct 2026" from an ISO date, fixed to UTC so server and client agree. */
export function formatDate(iso: string): string {
  return new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

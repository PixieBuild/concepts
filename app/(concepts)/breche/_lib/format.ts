const NBSP = " ";

const grouping = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const euros = new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

/** French digit grouping ("4 808"), joined by a narrow no-break space so a figure never splits. */
export function grouped(value: number): string {
  return grouping.format(Math.round(value));
}

export function metres(value: number): string {
  return `${grouped(value)}${NBSP}m`;
}

export function price(value: number): string {
  return euros.format(value);
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/** Where `v` sits between `from` and `to`, clamped to 0–1. */
export function between(v: number, from: number, to: number): number {
  return Math.min(1, Math.max(0, (v - from) / (to - from)));
}

export function smooth(v: number): number {
  return v * v * (3 - 2 * v);
}

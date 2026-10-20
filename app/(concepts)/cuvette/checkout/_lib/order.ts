import { useSyncExternalStore } from "react";

import { bagTotals, buyableLines, linePrice, samplesToShip, type Bag, type Totals } from "../../_lib/cart";
import type { ClientCatalog } from "../../_lib/client-catalog";
import { POLICY } from "../../_lib/content";
import type { Purchase, Slug } from "../../_lib/product";
import { eta, type Eta } from "../../_lib/delivery";
import type { Contact, Delivery } from "./schema";

export const ORDER_KEY = "cuvette:last-order";

/** Title and size are kept with the order, so the receipt still reads right if the product later leaves the store. */
export type OrderLine = { slug: Slug; title: string; purchase: Purchase; qty: number; total: number };

export type Order = {
  id: string;
  placedAt: string;
  contact: Contact;
  delivery: Delivery;
  lines: OrderLine[];
  samples: Slug[];
  sampleTitles: string[];
  samplesAutoPicked: boolean;
  gift: boolean;
  note: string;
  promo: string | null;
  totals: Totals;
  eta: Eta;
};

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/** CV-YYMMDD-XXXX on Lisbon's calendar, with no 0/O or 1/I to misread on the phone. */
export function orderNumber(now: Date): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: POLICY.tz, year: "2-digit", month: "2-digit", day: "2-digit" }).formatToParts(now).map((p) => [p.type, p.value]),
  );
  const tail = Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => ALPHABET[b % ALPHABET.length]).join("");
  return `CV-${parts.year}${parts.month}${parts.day}-${tail}`;
}

export function buildOrder(bag: Bag, catalog: ClientCatalog, contact: Contact, delivery: Delivery, now: Date): Order {
  const { slugs, autoPicked } = samplesToShip(bag, catalog);
  const totals = bagTotals(bag, catalog, delivery.country, delivery.method);
  const title = (slug: Slug) => catalog.get(slug)?.title ?? slug;
  return {
    id: orderNumber(now),
    placedAt: now.toISOString(),
    contact,
    delivery,
    lines: buyableLines(bag, catalog).map((l) => ({ slug: l.slug, title: title(l.slug), purchase: l.purchase, qty: l.qty, total: linePrice(l, catalog) })),
    samples: slugs,
    sampleTitles: slugs.map(title),
    samplesAutoPicked: autoPicked,
    gift: totals.gift,
    note: bag.note,
    promo: totals.discount > 0 ? bag.promo : null,
    totals,
    eta: eta(delivery.country, delivery.method, now),
  };
}

export function saveOrder(order: Order) {
  try {
    window.localStorage.setItem(ORDER_KEY, JSON.stringify(order));
  } catch {}
  cached = undefined;
}

function isOrder(value: unknown): value is Order {
  if (!value || typeof value !== "object") return false;
  const o = value as Partial<Order>;
  return (
    typeof o.id === "string" &&
    !!o.contact &&
    !!o.delivery &&
    !!o.totals &&
    !!o.eta &&
    Array.isArray(o.lines) &&
    o.lines.length > 0 &&
    o.lines.every((l) => typeof l.slug === "string" && typeof l.title === "string") &&
    Array.isArray(o.samples) &&
    Array.isArray(o.sampleTitles)
  );
}

let cached: Order | null | undefined;

function readOrder(): Order | null {
  if (cached !== undefined) return cached;
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(ORDER_KEY) ?? "null");
    cached = isOrder(parsed) ? parsed : null;
  } catch {
    cached = null;
  }
  return cached;
}

function subscribe(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== ORDER_KEY && event.key !== null) return;
    cached = undefined;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

/** The last demo order on this device: undefined while hydrating, null when there is none. */
export function useLastOrder(): Order | null | undefined {
  return useSyncExternalStore(subscribe, readOrder, () => undefined);
}


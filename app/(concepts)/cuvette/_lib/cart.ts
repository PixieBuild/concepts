import { useMemo, useSyncExternalStore } from "react";

import { useCatalog } from "../_components/catalog-provider";
import type { ClientCatalog, SetCard } from "./client-catalog";
import { POLICY, vatInside } from "./content";
import { shippingCost, type Country, type Method } from "./delivery";
import { isSet, priceOf, serumsIn, type ProductCard, type Purchase, type Size, type Slug } from "./product";

export type { Purchase };

/** `variantId` is the size bought; null means the product's first, resolved against the catalogue on read. */
export type BagLine = { id: string; slug: Slug; variantId: string | null; purchase: Purchase; qty: number };

export type Bag = {
  lines: BagLine[];
  samples: Slug[];
  note: string;
  promo: string | null;
};

export type BagState = {
  bag: Bag;
  count: number;
  /** Cents, before promo and delivery; sold-out lines are left out. */
  subtotal: number;
  /** Lines that can be checked out: everything not sold out. */
  buyable: BagLine[];
  open: boolean;
  /** False on the server and during hydration, so first paint matches the server. */
  hydrated: boolean;
};

export const BAG_KEY = "cuvette:bag:v2";
export const MAX_QTY = 9;
export const NOTE_MAX = 200;

const EMPTY: Bag = { lines: [], samples: [], note: "", promo: null };

export function lineId(slug: Slug, purchase: Purchase, variantId: string | null = null): string {
  return variantId ? `${slug}:${variantId}:${purchase}` : `${slug}:${purchase}`;
}

/** The variant a line buys: its own, or the product's first when the line was added without one. */
export function sizeOf(product: Pick<ProductCard, "sizes">, variantId: string | null = null): Size | undefined {
  return variantId ? product.sizes.find((s) => s.variantId === variantId) : product.sizes[0];
}

export function unitPriceOf(product: Pick<ProductCard, "sizes" | "subscribe">, purchase: Purchase, variantId: string | null = null): number {
  const base = sizeOf(product, variantId)?.price ?? priceOf(product);
  return purchase === "subscribe" ? Math.round(base * (1 - product.subscribe.discount)) : base;
}

/** A product removed from the store prices at nothing; `useBag` already drops its lines. */
export function linePrice(line: Pick<BagLine, "slug" | "purchase" | "qty"> & { variantId?: string | null }, catalog: ClientCatalog): number {
  const product = catalog.get(line.slug);
  return product ? unitPriceOf(product, line.purchase, line.variantId ?? null) * line.qty : 0;
}

/** False once the product or its size is sold out: the line stays visible but is not bought. */
export function isBuyable(line: Pick<BagLine, "slug"> & { variantId?: string | null }, catalog: ClientCatalog): boolean {
  const product = catalog.get(line.slug);
  return !!product && product.available && sizeOf(product, line.variantId ?? null)?.available !== false;
}

export function buyableLines(bag: Bag, catalog: ClientCatalog): BagLine[] {
  return bag.lines.filter((line) => isBuyable(line, catalog));
}

export function bagSubtotal(bag: Bag, catalog: ClientCatalog): number {
  return buyableLines(bag, catalog).reduce((sum, line) => sum + linePrice(line, catalog), 0);
}

const clampQty = (qty: unknown) => Math.min(MAX_QTY, Math.max(1, Math.floor(Number(qty)) || 1));

function sanitise(value: unknown): Bag {
  if (!value || typeof value !== "object") return EMPTY;
  const raw = value as Record<string, unknown>;
  const lines: BagLine[] = [];
  for (const item of Array.isArray(raw.lines) ? raw.lines : []) {
    const { slug, purchase, qty, variantId: rawVariant } = (item ?? {}) as Record<string, unknown>;
    if (typeof slug !== "string" || !slug || (purchase !== "once" && purchase !== "subscribe")) continue;
    const variantId = typeof rawVariant === "string" && rawVariant ? rawVariant : null;
    const id = lineId(slug, purchase, variantId);
    const existing = lines.find((l) => l.id === id);
    if (existing) existing.qty = clampQty(existing.qty + clampQty(qty));
    else lines.push({ id, slug, variantId, purchase, qty: clampQty(qty) });
  }
  const samples = Array.isArray(raw.samples) ? [...new Set(raw.samples.filter((s): s is Slug => typeof s === "string"))] : [];
  return {
    lines,
    samples: samples.slice(0, POLICY.samples),
    note: typeof raw.note === "string" ? raw.note.slice(0, NOTE_MAX) : "",
    promo: raw.promo === POLICY.promo.code ? POLICY.promo.code : null,
  };
}

type Stored = { bag: Bag; open: boolean; hydrated: boolean };

let bag: Bag = EMPTY;
let open = false;
let loaded = false;
let snapshot: Stored | null = null;
const listeners = new Set<() => void>();

function read(): Bag {
  try {
    const stored = window.localStorage.getItem(BAG_KEY);
    return stored ? sanitise(JSON.parse(stored)) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function emit() {
  snapshot = null;
  listeners.forEach((listener) => listener());
}

function commit(next: Bag) {
  bag = next;
  try {
    window.localStorage.setItem(BAG_KEY, JSON.stringify(next));
  } catch {}
  emit();
}

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  bag = read();
}

function resync() {
  const stored = read();
  if (JSON.stringify(stored) === JSON.stringify(bag)) return;
  bag = stored;
  emit();
}

function onStorage(event: StorageEvent) {
  if (event.key === BAG_KEY || event.key === null) resync();
}

function subscribe(listener: () => void) {
  ensureLoaded();
  if (listeners.size === 0) {
    window.addEventListener("storage", onStorage);
    resync();
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): Stored {
  ensureLoaded();
  snapshot ??= { bag, open, hydrated: true };
  return snapshot;
}

const SERVER: Stored = { bag: EMPTY, open: false, hydrated: false };
const getServerSnapshot = () => SERVER;

/**
 * Lines for products and sizes the shop still has, each pinned to its size; anything since removed drops out
 * quietly. Sold-out lines stay, so the shopper sees why they are not charged.
 */
function inCatalog(stored: Bag, catalog: ClientCatalog): Bag {
  const lines = stored.lines.flatMap((l) => {
    const product = catalog.get(l.slug);
    const size = product && sizeOf(product, l.variantId);
    return size ? [{ ...l, variantId: size.variantId }] : [];
  });
  const samples = stored.samples.filter((s) => catalog.samples.some((p) => p.slug === s));
  return { ...stored, lines, samples };
}

export function useBag(): BagState {
  const catalog = useCatalog();
  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return useMemo(() => {
    const current = inCatalog(stored.bag, catalog);
    return {
      bag: current,
      count: current.lines.reduce((n, l) => n + l.qty, 0),
      subtotal: bagSubtotal(current, catalog),
      buyable: buyableLines(current, catalog),
      open: stored.open,
      hydrated: stored.hydrated,
    };
  }, [stored, catalog]);
}

export function setBagOpen(next: boolean) {
  if (open === next) return;
  open = next;
  emit();
}

export function openBag() {
  setBagOpen(true);
}

export function closeBag() {
  setBagOpen(false);
}

export function addToBag(slug: Slug, purchase: Purchase = "once", qty = 1, variantId: string | null = null) {
  ensureLoaded();
  const id = lineId(slug, purchase, variantId);
  const existing = bag.lines.find((l) => l.id === id);
  const lines = existing
    ? bag.lines.map((l) => (l.id === id ? { ...l, qty: clampQty(l.qty + qty) } : l))
    : [...bag.lines, { id, slug, variantId, purchase, qty: clampQty(qty) }];
  commit({ ...bag, lines });
  openBag();
}

export function setQty(id: string, qty: number) {
  commit({ ...bag, lines: bag.lines.map((l) => (l.id === id ? { ...l, qty: clampQty(qty) } : l)) });
}

export function remove(id: string): { line: BagLine; index: number } | null {
  const index = bag.lines.findIndex((l) => l.id === id);
  if (index < 0) return null;
  const line = bag.lines[index];
  commit({ ...bag, lines: bag.lines.filter((l) => l.id !== id) });
  return { line, index };
}

export function restoreLine(line: BagLine, index: number) {
  if (bag.lines.some((l) => l.id === line.id)) return;
  const lines = [...bag.lines];
  lines.splice(Math.min(index, lines.length), 0, line);
  commit({ ...bag, lines });
}

const onceLine = (lines: BagLine[], slug: Slug) => lines.find((l) => l.slug === slug && l.purchase === "once");

/** Sets the bag may offer: in stock, with every serum in them in stock too. */
export function offerableSets(catalog: ClientCatalog): SetCard[] {
  return catalog.bundles.filter((set) => set.available && set.contains.every((slug) => catalog.get(slug)?.available));
}

export type Upsell =
  | { kind: "switch"; set: SetCard }
  | { kind: "complete"; set: SetCard; have: Slug[]; add: Slug[]; extra: number }
  | null;

/** The one set offer the bag shows, if any: swap one-time lines that make up a set, or complete one that's partly there. */
export function upsellFor(bag: Bag, catalog: ClientCatalog): Upsell {
  let complete: Upsell = null;
  const lines = buyableLines(bag, catalog);
  for (const set of offerableSets(catalog)) {
    if (bag.lines.some((l) => l.slug === set.slug)) continue;
    const have = set.contains.filter((slug) => onceLine(lines, slug));
    if (have.length === set.contains.length) return { kind: "switch", set };
    const add = set.contains.filter((slug) => !have.includes(slug));
    if (complete || !have.length || add.some((slug) => bag.lines.some((l) => l.slug === slug))) continue;
    const paid = have.reduce((sum, slug) => sum + unitPriceOf(catalog.get(slug) ?? set, "once", onceLine(lines, slug)?.variantId), 0);
    complete = { kind: "complete", set, have, add, extra: priceOf(set) - paid };
  }
  return complete;
}

export function setSaving(set: SetCard): number {
  return Math.max(0, set.separately - priceOf(set));
}

/** Takes one one-time unit of each of the set's serums in the bag and puts one set in their place. */
export function switchToSet(set: SetCard) {
  const taken = set.contains.map((slug) => onceLine(bag.lines, slug)).filter((l): l is BagLine => !!l);
  if (taken.length === 0) return;
  const ids = new Set(taken.map((l) => l.id));
  const remaining = bag.lines.map((l) => (ids.has(l.id) ? { ...l, qty: l.qty - 1 } : l)).filter((l) => l.qty > 0);
  const id = lineId(set.slug, "once");
  const lines = remaining.some((l) => l.id === id)
    ? remaining.map((l) => (l.id === id ? { ...l, qty: clampQty(l.qty + 1) } : l))
    : [...remaining, { id, slug: set.slug, variantId: null, purchase: "once" as const, qty: 1 }];
  commit({ ...bag, lines });
}

/** Serums the bag already holds, directly or inside a set. */
export function serumsInBag(bag: Bag, catalog: ClientCatalog): Set<Slug> {
  return new Set(buyableLines(bag, catalog).flatMap((l) => {
    const product = catalog.get(l.slug);
    return product ? serumsIn(product) : [];
  }));
}

export function sampleOptions(bag: Bag, catalog: ClientCatalog): { product: ProductCard; inBag: boolean }[] {
  const held = serumsInBag(bag, catalog);
  return catalog.samples.map((product) => ({ product, inBag: held.has(product.slug) }));
}

export function sampleLimit(bag: Bag, catalog: ClientCatalog): number {
  return Math.min(POLICY.samples, sampleOptions(bag, catalog).filter((o) => !o.inBag).length);
}

export function chosenSamples(bag: Bag, catalog: ClientCatalog): Slug[] {
  const held = serumsInBag(bag, catalog);
  return bag.samples.filter((s) => !held.has(s)).slice(0, sampleLimit(bag, catalog));
}

/** What ships: the shopper's picks, topped up in range order when they chose fewer. */
export function samplesToShip(bag: Bag, catalog: ClientCatalog): { slugs: Slug[]; autoPicked: boolean } {
  const chosen = chosenSamples(bag, catalog);
  const limit = sampleLimit(bag, catalog);
  if (chosen.length >= limit) return { slugs: chosen, autoPicked: false };
  const held = serumsInBag(bag, catalog);
  const fill = catalog.samples.map((p) => p.slug).filter((s) => !held.has(s) && !chosen.includes(s)).slice(0, limit - chosen.length);
  return { slugs: [...chosen, ...fill], autoPicked: true };
}

export function setSamples(samples: Slug[]) {
  commit({ ...bag, samples: [...new Set(samples)].slice(0, POLICY.samples) });
}

export function setNote(note: string) {
  commit({ ...bag, note: note.slice(0, NOTE_MAX) });
}

export function setPromo(code: string | null) {
  commit({ ...bag, promo: code });
}

export type PromoResult = { ok: true; code: string } | { ok: false; error: string };

export function applyPromo(input: string): PromoResult {
  const code = input.trim().toUpperCase();
  if (!code) return { ok: false, error: "Enter a code." };
  if (code !== POLICY.promo.code) return { ok: false, error: "This code isn't valid." };
  setPromo(code);
  return { ok: true, code };
}

/** PORTO10 takes 10% off serum lines only; a set is already priced as a saving. */
export function promoDiscount(bag: Bag, catalog: ClientCatalog): number {
  if (bag.promo !== POLICY.promo.code) return 0;
  const serums = buyableLines(bag, catalog).filter((l) => {
    const product = catalog.get(l.slug);
    return product && !isSet(product);
  });
  return Math.round(serums.reduce((sum, l) => sum + linePrice(l, catalog), 0) * POLICY.promo.off);
}

export type Totals = {
  subtotal: number;
  discount: number;
  /** Goods after the promo: what the free-delivery and gift thresholds measure. */
  goods: number;
  shipping: number;
  total: number;
  vat: number;
  gift: boolean;
};

export function bagTotals(bag: Bag, catalog: ClientCatalog, country: Country = "PT", method: Method = "standard"): Totals {
  const subtotal = bagSubtotal(bag, catalog);
  const discount = promoDiscount(bag, catalog);
  const goods = subtotal - discount;
  const shipping = buyableLines(bag, catalog).length ? shippingCost(country, method, goods) : 0;
  const total = goods + shipping;
  return { subtotal, discount, goods, shipping, total, vat: vatInside(total), gift: goods >= POLICY.giftOver };
}

export function clearBag() {
  commit(EMPTY);
}

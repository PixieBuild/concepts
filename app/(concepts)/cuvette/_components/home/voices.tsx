import { formatCount } from "../../_lib/format";
import { isSet, rating, serumsIn, type ProductCard, type Review, type Shot, type Slug } from "../../_lib/product";
import { canShow } from "../../_lib/stills";
import type { BottleProduct } from "../bottle/bottle";
import { ReviewsReel, type ReelQuote } from "./reviews-reel";

/** A review and the handle of the product it is about; the page sends every listed product's reviews. */
export type ReviewRef = { review: Review; slug: Slug };

type Voice = { review: Review; product: ProductCard };

const MAX_QUOTES = 5;

// Until the skin photographs arrive, plates rotate through these; a label macro would repeat the Porto band below.
const PLATE_SHOTS: Shot[] = ["drop", "pack", "three-quarter"];

type Plate = { voice: Voice; shot: Shot };

function composition({ voice, shot }: Plate) {
  if (shot === "drop") return "drop";
  return isSet(voice.product) ? "set" : "bottle";
}

// How much two alike plates cost by how many taps apart they sit; last-to-first is one tap.
const NEARNESS = [0, 100, 10, 1];

function likeness(plates: Plate[]): number {
  let total = 0;
  plates.forEach((a, i) =>
    plates.slice(i + 1).forEach((b, k) => {
      const apart = i === 0 && i + k + 1 === plates.length - 1 ? 1 : k + 1;
      if (a.voice.product.slug === b.voice.product.slug && a.shot === b.shot) total += 1000;
      if (composition(a) === composition(b)) total += NEARNESS[apart] ?? 0;
    }),
  );
  return total;
}

function* orders<T>(items: T[]): Generator<T[]> {
  if (items.length <= 1) {
    yield items;
    return;
  }
  for (let i = 0; i < items.length; i++) {
    for (const rest of orders([...items.slice(0, i), ...items.slice(i + 1)])) yield [items[i], ...rest];
  }
}

function* choices<T>(options: T[][]): Generator<T[]> {
  if (!options.length) {
    yield [];
    return;
  }
  for (const first of options[0]) for (const rest of choices(options.slice(1))) yield [first, ...rest];
}

/** Keeps the lead quote first, then orders the rest and picks each plate so alike pictures sit as far apart as they can. */
function arrange(voices: Voice[]): Plate[] {
  const [lead, ...rest] = voices;
  if (!lead) return [];
  let best: Plate[] = [];
  let lowest = Infinity;
  for (const order of orders(rest)) {
    const line = [lead, ...order];
    const options = line.map(({ product }) => {
      const shots = PLATE_SHOTS.filter((s) => canShow(product, s));
      return shots.length ? shots : ["pack" as const];
    });
    for (const shots of choices<Shot>(options)) {
      const plates = line.map((voice, i) => ({ voice, shot: shots[i] }));
      const cost = likeness(plates);
      if (cost < lowest) [best, lowest] = [plates, cost];
    }
  }
  return best;
}

/** A set's pack crops through both labels in the narrow md–lg column, so its lead bottle stands alone there. */
function narrowStandIn(product: ProductCard, shot: Shot): ReelQuote["narrow"] {
  const lead = product.parts[0];
  if (shot !== "pack" || !isSet(product) || !lead) return null;
  return { product: toBottle(lead), shot: canShow(lead, "three-quarter") ? "three-quarter" : "pack" };
}

function toBottle(product: ProductCard): BottleProduct {
  const { slug, title, contains, separately, parts, looks, images, baked, colour } = product;
  return { slug, title, contains, separately, parts, looks, images, baked, colour };
}

/** The merchant's `home` picks (else the most helpful), taken a product at a time so neighbours differ. */
function pickQuotes(all: Voice[]): Voice[] {
  const curated = all.filter((v) => v.review.home);
  const pool = curated.length ? curated : [...all].sort((a, b) => b.review.helpful - a.review.helpful);
  const queues = new Map<Slug, Voice[]>();
  for (const v of pool) queues.set(v.product.slug, [...(queues.get(v.product.slug) ?? []), v]);

  const picked: Voice[] = [];
  while (picked.length < MAX_QUOTES && [...queues.values()].some((q) => q.length)) {
    for (const queue of queues.values()) {
      const next = queue.shift();
      if (next && picked.length < MAX_QUOTES) picked.push(next);
    }
  }
  // A page of only five-star quotes reads as curated; keep one mixed review if the pool has any.
  const mixed = pool.find((v) => v.review.rating <= 3);
  if (mixed && !picked.some((v) => v.review.rating <= 3) && picked.length) picked[picked.length - 1] = mixed;
  return picked;
}

export function Voices({ reviews, products, photos }: { reviews: ReviewRef[]; products: ProductCard[]; photos: Record<Slug, string | null> }) {
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const all: Voice[] = reviews.flatMap(({ review, slug }) => {
    const product = bySlug.get(slug);
    return product ? [{ review, product }] : [];
  });
  const quotes: ReelQuote[] = arrange(pickQuotes(all)).map(({ voice: { review, product }, shot }) => {
    const { display, count } = rating(product);
    return {
      key: `${product.slug}:${review.id}`,
      review,
      product: toBottle(product),
      shot,
      narrow: narrowStandIn(product, shot),
      photo: photos[serumsIn(product)[0]] ?? null,
      rating: { display, count: formatCount(count) },
    };
  });
  if (!quotes.length) return null;

  const totals = products.map(rating);
  const count = totals.reduce((sum, r) => sum + r.count, 0);
  const average = count ? (totals.reduce((sum, r) => sum + r.average * r.count, 0) / count).toFixed(1) : "–";

  return <ReviewsReel quotes={quotes} average={average} count={formatCount(count)} />;
}

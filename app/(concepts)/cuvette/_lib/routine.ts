import { concernId, type Daypart, type ProductCard, type RoutineSlot, type Slug } from "./product";

export type RoutineStep = { kind: "ours"; slug: Slug; dose: string; note: string } | { kind: "yours"; name: string; note: string };

export type Routine = { am: RoutineStep[]; pm: RoutineStep[]; note: string; lead: Slug | null };

const CLEANSE: RoutineStep = { kind: "yours", name: "Your cleanser", note: "Then pat dry." };
const CLEANSE_DAMP: RoutineStep = { kind: "yours", name: "Your cleanser", note: "Leave your face damp." };
const MOISTURISE: RoutineStep = { kind: "yours", name: "Your moisturiser", note: "Seals the water in." };
const SPF: RoutineStep = { kind: "yours", name: "SPF 30 or higher", note: "Every morning, whatever the weather." };

type Placed = { product: ProductCard; slot: RoutineSlot; order: number };

function slotOf(product: ProductCard, part: Daypart): RoutineSlot | undefined {
  return part === "AM" ? product.routine?.am : product.routine?.pm;
}

function stepsFor(part: Daypart, picks: { product: ProductCard; when: Daypart[] | null }[], sensitive: boolean): RoutineStep[] {
  const placed: Placed[] = picks.flatMap(({ product, when }) => {
    const slot = slotOf(product, part);
    if (!slot || (when && !when.includes(part))) return [];
    return [{ product, slot, order: (sensitive && slot.sensitive?.step) || slot.step }];
  });
  placed.sort((a, b) => a.order - b.order);
  const ours: RoutineStep[] = placed.map(({ product, slot }) => ({
    kind: "ours",
    slug: product.slug,
    dose: slot.dose,
    note: (sensitive && slot.sensitive?.note) || slot.note,
  }));
  const cleanse = placed[0]?.product.routine?.damp ? CLEANSE_DAMP : CLEANSE;
  return [cleanse, ...ours, MOISTURISE, ...(part === "AM" ? [SPF] : [])];
}

/**
 * The routine for a concern, built from each serum's `routine`: the serums that name the concern,
 * plus whatever they pair with, ordered by step (or the sensitive-skin step), wrapped in the shopper's own basics.
 */
export function routineFor(concern: string, sensitive: boolean, products: ProductCard[]): Routine {
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const leads = products.filter((p) => p.routine && p.concerns.some((c) => concernId(c) === concern));
  const picks = new Map<Slug, { product: ProductCard; when: Daypart[] | null }>();
  for (const p of leads) picks.set(p.slug, { product: p, when: null });
  for (const p of leads) {
    for (const pair of p.routine!.pairsWith) {
      const partner = bySlug.get(pair.slug);
      if (!partner?.routine || picks.get(pair.slug)?.when === null) continue;
      const when = [...new Set([...(picks.get(pair.slug)?.when ?? []), ...pair.when])];
      picks.set(pair.slug, { product: partner, when });
    }
  }
  const lead = leads[0];
  return {
    am: stepsFor("AM", [...picks.values()], sensitive),
    pm: stepsFor("PM", [...picks.values()], sensitive),
    note: (sensitive && lead?.routine?.sensitiveNote) || lead?.routine?.note || "",
    lead: lead?.slug ?? null,
  };
}

/** The serums a routine asks for, once each, in the order they first appear. */
export function routineSerums(routine: Routine): Slug[] {
  const all = [...routine.am, ...routine.pm].flatMap((step) => (step.kind === "ours" ? [step.slug] : []));
  return [...new Set(all)];
}

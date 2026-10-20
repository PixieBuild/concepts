import { COUNTRIES } from "../../_lib/delivery";
import { contactSchema, deliverySchema, EMPTY_CONTACT, EMPTY_DELIVERY, type Contact, type Delivery, type DeliveryInput } from "./schema";

const DRAFT_KEY = "cuvette:checkout:v1";

export type Draft = { contact: Contact; delivery: DeliveryInput; contactDone: boolean; delivered: Delivery | null };

/** What the shopper typed, kept for this tab only so a reload doesn't wipe the form. */
export function readDraft(): Draft {
  const empty: Draft = { contact: EMPTY_CONTACT, delivery: EMPTY_DELIVERY, contactDone: false, delivered: null };
  try {
    const raw = JSON.parse(window.sessionStorage.getItem(DRAFT_KEY) ?? "null") as Partial<Record<"contact" | "delivery", Record<string, unknown>>> | null;
    if (!raw) return empty;
    const contact = { ...EMPTY_CONTACT, ...pick(raw.contact, EMPTY_CONTACT) };
    const delivery = { ...EMPTY_DELIVERY, ...pick(raw.delivery, EMPTY_DELIVERY) };
    if (!(delivery.country in COUNTRIES)) delivery.country = "PT";
    if (delivery.method !== "standard" && delivery.method !== "express") delivery.method = "standard";
    const contactDone = contactSchema.safeParse(contact).success;
    const parsed = deliverySchema(delivery.country).safeParse(delivery);
    return { contact, delivery, contactDone, delivered: contactDone && parsed.success ? parsed.data : null };
  } catch {
    return empty;
  }
}

function pick<T extends Record<string, unknown>>(source: Record<string, unknown> | undefined, shape: T): Partial<T> {
  if (!source) return {};
  return Object.fromEntries(Object.entries(source).filter(([key, value]) => key in shape && typeof value === typeof shape[key])) as Partial<T>;
}

export function writeDraft(contact: Contact, delivery: DeliveryInput | Delivery) {
  try {
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ contact, delivery }));
  } catch {}
}

export function clearDraft() {
  try {
    window.sessionStorage.removeItem(DRAFT_KEY);
  } catch {}
}

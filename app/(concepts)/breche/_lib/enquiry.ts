import { z } from "zod";

import { OBJECTIVES, type Objective } from "./content";
import { price } from "./format";

export const NOT_SURE = "not-sure";
const DAY = 86_400_000;

export const objectiveFor = (id: string): Objective | undefined => OBJECTIVES.find((o) => o.slot.id === id);

/** Days are handled as UTC noon so a week never slips a day across time zones. */
export const isoDay = (date: Date) => date.toISOString().slice(0, 10);
export const fromIso = (iso: string) => new Date(`${iso}T12:00:00Z`);

const parisDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" });
/** Today in Chamonix, so the browser and the server agree on the earliest week wherever the visitor is. */
export const officeToday = (now = new Date()) => fromIso(parisDay.format(now));

const weekOf = (day: Date) => new Date(day.getTime() - ((day.getUTCDay() + 6) % 7) * DAY);

/** The Monday of a calendar day the date picker hands over in local time. */
export const mondayOf = (date: Date) => weekOf(new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12)));

/** A week counts as in season when it holds enough in-season days to run the whole objective. */
export function weekInSeason(objective: Objective | undefined, monday: Date): boolean {
  if (!objective) return true;
  const inSeason = [0, 1, 2, 3, 4, 5, 6].filter((offset) => objective.months.includes(new Date(monday.getTime() + offset * DAY).getUTCMonth() + 1));
  return inSeason.length >= Math.min(objective.days, 7);
}

/** The week already under way is never offered: the earliest a guide can plan is next Monday. */
export const firstBookableWeek = (today: Date) => new Date(weekOf(today).getTime() + 7 * DAY);

export function earliestWeek(objective: Objective | undefined, today: Date): Date {
  let monday = firstBookableWeek(today);
  for (let i = 0; i < 60 && !weekInSeason(objective, monday); i++) monday = new Date(monday.getTime() + 7 * DAY);
  return monday;
}

const weekLabel = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" });
export const formatWeek = (monday: Date) => `week of ${weekLabel.format(monday)}`;

export function estimate(objective: Objective | undefined, climbers: number) {
  if (!objective) return null;
  const guides = Math.ceil(climbers / objective.party);
  const priced = climbers >= objective.party || objective.party === 1;
  return { guides, total: priced ? price(objective.price * climbers) : null, each: price(objective.price), party: objective.party };
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+?[\d\s().-]{8,20}$/;

export const enquirySchema = z
  .object({
    objective: z.string({ message: "Choose an objective, or “Not sure yet”" }).refine((v) => v === NOT_SURE || !!objectiveFor(v), "Choose an objective, or “Not sure yet”"),
    week: z.string({ message: "Choose the week you have" }).regex(/^\d{4}-\d{2}-\d{2}$/, "Choose the week you have"),
    climbers: z.number().int().min(1, "At least one climber").max(12, "For more than twelve, ring the office"),
    name: z.string().trim().min(2, "Tell us your name").max(80, "Keep your name under 80 characters"),
    contact: z
      .string()
      .trim()
      .max(120, "An email address, or a phone number with its country code")
      .refine((v) => EMAIL.test(v) || PHONE.test(v), "An email address, or a phone number with its country code"),
    note: z.string().trim().max(240, "Keep it to a line or two; we’ll talk on the phone").optional(),
  })
  .superRefine((value, ctx) => {
    const monday = fromIso(value.week);
    if (Number.isNaN(monday.getTime())) return;
    const first = firstBookableWeek(officeToday());
    if (monday.getTime() < first.getTime()) {
      ctx.addIssue({ code: "custom", path: ["week"], message: `The earliest we can plan is the ${formatWeek(first)}` });
      return;
    }
    const objective = objectiveFor(value.objective);
    if (!weekInSeason(objective, monday)) {
      ctx.addIssue({ code: "custom", path: ["week"], message: `${objective?.name} runs ${objective?.season}. Choose a week in season.` });
    }
  });

export type Enquiry = z.infer<typeof enquirySchema>;

export type EnquiryResult =
  | { ok: true; reference: string; summary: string }
  | { ok: false; errors: Partial<Record<keyof Enquiry, string>> };

export function summarise(enquiry: Enquiry): string {
  const objective = objectiveFor(enquiry.objective);
  const climbers = `${enquiry.climbers} ${enquiry.climbers === 1 ? "climber" : "climbers"}`;
  const week = formatWeek(fromIso(enquiry.week));
  if (!objective) return `Not sure yet, ${week}, ${climbers}.`;
  const quote = estimate(objective, enquiry.climbers);
  const guides = quote && `${quote.guides} ${quote.guides === 1 ? "guide" : "guides"}`;
  return `${objective.name}, ${week}, ${climbers} and ${guides}${quote?.total ? `, indicatively ${quote.total}` : ""}.`;
}

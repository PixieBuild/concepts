import { z } from "zod";

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const stayDetailsSchema = z
  .object({
    arrival: z.date({ message: "Choose your arrival date" }),
    departure: z.date({ message: "Choose your departure date" }),
    guests: z
      .number({ message: "Select the number of guests" })
      .int()
      .min(1, "At least one guest")
      .max(6, "Please contact us directly for parties over six"),
  })
  .refine((v) => v.arrival >= startOfToday(), {
    message: "Arrival cannot be in the past",
    path: ["arrival"],
  })
  .refine((v) => v.departure > v.arrival, {
    message: "Departure must be after arrival",
    path: ["departure"],
  })
  .refine((v) => nightsBetween(v.arrival, v.departure) <= 30, {
    message: "For stays over thirty nights, please write to us",
    path: ["departure"],
  });

export type StayDetails = z.infer<typeof stayDetailsSchema>;

export const guestDetailsSchema = z.object({
  firstName: z.string().trim().min(2, "Please enter your first name"),
  lastName: z.string().trim().min(2, "Please enter your last name"),
  email: z.string().trim().pipe(z.email("Please enter a valid email address")),
  phone: z
    .string()
    .trim()
    .min(7, "Please enter a contact number")
    .regex(/^[+()\d\s-]+$/, "Please use digits, spaces, and + only"),
  notes: z.string().trim().max(400, "Please keep this under 400 characters").optional(),
});

export type GuestDetails = z.infer<typeof guestDetailsSchema>;

export function nightsBetween(arrival: Date, departure: Date): number {
  const ms = departure.getTime() - arrival.getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

export function formatDate(date: Date | undefined, fallback = "Select"): string {
  if (!date) return fallback;
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatLongDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function confirmationNumber(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const serial = String(hash % 100000).padStart(5, "0");
  const suffix = ((hash >>> 7) % 900) + 100;
  return `CL-${serial}-${suffix}`;
}

export function toDateParam(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function fromDateParam(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

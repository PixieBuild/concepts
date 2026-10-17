"use server";

import { enquirySchema, summarise, type Enquiry, type EnquiryResult } from "./enquiry";

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function reference(now: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", year: "2-digit", month: "2-digit", day: "2-digit" })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  const tail = Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => ALPHABET[b % ALPHABET.length]).join("");
  return `BR-${parts.year}${parts.month}${parts.day}-${tail}`;
}

/** Validates an enquiry and issues its reference. This is a concept site: nothing is delivered anywhere. */
export async function sendEnquiry(input: unknown): Promise<EnquiryResult> {
  const parsed = enquirySchema.safeParse(input);
  if (!parsed.success) {
    const errors: Partial<Record<keyof Enquiry, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof Enquiry;
      errors[key] ??= issue.message;
    }
    return { ok: false, errors };
  }
  return { ok: true, reference: reference(new Date()), summary: summarise(parsed.data) };
}

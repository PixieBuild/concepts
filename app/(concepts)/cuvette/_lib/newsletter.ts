"use server";

import { z } from "zod";

export type NewsletterState = { ok: true } | { ok: false; error: string | null };

const email = z.email({ message: "That doesn't look like an email address." }).max(254, "That address is too long.");

/** Validates the address and confirms. This is a concept site: nothing is stored or sent. */
export async function subscribe(_prev: NewsletterState, form: FormData): Promise<NewsletterState> {
  const value = String(form.get("email") ?? "").trim();
  if (!value) return { ok: false, error: "Enter your email address." };
  const parsed = email.safeParse(value);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the address." };
  return { ok: true };
}

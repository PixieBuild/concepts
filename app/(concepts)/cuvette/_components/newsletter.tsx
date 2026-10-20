"use client";

import { useActionState, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { subscribe, type NewsletterState } from "../_lib/newsletter";

const INITIAL: NewsletterState = { ok: false, error: null };

export function Newsletter() {
  const [state, action, pending] = useActionState(subscribe, INITIAL);
  const id = useId();
  const [value, setValue] = useState("");
  const error = !state.ok ? state.error : null;

  return (
    <div id="newsletter" className="scroll-mt-24">
      <h2 className="title text-balance">Notes on actives, once a month.</h2>
      <p className="mt-2 max-w-[44ch] text-muted-foreground">No discounts in exchange for your email.</p>
      <div aria-live="polite" className="mt-6">
        {state.ok ? (
          <p className="max-w-[40ch] border-t border-border pt-4">
            You&rsquo;re on the list. The first letter goes out in November.
          </p>
        ) : (
          <form action={action} noValidate className="max-w-md">
            <label htmlFor={`${id}-email`} className="label text-muted-foreground">
              Email
            </label>
            <div className="mt-2 flex gap-2">
              <Input
                id={`${id}-email`}
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="you@example.com"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${id}-error` : undefined}
                className="h-12 flex-1 rounded-(--radius) px-3 text-base md:text-[0.95rem]"
              />
              <Button type="submit" disabled={pending} className="h-12 rounded-(--radius) px-5 text-[0.95rem] font-normal">
                {pending ? "Subscribing…" : "Subscribe"}
              </Button>
            </div>
            {error && (
              <p id={`${id}-error`} className="mt-2 text-[0.9rem] text-destructive">
                {error}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

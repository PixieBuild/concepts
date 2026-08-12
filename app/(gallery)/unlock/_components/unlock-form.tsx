"use client";

import { useActionState } from "react";
import { ArrowRight, Loader2, LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { unlock, type UnlockState } from "../actions";

export function UnlockForm() {
  const [state, action, pending] = useActionState<UnlockState, FormData>(
    unlock,
    {},
  );

  return (
    <form action={action} className="mt-8 flex flex-col gap-3">
      <label htmlFor="password" className="sr-only">
        Password
      </label>

      <div className="relative">
        <LockKeyhole
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id="password"
          name="password"
          type="password"
          autoFocus
          autoComplete="current-password"
          placeholder="Password"
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "password-error" : undefined}
          className="h-11 rounded-xl pl-10 text-[0.95rem] md:text-[0.95rem]"
        />
      </div>

      {state.error && (
        <p id="password-error" role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="mt-1 h-11 w-full rounded-xl"
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Checking
          </>
        ) : (
          <>
            Continue
            <ArrowRight className="size-4" />
          </>
        )}
      </Button>
    </form>
  );
}

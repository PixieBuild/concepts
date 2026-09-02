"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Controller, useForm } from "react-hook-form";
import { Check, Loader2 } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { DateField } from "@/app/(concepts)/casa-lume/_components/date-field";
import { GuestField } from "@/app/(concepts)/casa-lume/_components/guest-field";
import { confirmationNumber, formatLongDate } from "@/app/(concepts)/casa-lume/_lib/booking";

const SITTINGS = ["19:30", "19:45", "20:15", "20:30", "21:00", "21:30"];
const UNAVAILABLE = new Set(["20:15", "21:30"]);
const EASE = [0.16, 1, 0.3, 1] as const;

const schema = z.object({
  date: z.date({ message: "Choose a date" }),
  guests: z.number().int().min(1).max(8),
  time: z.string().min(1, "Choose a sitting"),
  name: z.string().trim().min(2, "Please enter your name"),
  email: z.string().trim().pipe(z.email("Please enter a valid email address")),
});

type Values = z.infer<typeof schema>;

export function TableReservation({ trigger }: { trigger?: React.ReactElement }) {
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState<Values | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const reduced = useReducedMotion();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { guests: 2, time: "", name: "", email: "" },
    mode: "onTouched",
  });

  async function onSubmit(values: Values) {
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 750));
    setSubmitting(false);
    setConfirmed(values);
  }

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setTimeout(() => {
        setConfirmed(null);
        form.reset();
      }, 300);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={trigger ?? <Button>Reserve a table</Button>}
      />

      <DialogContent data-lenis-prevent className="max-h-[92svh] overflow-y-auto sm:max-w-lg">
        <AnimatePresence mode="wait" initial={false}>
          {confirmed ? (
            <motion.div
              key="done"
              initial={reduced ? undefined : { opacity: 0, y: 12 }}
              animate={reduced ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="py-4 text-center"
            >
              <span className="mx-auto grid size-12 place-items-center rounded-full border border-primary/40 text-primary">
                <Check className="size-4" />
              </span>
              <DialogTitle className="mt-7 font-heading text-3xl leading-tight font-normal">
                Your table is held.
              </DialogTitle>
              <DialogDescription className="mx-auto mt-4 max-w-sm text-sm leading-relaxed">
                We have you at {confirmed.time} on{" "}
                {formatLongDate(confirmed.date)} for {confirmed.guests}. A note
                is on its way to {confirmed.email}.
              </DialogDescription>
              <p className="mt-6 font-mono text-xs tracking-wide text-muted-foreground">
                {confirmationNumber(`${confirmed.email}${confirmed.time}`)}
              </p>
              <Button
                variant="outline"
                className="mt-8"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={form.handleSubmit(onSubmit)}
              noValidate
              initial={reduced ? undefined : { opacity: 0 }}
              animate={reduced ? undefined : { opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <DialogTitle className="font-heading text-3xl leading-tight font-normal">
                Reserve a table
              </DialogTitle>
              <DialogDescription className="mt-3 text-sm leading-relaxed">
                Sale seats twenty-six on the lower terrace. One menu each
                evening, served from 19:30.
              </DialogDescription>

              <div className="mt-8 flex flex-col gap-7">
                <Controller
                  control={form.control}
                  name="date"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid || undefined}>
                      <DateField
                        label="Date"
                        value={field.value}
                        onChange={field.onChange}
                        invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="guests"
                  render={({ field }) => (
                    <GuestField
                      label="Guests"
                      max={8}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />

                <Controller
                  control={form.control}
                  name="time"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid || undefined}>
                      <FieldLabel className="eyebrow text-muted-foreground">
                        Sitting
                      </FieldLabel>
                      <div className="mt-1 grid grid-cols-3 gap-2">
                        {SITTINGS.map((time) => {
                          const taken = UNAVAILABLE.has(time);
                          const selected = field.value === time;
                          return (
                            <button
                              key={time}
                              type="button"
                              disabled={taken}
                              aria-pressed={selected}
                              onClick={() => field.onChange(time)}
                              className={cn(
                                "border py-2.5 text-sm transition-colors",
                                selected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border hover:border-primary/60",
                                taken &&
                                  "pointer-events-none border-dashed text-muted-foreground/40 line-through",
                              )}
                            >
                              {time}
                            </button>
                          );
                        })}
                      </div>
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid || undefined}>
                      <FieldLabel
                        htmlFor="res-name"
                        className="eyebrow text-muted-foreground"
                      >
                        Name
                      </FieldLabel>
                      <Input
                        id="res-name"
                        autoComplete="name"
                        aria-invalid={fieldState.invalid || undefined}
                        {...field}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <Controller
                  control={form.control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid || undefined}>
                      <FieldLabel
                        htmlFor="res-email"
                        className="eyebrow text-muted-foreground"
                      >
                        Email
                      </FieldLabel>
                      <Input
                        id="res-email"
                        type="email"
                        autoComplete="email"
                        aria-invalid={fieldState.invalid || undefined}
                        {...field}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="mt-9 w-full"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Holding your table
                  </>
                ) : (
                  "Request this table"
                )}
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

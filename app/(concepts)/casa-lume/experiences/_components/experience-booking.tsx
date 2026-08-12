"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Controller, useForm } from "react-hook-form";
import { Check } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DateField } from "@/app/(concepts)/casa-lume/_components/date-field";
import { confirmationNumber, formatLongDate } from "@/app/(concepts)/casa-lume/_lib/booking";
import { EXPERIENCES } from "@/app/(concepts)/casa-lume/_lib/content";

const TIMES = ["08:00", "10:30", "14:00", "16:30", "18:30"];
const EASE = [0.16, 1, 0.3, 1] as const;

const schema = z.object({
  experience: z.string().min(1, "Choose an experience"),
  date: z.date({ message: "Choose a date" }),
  time: z.string().min(1, "Choose a time"),
  name: z.string().trim().min(2, "Please enter your name"),
  email: z.string().trim().pipe(z.email("Please enter a valid email address")),
});

type Values = z.infer<typeof schema>;

export function ExperienceBooking({
  defaultExperience,
  trigger,
}: {
  defaultExperience?: string;
  trigger?: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState<Values | null>(null);
  const reduced = useReducedMotion();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      experience: defaultExperience ?? "",
      time: "",
      name: "",
      email: "",
    },
    mode: "onTouched",
  });

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setTimeout(() => {
        setConfirmed(null);
        form.reset({
          experience: defaultExperience ?? "",
          time: "",
          name: "",
          email: "",
        });
      }, 300);
    }
  }

  const chosen = EXPERIENCES.find((e) => e.slug === confirmed?.experience);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={trigger ?? <Button variant="outline">Arrange this</Button>}
      />

      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-lg">
        <AnimatePresence mode="wait" initial={false}>
          {confirmed && chosen ? (
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
                It is arranged.
              </DialogTitle>
              <DialogDescription className="mx-auto mt-4 max-w-sm text-sm leading-relaxed">
                {chosen.name}, {formatLongDate(confirmed.date)} at{" "}
                {confirmed.time}. We will confirm the details with{" "}
                {confirmed.email} before you arrive.
              </DialogDescription>
              <p className="mt-6 font-mono text-xs tracking-wide text-muted-foreground">
                {confirmationNumber(`${confirmed.email}${chosen.slug}`)}
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
              onSubmit={form.handleSubmit(setConfirmed)}
              noValidate
              initial={reduced ? undefined : { opacity: 0 }}
              animate={reduced ? undefined : { opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <DialogTitle className="font-heading text-3xl leading-tight font-normal">
                Arrange an experience
              </DialogTitle>
              <DialogDescription className="mt-3 text-sm leading-relaxed">
                Tell us what and when. Nothing is charged now — it is added to
                your room account.
              </DialogDescription>

              <div className="mt-8 flex flex-col gap-7">
                <Controller
                  control={form.control}
                  name="experience"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid || undefined}>
                      <FieldLabel className="eyebrow text-muted-foreground">
                        Experience
                      </FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        items={EXPERIENCES.map((e) => ({
                          label: e.name,
                          value: e.slug,
                        }))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose one" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPERIENCES.map((experience) => (
                            <SelectItem
                              key={experience.slug}
                              value={experience.slug}
                            >
                              {experience.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

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
                  name="time"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid || undefined}>
                      <FieldLabel className="eyebrow text-muted-foreground">
                        Time
                      </FieldLabel>
                      <div className="mt-1 grid grid-cols-3 gap-2 sm:grid-cols-5">
                        {TIMES.map((time) => (
                          <button
                            key={time}
                            type="button"
                            aria-pressed={field.value === time}
                            onClick={() => field.onChange(time)}
                            className={cn(
                              "border py-2.5 text-sm transition-colors",
                              field.value === time
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border hover:border-primary/60",
                            )}
                          >
                            {time}
                          </button>
                        ))}
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
                        htmlFor="exp-name"
                        className="eyebrow text-muted-foreground"
                      >
                        Name
                      </FieldLabel>
                      <Input
                        id="exp-name"
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
                        htmlFor="exp-email"
                        className="eyebrow text-muted-foreground"
                      >
                        Email
                      </FieldLabel>
                      <Input
                        id="exp-email"
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

              <Button type="submit" size="lg" className="mt-9 w-full">
                Request this
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { ArrowLeft, ArrowRight, Check, Loader2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { DateField } from "@/app/(concepts)/casa-lume/_components/date-field";
import { GuestField } from "@/app/(concepts)/casa-lume/_components/guest-field";
import Image from "next/image";
import { ROOMS } from "@/app/(concepts)/casa-lume/_lib/content";
import {
  confirmationNumber,
  formatCurrency,
  formatDate,
  formatLongDate,
  guestDetailsSchema,
  nightsBetween,
  stayDetailsSchema,
  type GuestDetails,
  type StayDetails,
} from "@/app/(concepts)/casa-lume/_lib/booking";
import { path } from "@/app/(concepts)/casa-lume/site";

const STEPS = ["Your stay", "Choose a room", "Your details", "Confirmed"];
const EASE = [0.16, 1, 0.3, 1] as const;

type Props = {
  initialRoom?: string;
  initialArrival?: Date;
  initialDeparture?: Date;
  initialGuests?: number;
};

export function BookingFlow({
  initialRoom,
  initialArrival,
  initialDeparture,
  initialGuests,
}: Props) {
  const [step, setStep] = useState(0);
  const [stay, setStay] = useState<StayDetails | null>(null);
  const [roomSlug, setRoomSlug] = useState<string | null>(initialRoom ?? null);
  const [guest, setGuest] = useState<GuestDetails | null>(null);
  const [searching, setSearching] = useState(false);
  const reduced = useReducedMotion();

  const room = useMemo(
    () => ROOMS.find((r) => r.slug === roomSlug) ?? null,
    [roomSlug],
  );

  const nights = stay ? nightsBetween(stay.arrival, stay.departure) : 0;
  const reference = useMemo(() => {
    if (!stay || !room || !guest) return "";
    return confirmationNumber(
      `${guest.email}${room.slug}${stay.arrival.toISOString()}`,
    );
  }, [stay, room, guest]);

  async function handleStay(values: StayDetails) {
    setStay(values);
    setSearching(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    setSearching(false);
    setStep(1);
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-5 sm:px-8">
      <Stepper current={step} />

      <div className="relative mt-10 sm:mt-14">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={reduced ? undefined : { opacity: 0, y: 16 }}
            animate={reduced ? undefined : { opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -12 }}
            transition={{ duration: 0.55, ease: EASE }}
          >
            {step === 0 && (
              <StayStep
                defaults={{
                  arrival: initialArrival,
                  departure: initialDeparture,
                  guests: initialGuests ?? 2,
                }}
                searching={searching}
                onSubmit={handleStay}
              />
            )}

            {step === 1 && stay && (
              <RoomStep
                stay={stay}
                nights={nights}
                selected={roomSlug}
                onBack={() => setStep(0)}
                onSelect={(slug) => {
                  setRoomSlug(slug);
                  setStep(2);
                }}
              />
            )}

            {step === 2 && stay && room && (
              <GuestStep
                onBack={() => setStep(1)}
                onSubmit={(values) => {
                  setGuest(values);
                  setStep(3);
                }}
                summary={
                  <StaySummary
                    room={room.name}
                    arrival={stay.arrival}
                    departure={stay.departure}
                    guests={stay.guests}
                    nights={nights}
                    total={room.priceFrom * nights}
                  />
                }
              />
            )}

            {step === 3 && stay && room && guest && (
              <ConfirmationStep
                reference={reference}
                guest={guest}
                room={room.name}
                photo={room.photo}
                arrival={stay.arrival}
                departure={stay.departure}
                guests={stay.guests}
                nights={nights}
                total={room.priceFrom * nights}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-2 sm:gap-4" aria-label="Booking progress">
      {STEPS.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={label} className="flex flex-1 items-center gap-2 sm:gap-4">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <span
                className={cn(
                  "h-px w-full origin-left bg-border transition-colors duration-700",
                  (done || active) && "bg-primary",
                )}
              />
              <span
                className={cn(
                  "eyebrow truncate transition-colors duration-500",
                  active
                    ? "text-primary"
                    : done
                      ? "text-foreground/70"
                      : "text-muted-foreground/60",
                )}
              >
                <span className="hidden sm:inline">
                  {String(index + 1).padStart(2, "0")} — {label}
                </span>
                <span className="sm:hidden">
                  {active ? label : String(index + 1).padStart(2, "0")}
                </span>
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function StepHeading({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
}) {
  return (
    <header className="max-w-2xl">
      <p className="eyebrow text-primary">{eyebrow}</p>
      <h2 className="mt-4 font-heading text-[clamp(2rem,5vw,3.25rem)] leading-[1.05] font-light tracking-tight text-balance">
        {title}
      </h2>
      {intro && (
        <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-muted-foreground">
          {intro}
        </p>
      )}
    </header>
  );
}

function StayStep({
  defaults,
  searching,
  onSubmit,
}: {
  defaults: { arrival?: Date; departure?: Date; guests: number };
  searching: boolean;
  onSubmit: (values: StayDetails) => void;
}) {
  const form = useForm<StayDetails>({
    resolver: zodResolver(stayDetailsSchema),
    defaultValues: {
      arrival: defaults.arrival,
      departure: defaults.departure,
      guests: defaults.guests,
    },
    mode: "onTouched",
  });

  const arrival = useWatch({ control: form.control, name: "arrival" });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <StepHeading
        eyebrow="Step one"
        title="When would you like to arrive?"
        intro="Seventeen rooms, so we book up early in summer. Tell us your dates and we will show you what is left."
      />

      <div className="mt-12 grid gap-8 sm:grid-cols-3 sm:gap-6">
        <Controller
          control={form.control}
          name="arrival"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <DateField
                label="Arrival"
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
          name="departure"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <DateField
                label="Departure"
                value={field.value}
                onChange={field.onChange}
                disabledBefore={arrival}
                invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="guests"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <GuestField value={field.value} onChange={field.onChange} />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </div>

      <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center">
        <Button type="submit" size="lg" disabled={searching} className="sm:w-auto">
          {searching ? (
            <>
              <Loader2 className="animate-spin" />
              Checking availability
            </>
          ) : (
            <>
              Check availability
              <ArrowRight />
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground">
          No card required to hold a room. We confirm by email within the hour.
        </p>
      </div>
    </form>
  );
}

function RoomStep({
  stay,
  nights,
  selected,
  onSelect,
  onBack,
}: {
  stay: StayDetails;
  nights: number;
  selected: string | null;
  onSelect: (slug: string) => void;
  onBack: () => void;
}) {
  const available = ROOMS.filter((room) => room.guests >= stay.guests);

  return (
    <div>
      <StepHeading
        eyebrow="Step two"
        title="What we have for those dates"
        intro={`${formatDate(stay.arrival)} to ${formatDate(stay.departure)} · ${nights} ${nights === 1 ? "night" : "nights"} · ${stay.guests} ${stay.guests === 1 ? "guest" : "guests"}`}
      />

      {available.length === 0 ? (
        <div className="mt-12 border border-dashed border-border p-10 text-center sm:p-16">
          <p className="font-heading text-2xl font-normal">
            Nothing sleeps {stay.guests} on those dates.
          </p>
          <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
            Our largest suite takes four. For a larger party we can open the
            adjoining rooms — write to us and we will arrange it.
          </p>
          <Button variant="outline" className="mt-8" onClick={onBack}>
            <ArrowLeft />
            Change dates
          </Button>
        </div>
      ) : (
        <ul className="mt-12 flex flex-col gap-px bg-border">
          {available.map((room) => {
            const total = room.priceFrom * nights;
            const isSelected = selected === room.slug;
            return (
              <li key={room.slug} className="bg-background">
                <div
                  className={cn(
                    "group grid gap-6 p-5 transition-colors sm:grid-cols-[minmax(0,14rem)_1fr_auto] sm:items-center sm:gap-8 sm:p-6",
                    isSelected && "bg-secondary/60",
                  )}
                >
                  <div className="relative aspect-3/2 overflow-hidden">
                    <Image
                      src={room.photo.src}
                      alt={room.photo.alt}
                      fill
                      sizes="(min-width:640px) 224px, 100vw"
                      className="object-cover"
                    />
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-heading text-2xl leading-tight font-normal">
                      {room.name}
                    </h3>
                    <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                      {room.description}
                    </p>
                    <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="size-3.5" />
                        Sleeps {room.guests}
                      </span>
                      <span>{room.size}</span>
                      <span>{room.view}</span>
                    </p>
                  </div>

                  <div className="flex items-end justify-between gap-4 sm:flex-col sm:items-end sm:justify-center sm:text-right">
                    <div>
                      <p className="font-heading text-2xl leading-none font-normal">
                        {formatCurrency(total)}
                      </p>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {formatCurrency(room.priceFrom)} × {nights}{" "}
                        {nights === 1 ? "night" : "nights"}
                      </p>
                    </div>
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => onSelect(room.slug)}
                    >
                      Select room
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {available.length > 0 && (
        <Button variant="ghost" className="mt-10" onClick={onBack}>
          <ArrowLeft />
          Change dates
        </Button>
      )}
    </div>
  );
}

function GuestStep({
  onSubmit,
  onBack,
  summary,
}: {
  onSubmit: (values: GuestDetails) => void;
  onBack: () => void;
  summary: React.ReactNode;
}) {
  const form = useForm<GuestDetails>({
    resolver: zodResolver(guestDetailsSchema),
    defaultValues: { firstName: "", lastName: "", email: "", phone: "", notes: "" },
    mode: "onTouched",
  });

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_20rem] lg:gap-16">
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <StepHeading
          eyebrow="Step three"
          title="Who shall we expect?"
          intro="We will send a short note before you travel with directions, the forecast, and anything worth knowing that week."
        />

        <div className="mt-12 grid gap-7 sm:grid-cols-2">
          <TextField
            control={form.control}
            name="firstName"
            label="First name"
            autoComplete="given-name"
          />
          <TextField
            control={form.control}
            name="lastName"
            label="Last name"
            autoComplete="family-name"
          />
          <TextField
            control={form.control}
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            className="sm:col-span-2"
          />
          <TextField
            control={form.control}
            name="phone"
            label="Telephone"
            type="tel"
            autoComplete="tel"
            className="sm:col-span-2"
          />

          <Controller
            control={form.control}
            name="notes"
            render={({ field, fieldState }) => (
              <Field
                className="sm:col-span-2"
                data-invalid={fieldState.invalid || undefined}
              >
                <FieldLabel htmlFor="notes" className="eyebrow text-muted-foreground">
                  Anything we should know
                </FieldLabel>
                <Textarea
                  id="notes"
                  rows={3}
                  placeholder="Dietary requirements, a late arrival, an anniversary…"
                  {...field}
                  value={field.value ?? ""}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </div>

        <div className="mt-12 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Button type="button" variant="ghost" onClick={onBack}>
            <ArrowLeft />
            Back to rooms
          </Button>
          <Button type="submit" size="lg">
            Reserve this stay
            <ArrowRight />
          </Button>
        </div>
      </form>

      <aside className="lg:sticky lg:top-28 lg:self-start">{summary}</aside>
    </div>
  );
}

type TextFieldProps = {
  control: ReturnType<typeof useForm<GuestDetails>>["control"];
  name: "firstName" | "lastName" | "email" | "phone";
  label: string;
  type?: string;
  autoComplete?: string;
  className?: string;
};

function TextField({
  control,
  name,
  label,
  type = "text",
  autoComplete,
  className,
}: TextFieldProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field className={className} data-invalid={fieldState.invalid || undefined}>
          <FieldLabel htmlFor={name} className="eyebrow text-muted-foreground">
            {label}
          </FieldLabel>
          <Input
            id={name}
            type={type}
            autoComplete={autoComplete}
            aria-invalid={fieldState.invalid || undefined}
            {...field}
          />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

function StaySummary({
  room,
  arrival,
  departure,
  guests,
  nights,
  total,
}: {
  room: string;
  arrival: Date;
  departure: Date;
  guests: number;
  nights: number;
  total: number;
}) {
  return (
    <div className="border border-border bg-card p-6">
      <p className="eyebrow text-muted-foreground">Your stay</p>
      <p className="mt-4 font-heading text-2xl leading-tight font-normal">{room}</p>
      <dl className="mt-6 flex flex-col gap-3 text-sm">
        <SummaryRow label="Arrival" value={formatDate(arrival)} />
        <SummaryRow label="Departure" value={formatDate(departure)} />
        <SummaryRow label="Nights" value={String(nights)} />
        <SummaryRow label="Guests" value={String(guests)} />
      </dl>
      <div className="mt-6 flex items-baseline justify-between border-t border-border pt-5">
        <span className="eyebrow text-muted-foreground">Total</span>
        <span className="font-heading text-2xl leading-none font-normal">
          {formatCurrency(total)}
        </span>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        Includes breakfast and tourist tax. Settled on departure.
      </p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}

function ConfirmationStep({
  reference,
  guest,
  room,
  photo,
  arrival,
  departure,
  guests,
  nights,
  total,
}: {
  reference: string;
  guest: GuestDetails;
  room: string;
  photo: { src: string; alt: string };
  arrival: Date;
  departure: Date;
  guests: number;
  nights: number;
  total: number;
}) {
  const reduced = useReducedMotion();

  return (
    <div className="mx-auto max-w-3xl text-center">
      <motion.span
        initial={reduced ? undefined : { scale: 0.6, opacity: 0 }}
        animate={reduced ? undefined : { scale: 1, opacity: 1 }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}
        className="mx-auto grid size-14 place-items-center rounded-full border border-primary/40 text-primary"
      >
        <Check className="size-5" />
      </motion.span>

      <h2 className="mt-8 font-heading text-[clamp(2.25rem,6vw,3.75rem)] leading-[1.02] font-light tracking-tight text-balance">
        Your stay is reserved.
      </h2>
      <p className="mx-auto mt-5 max-w-md leading-relaxed text-muted-foreground">
        Casa Lume looks forward to welcoming you, {guest.firstName}. A
        confirmation is on its way to {guest.email}.
      </p>

      <div className="mt-12 border border-border bg-card text-left">
        <div className="relative aspect-21/9 overflow-hidden">
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="(min-width:1024px) 62rem, 100vw"
            className="object-cover"
          />
        </div>
        <div className="grid gap-x-8 gap-y-6 p-6 sm:grid-cols-2 sm:p-8">
          <Detail label="Room" value={room} />
          <Detail label="Confirmation" value={reference} mono />
          <Detail label="Arrival" value={formatLongDate(arrival)} />
          <Detail label="Departure" value={formatLongDate(departure)} />
          <Detail
            label="Guests"
            value={`${guests} ${guests === 1 ? "guest" : "guests"} · ${nights} ${nights === 1 ? "night" : "nights"}`}
          />
          <Detail label="Total" value={formatCurrency(total)} />
        </div>
      </div>

      <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={path("/experiences")} />}
        >
          Plan your days
        </Button>
        <Button
          variant="ghost"
          nativeButton={false}
          render={<Link href={path()} />}
        >
          Back to Casa Lume
        </Button>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="eyebrow text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-2 text-[0.95rem]",
          mono && "font-mono text-[0.9rem] tracking-wide",
        )}
      >
        {value}
      </p>
    </div>
  );
}

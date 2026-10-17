"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { ChevronDown, Minus, Plus } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { COMPANY, OBJECTIVES } from "../_lib/content";
import {
  NOT_SURE,
  earliestWeek,
  firstBookableWeek,
  enquirySchema,
  estimate,
  formatWeek,
  fromIso,
  isoDay,
  mondayOf,
  objectiveFor,
  officeToday,
  weekInSeason,
  type Enquiry,
} from "../_lib/enquiry";
import { sendEnquiry } from "../_lib/actions";
import { ASK_EVENT } from "../_lib/scroll";

const STORE = "breche:enquiry";
const ORDER: (keyof Enquiry)[] = ["objective", "week", "climbers", "name", "contact", "note"];
const DAY = 86_400_000;

type Sent = { reference: string; summary: string };
type Request = { id: string; at: number };

function readStored(): Sent | null {
  try {
    const raw = localStorage.getItem(STORE);
    return raw ? (JSON.parse(raw) as Sent) : null;
  } catch {
    return null;
  }
}

function store(sent: Sent | null) {
  try {
    if (sent) localStorage.setItem(STORE, JSON.stringify(sent));
    else localStorage.removeItem(STORE);
  } catch {}
}

const field = "lead w-full border-b border-(--snow)/30 bg-transparent py-3 text-(--snow) placeholder:text-(--snow)/40 transition-colors hover:border-(--snow)/60 focus:border-(--snow) aria-invalid:border-(--signal)";

export function EnquiryForm() {
  const [sent, setSent] = useState<Sent | null>(null);
  const [returning, setReturning] = useState(false);
  const [request, setRequest] = useState<Request | null>(null);
  const confirmation = useRef<HTMLHeadingElement>(null);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ask = (event: Event) => {
      store(null);
      setSent(null);
      setReturning(false);
      setRequest({ id: (event as CustomEvent<string>).detail, at: event.timeStamp });
    };
    window.addEventListener(ASK_EVENT, ask);
    return () => window.removeEventListener(ASK_EVENT, ask);
  }, []);

  useEffect(() => {
    const stored = readStored();
    if (!stored) return;
    // Restores a past submission after hydration; reading storage during render would mismatch the server.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSent(stored);
    setReturning(true);
  }, []);

  const startAgain = () => {
    store(null);
    setSent(null);
    setReturning(false);
    requestAnimationFrame(() => root.current?.querySelector<HTMLInputElement>("input[name=objective]")?.focus());
  };

  return (
    <div ref={root} id="enquiry-form" className="mt-12 lg:mt-16">
      <div aria-live="polite">
        {sent ? (
          <div className="border-t border-(--snow)/20 pt-8">
            <p className="data flex items-center gap-3 text-(--snow)/70">
              <span aria-hidden className="tick" />
              {returning ? "Since your last visit" : "Received"}
            </p>
            <h3 ref={confirmation} tabIndex={-1} className="display-3 mt-4 max-w-[24ch]">
              Your enquiry <span className="whitespace-nowrap">{sent.reference}</span> is with the office.
            </h3>
            <p className="lead mt-5 max-w-[52ch] text-(--snow)/85">{sent.summary}</p>
            <p className="body mt-4 max-w-[52ch] text-(--snow)/70">
              The guide on duty reads enquiries with the evening bulletin. If you ring before then on {COMPANY.phone}, quote the reference.
            </p>
            <button
              type="button"
              onClick={startAgain}
              className="action mt-8 min-h-11 cursor-pointer border-b border-(--snow)/50 transition-colors hover:border-(--snow)"
            >
              Start another enquiry
            </button>
          </div>
        ) : null}
      </div>

      {!sent && (
        <Form
          request={request}
          onSent={(result) => {
            store(result);
            setSent(result);
            requestAnimationFrame(() => confirmation.current?.focus());
          }}
        />
      )}
    </div>
  );
}

function Form({ request, onSent }: { request: Request | null; onSent: (sent: Sent) => void }) {
  const ids = useId();
  const form = useRef<HTMLFormElement>(null);
  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    getValues,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<Enquiry>({
    resolver: zodResolver(enquirySchema),
    defaultValues: { climbers: 2, name: "", contact: "", note: "" },
    shouldFocusError: false,
  });

  const focusFirst = (failed: Partial<Record<keyof Enquiry, unknown>>) => {
    const first = ORDER.find((name) => failed[name]);
    if (first) setFocus(first);
  };

  const objectiveId = useWatch({ control, name: "objective" });
  const climbers = useWatch({ control, name: "climbers" });
  const objective = objectiveId ? objectiveFor(objectiveId) : undefined;

  useEffect(() => {
    if (!request) return;
    setValue("objective", request.id, { shouldDirty: true });
    const frame = requestAnimationFrame(() =>
      form.current?.querySelector<HTMLInputElement>(`input[name="objective"][value="${request.id}"]`)?.focus({ preventScroll: true }),
    );
    return () => cancelAnimationFrame(frame);
  }, [request, setValue]);

  useEffect(() => {
    const week = getValues("week");
    const chosen = objectiveId ? objectiveFor(objectiveId) : undefined;
    if (!week || !chosen || weekInSeason(chosen, fromIso(week))) return;
    setValue("week", "");
    setError("week", { message: `${chosen.name} runs ${chosen.season}. Choose a week in season.` });
  }, [objectiveId, getValues, setValue, setError]);

  const submit = handleSubmit(async (values) => {
    const result = await sendEnquiry(values);
    if (result.ok) {
      onSent({ reference: result.reference, summary: result.summary });
      return;
    }
    for (const [key, message] of Object.entries(result.errors)) setError(key as keyof Enquiry, { message });
    focusFirst(result.errors);
  }, focusFirst);

  const quote = estimate(objective, climbers ?? 1);

  return (
    <form ref={form} onSubmit={submit} noValidate aria-label="Enquiry" className="grid gap-y-10">
      <fieldset aria-describedby={errors.objective ? `${ids}-objective-error` : undefined}>
        <legend className="label text-(--snow)/70">What you’d like to do</legend>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {OBJECTIVES.map((o) => (
            <label
              key={o.slot.id}
              className={cn(
                "action relative flex min-h-12 cursor-pointer items-center border px-4 py-2 text-left text-balance transition-colors select-none hover:border-(--snow) has-checked:border-(--snow) has-checked:bg-(--snow) has-checked:text-(--ink) has-focus-visible:outline-2 has-focus-visible:outline-offset-4 has-focus-visible:outline-(--snow)",
                errors.objective ? "border-(--signal)" : "border-(--snow)/30",
              )}
            >
              <input type="radio" value={o.slot.id} {...register("objective")} className="absolute inset-0 cursor-pointer opacity-0" />
              {o.name}
            </label>
          ))}
        </div>
        <label className="group action relative mt-2 inline-flex min-h-11 cursor-pointer items-center gap-3 text-(--snow)/85 transition-colors select-none hover:text-(--snow) has-focus-visible:outline-2 has-focus-visible:outline-offset-4 has-focus-visible:outline-(--snow)">
          <input type="radio" value={NOT_SURE} {...register("objective")} className="absolute inset-0 cursor-pointer opacity-0" />
          <span
            aria-hidden
            className={cn(
              "grid size-4 place-items-center border transition-colors group-has-checked:border-(--snow) group-has-checked:bg-(--snow)",
              errors.objective ? "border-(--signal)" : "border-(--snow)/50",
            )}
          />
          Not sure yet; help me choose
        </label>
        <Problem id={`${ids}-objective-error`}>{errors.objective?.message}</Problem>
      </fieldset>

      <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
        <Controller
          control={control}
          name="week"
          render={({ field: { value, onChange, ref }, fieldState }) => (
            <WeekField
              id={`${ids}-week`}
              buttonRef={ref}
              value={value}
              onChange={onChange}
              objectiveId={objectiveId}
              error={fieldState.error?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="climbers"
          render={({ field: { value, onChange } }) => (
            <div role="group" aria-labelledby={`${ids}-climbers`}>
              <p id={`${ids}-climbers`} className="label text-(--snow)/70">
                Climbers
              </p>
              <div className="mt-2 flex items-center gap-3 border-b border-(--snow)/30 pb-2">
                <Step label="One fewer climber" disabled={value <= 1} onClick={() => onChange(value - 1)}>
                  <Minus className="size-4" aria-hidden />
                </Step>
                <output aria-live="polite" className="readout min-w-[2ch] text-center">
                  {value}
                </output>
                <Step label="One more climber" disabled={value >= 12} onClick={() => onChange(value + 1)}>
                  <Plus className="size-4" aria-hidden />
                </Step>
              </div>
              <p className="note mt-3 text-(--snow)/75" aria-live="polite">
                {!quote
                  ? "Choose an objective for the guides needed and an indicative price."
                  : `${quote.guides} ${quote.guides === 1 ? "guide" : "guides"} at ${quote.party} to 1. ${
                      quote.total
                        ? `Indicatively ${quote.total}, at ${quote.each} per person.`
                        : `Priced for ${quote.party} to a guide; the office quotes a smaller party.`
                    }`}
              </p>
            </div>
          )}
        />
      </div>

      <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
        <Text id={`${ids}-name`} label="Your name" autoComplete="name" error={errors.name?.message} {...register("name")} />
        <Text id={`${ids}-contact`} label="Email or phone" error={errors.contact?.message} {...register("contact")} />
      </div>

      <Text id={`${ids}-note`} label="Anything we should know (optional)" placeholder="Last summit, a date that can’t move, a knee…" error={errors.note?.message} {...register("note")} />

      <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="action min-h-13 cursor-pointer bg-(--signal) px-8 text-white transition-colors hover:bg-(--snow) hover:text-(--ink) disabled:cursor-wait disabled:opacity-70"
        >
          {isSubmitting ? "Sending…" : "Send to the office"}
        </button>
        <p className="note max-w-[40ch] text-(--snow)/70">Nothing is booked until a guide has spoken to you.</p>
      </div>
    </form>
  );
}

function WeekField({
  id,
  buttonRef,
  value,
  onChange,
  objectiveId,
  error,
}: {
  id: string;
  buttonRef: React.Ref<HTMLButtonElement>;
  value: string | undefined;
  onChange: (iso: string) => void;
  objectiveId: string | undefined;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const grid = useRef<HTMLDivElement>(null);
  const [today] = useState(() => officeToday());
  const objective = objectiveId ? objectiveFor(objectiveId) : undefined;
  const monday = value ? fromIso(value) : null;
  const local = (d: Date) => new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const earliest = earliestWeek(objective, today);
  const opening = [0, 1, 2, 3, 4, 5, 6].map((d) => new Date(local(earliest).getTime() + d * DAY)).find((d) => !objective || objective.months.includes(d.getMonth() + 1));
  const first = local(firstBookableWeek(today));
  const outOfSeasonNow = objective && !weekInSeason(objective, firstBookableWeek(today));

  return (
    <div>
      <p id={`${id}-label`} className="label text-(--snow)/70">
        The week you have
      </p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          ref={buttonRef}
          aria-labelledby={`${id}-label ${id}-value`}
          aria-invalid={!!error}
          aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
          className={cn(field, "mt-2 flex cursor-pointer items-center justify-between gap-4 text-left", error && "border-(--signal) hover:border-(--signal)")}
        >
          <span id={`${id}-value`} className={cn(!monday && "text-(--snow)/50")}>
            {monday ? formatWeek(monday) : "Choose a week"}
          </span>
          <ChevronDown aria-hidden className="size-4 text-(--snow)/70" />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          initialFocus={() => {
            const days = grid.current;
            const pick = (selector: string) => days?.querySelector<HTMLButtonElement>(`${selector} button:not([disabled])`);
            return pick("[data-selected]") ?? pick("[data-today]") ?? pick("[data-day]:not([data-outside])") ?? true;
          }}
          data-lenis-prevent
          className="max-h-(--available-height) w-auto overflow-y-auto overscroll-contain rounded-none bg-(--snow) p-3 text-(--ink) shadow-xl ring-0"
        >
          {objective && <p className="note mb-2 max-w-[18rem] px-1 text-(--granite)">Greyed-out weeks fall outside the {objective.name} season.</p>}
          <div ref={grid}>
            <Calendar
              mode="range"
              weekStartsOn={1}
              startMonth={first}
              endMonth={new Date(today.getUTCFullYear() + 2, today.getUTCMonth())}
              defaultMonth={monday ? local(monday) : (opening ?? local(earliest))}
              selected={monday ? { from: local(monday), to: new Date(local(monday).getTime() + 6 * DAY) } : undefined}
              onSelect={(_, day) => {
                onChange(isoDay(mondayOf(day)));
                setOpen(false);
              }}
              disabled={[{ before: first }, (date) => !!objective && !weekInSeason(objective, mondayOf(date))]}
              className="bg-transparent p-0 [--cell-size:--spacing(9)] sm:[--cell-size:--spacing(10)]"
            />
          </div>
        </PopoverContent>
      </Popover>
      <p id={`${id}-hint`} className="note mt-3 text-(--snow)/75">
        {objective
          ? `${objective.name} runs ${objective.season}.${outOfSeasonNow ? ` Earliest: ${formatWeek(earliest)}.` : ""}`
          : "Monday to Sunday. Pick any day in it."}
      </p>
      <Problem id={`${id}-error`}>{error}</Problem>
    </div>
  );
}

function Text({
  id,
  label,
  hint,
  error,
  ...input
}: React.ComponentProps<"input"> & { id: string; label: string; hint?: string; error?: string }) {
  const described = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className="label text-(--snow)/70">
        {label}
      </label>
      <input id={id} aria-invalid={!!error} aria-describedby={described} className={cn(field, "mt-2")} {...input} />
      {hint && (
        <p id={`${id}-hint`} className="note mt-3 text-(--snow)/70">
          {hint}
        </p>
      )}
      <Problem id={`${id}-error`}>{error}</Problem>
    </div>
  );
}

function Step({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-disabled={disabled || undefined}
      onClick={() => !disabled && onClick()}
      className="grid size-11 cursor-pointer place-items-center border border-(--snow)/30 transition-colors hover:border-(--snow) hover:bg-(--snow) hover:text-(--ink) aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:border-(--snow)/30 aria-disabled:hover:bg-transparent aria-disabled:hover:text-(--snow)"
    >
      {children}
    </button>
  );
}

function Problem({ id, children }: { id: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} className="note mt-3 flex items-baseline gap-2.5 text-(--snow)">
      <span aria-hidden className="h-2 w-2 flex-none translate-y-[-0.05em] bg-(--signal)" />
      {children}
    </p>
  );
}

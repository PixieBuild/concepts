"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import Image from "next/image";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar as CalendarIcon, Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { PHONE_DISPLAY, PHONE_HREF } from "../_lib/constants";
import { serviceNames } from "./services";

const schema = z.object({
  name: z.string().trim().min(1, "Please enter your name."),
  contact: z.string().trim().min(1, "Add an email or phone so we can confirm."),
  service: z.string().min(1, "Choose a service."),
  barber: z.string(),
  date: z.string().min(1, "Pick a date."),
  time: z.string().min(1, "Pick a time."),
});

type BookingValues = z.infer<typeof schema>;

const pad = (n: number) => String(n).padStart(2, "0");
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromISO = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const fmtDate = (s: string) =>
  fromISO(s).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

const today = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
})();

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=800&q=80&auto=format&fit=crop`;

const barbers = [
  { name: "Marcus Vale", role: "Master barber · 12 yrs", src: img("1656338997878-279d71d48f6e"), alt: "Portrait of Marcus Vale" },
  { name: "Theo Ellison", role: "Senior · fades & tapers", src: img("1754473397061-e18dc1091855"), alt: "Portrait of Theo Ellison" },
  { name: "Dorian Reid", role: "Barber · classic cuts", src: img("1770253980732-dfed1cfdfa43"), alt: "Portrait of Dorian Reid" },
  { name: "Silas Ward", role: "Beard & straight-razor", src: img("1747832910187-f27508ac4c60"), alt: "Portrait of Silas Ward" },
];

const barberNames = barbers.map((b) => b.name);
const timeSlots = ["9:00 AM", "10:30 AM", "12:00 PM", "1:30 PM", "3:00 PM", "4:30 PM", "6:00 PM"];

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="mb-2 block text-[12px] font-bold uppercase tracking-[0.06em] text-foreground/60">
      {children}
    </span>
  );
}

function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return <p className="mt-1.5 text-[12px] font-semibold text-(--brand-700)">{children}</p>;
}

function SelectTrigger({
  open,
  className,
  children,
  ref,
  ...props
}: ComponentProps<"button"> & { open?: boolean }) {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "flex h-12.5 w-full cursor-pointer items-center justify-between gap-2.5 rounded-lg border bg-transparent px-3.75 text-[15px] outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        // Base UI moves focus into the popup while open, so drive the ring from `open`.
        open ? "border-ring ring-[3px] ring-ring/50" : "border-input hover:border-foreground/45",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown
        className={cn(
          "size-4 shrink-0 text-foreground/50 transition-transform duration-200",
          open && "rotate-180",
        )}
      />
    </button>
  );
}

function SelectMenu({
  label,
  value,
  placeholder,
  options,
  onChange,
  error,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);

  const current = options.find((o) => o.value === value);
  const shown = current ? current.label : placeholder;

  return (
    <div className="relative">
      <FieldLabel>{label}</FieldLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger render={<SelectTrigger open={open} aria-haspopup="listbox" />}>
          <span className={value ? "text-foreground" : "text-foreground/45"}>{shown}</span>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={6}
          role="listbox"
          className="mrd-scroll max-h-62 w-(--anchor-width) gap-0 overflow-auto rounded-[13px] border border-foreground/15 bg-background p-1.5 shadow-(--shadow-soft-lg) ring-0"
        >
          {options.map((o) => {
            const selected = o.value === value;
            return (
              <button
                key={o.value || "any"}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-2.5 rounded-[9px] px-3 py-2.75 text-left text-[14.5px] transition-colors",
                  selected ? "bg-secondary font-semibold text-foreground" : "text-foreground hover:bg-secondary",
                )}
              >
                <span>{o.label}</span>
                {selected && <Check className="size-4 shrink-0 text-primary" />}
              </button>
            );
          })}
        </PopoverContent>
      </Popover>
      <FieldError>{error}</FieldError>
    </div>
  );
}

const asidePoints = [
  "Hot towel + straight-razor neck finish",
  "We text a confirmation within the hour",
  "Walk-ins welcome before noon",
  "Closed Sundays & Mondays",
];

function BookingAside() {
  return (
    <aside className="flex h-full flex-col border-t border-foreground/10 bg-secondary/80 p-[clamp(22px,3vw,30px)] lg:border-l lg:border-t-0">
      <div>
        <div className="mb-1 text-[12px] font-bold uppercase tracking-[0.09em] text-(--brand-700)">
          Good to know
        </div>
        <h3 className="font-heading text-[22px] font-extrabold leading-[1.15]">
          Booked to the minute
        </h3>
        <ul className="mt-6 flex flex-col gap-4">
          {asidePoints.map((p) => (
            <li key={p} className="flex gap-3 text-[14px] leading-normal text-foreground/72">
              <span className="mt-1.75 block size-2 shrink-0 bg-primary" />
              {p}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-8 border-t border-border pt-5 lg:mt-auto">
        <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-foreground/56">
          Prefer to call?
        </div>
        <a
          href={PHONE_HREF}
          className="mt-1.5 inline-block font-heading text-[20px] font-extrabold text-foreground no-underline transition-colors hover:text-primary"
        >
          {PHONE_DISPLAY}
        </a>
      </div>
    </aside>
  );
}

export default function BookingForm() {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<BookingValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", contact: "", service: "", barber: "", date: "", time: "" },
  });

  const [submitted, setSubmitted] = useState(false);
  const [calOpen, setCalOpen] = useState(false);
  const values = useWatch({ control }) as BookingValues;

  const setField = (field: keyof BookingValues) => (value: string) =>
    setValue(field, value, { shouldValidate: true });

  const selectDate = (date: Date | undefined) => {
    if (date) setValue("date", toISO(date), { shouldValidate: true });
    setCalOpen(false);
  };

  const summary = [
    { k: "Service", v: values.service },
    { k: "Barber", v: values.barber || "Any available barber" },
    { k: "Date", v: values.date ? fmtDate(values.date) : "" },
    { k: "Time", v: values.time },
  ];

  return (
    <>
      <div className="mb-4 text-[12px] font-bold uppercase tracking-[0.09em] text-foreground/58">
        Choose your barber
      </div>
      <div className="grid grid-cols-2 gap-4 min-[900px]:grid-cols-4">
        {barbers.map((b) => {
          const selected = values.barber === b.name;
          return (
            <button
              type="button"
              key={b.name}
              onClick={() => setValue("barber", b.name, { shouldValidate: true })}
              className="group relative cursor-pointer overflow-hidden rounded-[14px] border border-foreground/12 bg-background text-left transition-all duration-200 hover:-translate-y-1 hover:border-foreground/34 hover:shadow-(--shadow-soft-md)"
            >
              <div className="relative aspect-3/4 overflow-hidden">
                <Image
                  src={b.src}
                  alt={b.alt}
                  fill
                  sizes="(max-width: 900px) 50vw, 25vw"
                  className="object-cover"
                />
              </div>
              <div className="px-3.5 pb-3.5 pt-3">
                <div className="font-heading text-[16px] font-extrabold leading-[1.2]">{b.name}</div>
                <div className="mt-0.75 text-[12.5px] text-foreground/60">{b.role}</div>
              </div>
              {selected && (
                <>
                  <div className="pointer-events-none absolute inset-0 rounded-[14px] border-[3px] border-primary" />
                  <span className="absolute right-2.5 top-2.5 rounded-[8px] bg-primary px-2.25 py-1.25 font-heading text-[10px] font-extrabold uppercase tracking-[0.08em] text-white">
                    ✓ Picked
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-9 overflow-hidden rounded-[18px] border border-foreground/12 bg-background shadow-(--shadow-soft-md)">
        <div className="grid grid-cols-1 lg:grid-cols-[1.65fr_1fr]">
          {submitted ? (
            <div className="p-[clamp(22px,4vw,38px)]">
              <div className="flex size-12 items-center justify-center rounded-[12px] bg-primary text-[26px] font-extrabold text-white">
                ✓
              </div>
              <h3 className="mt-5 mb-1.5 font-heading text-[28px] font-extrabold leading-[1.1]">
                You&rsquo;re booked, {values.name}.
              </h3>
              <p className="mb-5.5 text-[15px] leading-[1.6] text-foreground/72">
                We&rsquo;ll text a confirmation to <b>{values.contact}</b> shortly. Here&rsquo;s the
                chair you reserved:
              </p>
              <div className="border-t-2 border-border">
                {summary.map((row) => (
                  <div
                    key={row.k}
                    className="grid grid-cols-[minmax(0,140px)_1fr] gap-4 border-b border-border py-3.25 text-[14.5px]"
                  >
                    <span className="text-[12px] font-bold uppercase tracking-[0.06em] text-foreground/56">
                      {row.k}
                    </span>
                    <span className="font-semibold">{row.v}</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  reset();
                  setSubmitted(false);
                }}
                className="mt-6 inline-flex items-center gap-2 rounded-[11px] border-2 border-foreground/25 bg-transparent px-5.5 py-3 font-heading text-[14px] font-extrabold text-foreground transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
              >
                Book another chair
              </button>
            </div>
          ) : (
            <div className="p-[clamp(22px,4vw,38px)]">
              <form onSubmit={handleSubmit(() => setSubmitted(true))} noValidate>
                <div className="grid grid-cols-1 gap-x-6 gap-y-5.5 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Name</FieldLabel>
                    <Input
                      {...register("name")}
                      placeholder="First and last"
                      className="h-12.5 px-3.75 text-[15px] md:text-[15px]"
                    />
                    <FieldError>{errors.name?.message}</FieldError>
                  </div>

                  <div>
                    <FieldLabel>Email or phone</FieldLabel>
                    <Input
                      {...register("contact")}
                      placeholder="So we can confirm"
                      className="h-12.5 px-3.75 text-[15px] md:text-[15px]"
                    />
                    <FieldError>{errors.contact?.message}</FieldError>
                  </div>

                  <SelectMenu
                    label="Service"
                    placeholder="Select a service"
                    value={values.service}
                    onChange={setField("service")}
                    options={serviceNames.map((n) => ({ label: n, value: n }))}
                    error={errors.service?.message}
                  />

                  <SelectMenu
                    label="Barber"
                    placeholder="Any available barber"
                    value={values.barber}
                    onChange={setField("barber")}
                    options={[
                      { label: "Any available barber", value: "" },
                      ...barberNames.map((n) => ({ label: n, value: n })),
                    ]}
                  />

                  <div className="relative">
                    <FieldLabel>Date</FieldLabel>
                    <Popover open={calOpen} onOpenChange={setCalOpen}>
                      <PopoverTrigger render={<SelectTrigger open={calOpen} />}>
                        <span className="flex items-center gap-2.5">
                          <CalendarIcon className="size-4 text-foreground/60" />
                          <span className={values.date ? "text-foreground" : "text-foreground/45"}>
                            {values.date ? fmtDate(values.date) : "Select a date"}
                          </span>
                        </span>
                      </PopoverTrigger>
                      <PopoverContent
                        align="start"
                        sideOffset={6}
                        className="w-auto p-3.5"
                      >
                        <Calendar
                          mode="single"
                          selected={values.date ? fromISO(values.date) : undefined}
                          onSelect={selectDate}
                          startMonth={today}
                          disabled={[{ before: today }, { dayOfWeek: [0, 1] }]}
                        />
                        <div className="mt-2.5 border-t border-border pt-2.5 text-[11.5px] text-foreground/56">
                          Closed Sundays &amp; Mondays
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FieldError>{errors.date?.message}</FieldError>
                  </div>

                  <SelectMenu
                    label="Time"
                    placeholder="Select a time"
                    value={values.time}
                    onChange={setField("time")}
                    options={timeSlots.map((t) => ({ label: t, value: t }))}
                    error={errors.time?.message}
                  />
                </div>

                <button
                  type="submit"
                  className="mt-7 inline-flex items-center gap-2.5 rounded-[12px] border-2 border-primary bg-primary px-6.5 py-3.5 font-heading text-[15px] font-extrabold text-white shadow-(--shadow-soft-sm) transition-all duration-200 hover:-translate-y-0.5 hover:border-(--brand-700) hover:bg-(--brand-700) hover:shadow-(--shadow-soft-md) active:translate-y-0"
                >
                  Confirm booking <span className="text-[17px]">→</span>
                </button>
              </form>
            </div>
          )}

          <BookingAside />
        </div>
      </div>
    </>
  );
}

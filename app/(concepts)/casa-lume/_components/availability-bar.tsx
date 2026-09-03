"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DateField } from "./date-field";
import { GuestField } from "./guest-field";
import { formatDate, toDateParam } from "@/app/(concepts)/casa-lume/_lib/booking";
import { path } from "@/app/(concepts)/casa-lume/site";

function useAvailabilitySearch() {
  const router = useRouter();
  const [arrival, setArrival] = useState<Date | undefined>();
  const [departure, setDeparture] = useState<Date | undefined>();
  const [guests, setGuests] = useState(2);

  const invalid = Boolean(arrival && departure && departure <= arrival);

  function submit() {
    const params = new URLSearchParams();
    if (arrival) params.set("arrival", toDateParam(arrival));
    if (departure && !invalid) params.set("departure", toDateParam(departure));
    params.set("guests", String(guests));
    router.push(`${path("/booking")}?${params.toString()}`);
  }

  return {
    arrival,
    setArrival,
    departure,
    setDeparture,
    guests,
    setGuests,
    invalid,
    submit,
  };
}

export function AvailabilityBar() {
  const search = useAvailabilitySearch();

  return (
    <>
      <div className="hidden lg:grid lg:grid-cols-[minmax(11rem,auto)_1fr_1fr_1fr_auto] lg:items-stretch">
        <div className="flex flex-col justify-center gap-2 pr-10">
          <p className="eyebrow text-primary">Your stay</p>
          <p className="text-sm text-muted-foreground">Seventeen rooms, seasonal rates</p>
        </div>
        <DateField
          tone="bar"
          label="Arrival"
          placeholder="Choose a date"
          className="border-l border-border px-8 py-6"
          value={search.arrival}
          onChange={search.setArrival}
        />
        <DateField
          tone="bar"
          label="Departure"
          placeholder="Choose a date"
          className="border-l border-border px-8 py-6"
          value={search.departure}
          onChange={search.setDeparture}
          disabledBefore={search.arrival}
          invalid={search.invalid}
        />
        <GuestField
          tone="bar"
          label="Guests"
          className="border-l border-border px-8 py-6"
          value={search.guests}
          onChange={search.setGuests}
        />
        <Button
          size="lg"
          onClick={search.submit}
          className="h-auto self-stretch rounded-none px-10"
        >
          Check availability
          <ArrowRight />
        </Button>
      </div>

      <div className="lg:hidden">
        <MobileAvailabilitySheet />
      </div>
    </>
  );
}

function MobileAvailabilitySheet({
  trigger,
}: {
  trigger?: React.ReactElement;
}) {
  const search = useAvailabilitySearch();
  const [open, setOpen] = useState(false);

  const defaultTrigger = (
    <button
      type="button"
      className="flex w-full items-center justify-between gap-4 py-5 text-left text-foreground"
    >
      <span className="flex flex-col gap-2">
        <span className="eyebrow text-primary">Your stay</span>
        <span className="font-heading text-2xl leading-none font-normal">
          {search.arrival
            ? `${formatDate(search.arrival)} — ${formatDate(search.departure, "…")}`
            : "Choose your dates"}
        </span>
      </span>
      <CalendarDays className="size-5 shrink-0 text-muted-foreground" />
    </button>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={trigger ?? defaultTrigger} />

      <SheetContent data-lenis-prevent side="bottom" className="max-h-[92svh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="font-heading text-3xl leading-none font-normal">
            Your stay
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-8 px-4 pb-2">
          <DateField
            label="Arrival"
            value={search.arrival}
            onChange={search.setArrival}
          />
          <DateField
            className="border-l border-border/70 pl-8"
            label="Departure"
            value={search.departure}
            onChange={search.setDeparture}
            disabledBefore={search.arrival}
            invalid={search.invalid}
          />
          <GuestField
            className="border-l border-border/70 pl-8"
            value={search.guests}
            onChange={search.setGuests}
          />
        </div>

        <div className="sticky bottom-0 mt-4 border-t border-border bg-background p-4">
          <Button size="lg" className="w-full" onClick={search.submit}>
            Check availability
            <ArrowRight />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

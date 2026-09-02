"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, Users } from "lucide-react";

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
      <div className="hidden border border-background/12 bg-foreground/35 backdrop-blur-md lg:grid lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-stretch">
        <DateField
          tone="dark"
          icon={<CalendarDays className="size-4" />}
          label="Check in"
          className="px-6 py-4"
          value={search.arrival}
          onChange={search.setArrival}
        />
        <DateField
          tone="dark"
          icon={<CalendarDays className="size-4" />}
          label="Check out"
          className="border-l border-background/12 px-6 py-4"
          value={search.departure}
          onChange={search.setDeparture}
          disabledBefore={search.arrival}
          invalid={search.invalid}
        />
        <GuestField
          tone="dark"
          icon={<Users className="size-4" />}
          label="Guests"
          className="border-l border-background/12 px-6 py-4"
          value={search.guests}
          onChange={search.setGuests}
        />
        <Button
          size="lg"
          onClick={search.submit}
          className="m-2.5 h-auto rounded-none bg-background px-7 text-(--clay) hover:bg-background/85"
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
      className="flex w-full items-center justify-between gap-4 border border-background/20 bg-foreground/45 px-5 py-4 text-left text-background backdrop-blur-md"
    >
      <span className="flex flex-col gap-1">
        <span className="eyebrow text-background/60">Check availability</span>
        <span className="text-[1.0625rem] leading-tight font-medium">
          {search.arrival
            ? `${formatDate(search.arrival)} — ${formatDate(search.departure, "…")}`
            : "Choose your dates"}
        </span>
      </span>
      <CalendarDays className="size-5 shrink-0" />
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

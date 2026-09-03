import type { Metadata, ResolvingMetadata } from "next";

import { BookingFlow } from "./_components/booking-flow";
import { fromDateParam } from "@/app/(concepts)/casa-lume/_lib/booking";
import { path, url } from "@/app/(concepts)/casa-lume/site";

const description =
  "Reserve a room at Casa Lume. Seventeen rooms above the Ligurian sea, open April to early November.";

export async function generateMetadata(
  _props: unknown,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  return {
  title: "Book your stay",
  description,
  alternates: { canonical: path("/booking") },
  openGraph: {
    images: (await parent).openGraph?.images ?? [],
    title: "Book your stay at Casa Lume",
    description,
    url: url("/booking"),
  },
  };
}

export default async function BookingPage({ searchParams }: PageProps<"/casa-lume/booking">) {
  const params = await searchParams;
  const readParam = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const guests = Number(readParam("guests"));

  return (
    <div className="pt-32 pb-28 sm:pt-40 sm:pb-36">
      <BookingFlow
        initialRoom={readParam("room")}
        initialArrival={fromDateParam(readParam("arrival"))}
        initialDeparture={fromDateParam(readParam("departure"))}
        initialGuests={Number.isFinite(guests) && guests > 0 ? guests : undefined}
      />
    </div>
  );
}

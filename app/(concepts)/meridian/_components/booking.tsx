import BookingForm from "./booking-form";
import { Container } from "./container";
import { Kicker } from "./kicker";
import { SectionHeading } from "./section-heading";

export function Booking() {
  return (
    <section
      id="book"
      className="scroll-mt-15.5 border-y-2 border-border bg-secondary py-[clamp(60px,7vw,104px)]"
    >
      <Container>
        <Kicker>Reserve</Kicker>
        <SectionHeading className="mb-2.5">Book a chair</SectionHeading>
        <p className="mb-9.5 max-w-[52ch] text-[16px] leading-[1.6] text-foreground/72">
          Pick your barber, then tell us when. We&rsquo;ll confirm by text within the hour.
        </p>
        <BookingForm />
      </Container>
    </section>
  );
}

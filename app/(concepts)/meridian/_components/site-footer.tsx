import { Container } from "./container";
import { ADDRESS, BRAND, MAPS_HREF, PHONE_DISPLAY, PHONE_HREF } from "../_lib/constants";

const hoursRows = [
  { day: "Tuesday – Friday", time: "9:00 – 19:00", closed: false },
  { day: "Saturday", time: "8:00 – 17:00", closed: false },
  { day: "Sunday – Monday", time: "Closed", closed: true },
];

export function SiteFooter() {
  return (
    <footer className="bg-foreground pb-8 pt-[clamp(48px,5vw,72px)] text-background">
      <Container>
        <div className="grid grid-cols-1 gap-10 min-[620px]:grid-cols-2 min-[900px]:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="mb-3.5 flex items-center gap-2.75">
              <span className="block size-3.75 bg-primary" />
              <span className="font-heading text-[19px] font-extrabold tracking-[0.16em]">{BRAND}</span>
            </div>
            <p className="m-0 max-w-[34ch] text-[14px] leading-[1.6] text-background/66">
              A men&rsquo;s grooming lounge in downtown Chicago. Barbering the way it should be
              &mdash; precise, unhurried, no fuss.
            </p>
            <a
              href="#book"
              className="mt-5 inline-flex items-center gap-2 rounded-[11px] border-2 border-primary bg-primary px-5 py-2.5 font-heading text-[14px] font-extrabold text-white no-underline transition-all hover:-translate-y-0.5 hover:border-(--brand-700) hover:bg-(--brand-700) active:translate-y-0"
            >
              Book a chair <span className="text-[15px]">→</span>
            </a>
          </div>

          <div>
            <div className="mb-4 text-[12px] font-bold uppercase tracking-[0.09em] text-(--brand-2)">
              Opening hours
            </div>
            {hoursRows.map((h) => (
              <div
                key={h.day}
                className="flex items-baseline justify-between gap-4 border-b border-background/20 py-2.75"
              >
                <span className="text-[14px] font-semibold">{h.day}</span>
                {h.closed ? (
                  <span className="text-[13px] font-bold uppercase tracking-[0.04em] text-(--brand-2)">
                    {h.time}
                  </span>
                ) : (
                  <span className="font-heading text-[14.5px] font-extrabold">{h.time}</span>
                )}
              </div>
            ))}
          </div>

          <div>
            <div className="mb-4 text-[12px] font-bold uppercase tracking-[0.09em] text-(--brand-2)">
              Find us
            </div>
            <p className="m-0 text-[14.5px] leading-[1.7] text-background/82">
              {ADDRESS.line1}
              <br />
              {ADDRESS.line2}
            </p>
            <a
              href={PHONE_HREF}
              className="mt-3 block font-heading text-[16px] font-extrabold text-background no-underline"
            >
              {PHONE_DISPLAY}
            </a>
            <a
              href={MAPS_HREF}
              target="_blank"
              rel="noopener"
              className="mt-3.5 inline-flex items-center gap-1.5 border-b-2 border-background/45 pb-0.5 text-[13.5px] font-semibold text-background no-underline transition-colors hover:border-(--brand-2)"
            >
              Get directions <span>→</span>
            </a>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t-2 border-background/24 pt-5.5 text-[12.5px] text-background/56">
          <span>© 2026 {BRAND} Grooming Lounge</span>
          <span className="flex gap-5">
            <a href="#" className="text-background/70 no-underline transition-colors hover:text-background">
              Instagram
            </a>
            <a href="#" className="text-background/70 no-underline transition-colors hover:text-background">
              Google
            </a>
            <a href="#book" className="text-background/70 no-underline transition-colors hover:text-background">
              Book
            </a>
          </span>
        </div>
      </Container>
    </footer>
  );
}

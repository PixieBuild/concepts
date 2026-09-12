import { Container } from "./container";
import { PHONE_DISPLAY, PHONE_HREF } from "../_lib/constants";

export function Cta() {
  return (
    <section className="bg-primary text-white">
      <Container className="flex flex-wrap items-center justify-between gap-8 py-[clamp(54px,6vw,90px)]">
        <h2 className="m-0 font-heading text-[clamp(34px,4.6vw,60px)] font-extrabold leading-[1.02] tracking-[-0.02em]">
          <span className="block">Look sharp.</span>
          <span className="block">Book your chair.</span>
        </h2>
        <div className="flex flex-wrap items-center gap-4">
          <a
            href="#book"
            className="inline-flex items-center gap-2.5 rounded-[12px] border-2 border-white bg-white px-6.5 py-3.5 font-heading text-[15px] font-extrabold text-primary no-underline transition-all hover:-translate-y-0.5 hover:border-foreground hover:bg-foreground hover:text-white active:translate-y-0"
          >
            Book a chair <span className="text-[17px]">→</span>
          </a>
          <a
            href={PHONE_HREF}
            className="border-b-2 border-white/55 pb-0.5 font-heading text-[15px] font-extrabold text-white no-underline"
          >
            or call {PHONE_DISPLAY}
          </a>
        </div>
      </Container>
    </section>
  );
}

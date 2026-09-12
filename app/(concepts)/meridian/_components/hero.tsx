import Image from "next/image";
import { Container } from "./container";

const heroImage = {
  src: "https://images.unsplash.com/photo-1675599193990-33d71150902b?w=1200&q=80&auto=format&fit=crop",
  alt: "Interior of the shop floor",
};

export function Hero() {
  return (
    <section className="scroll-mt-18 py-[clamp(44px,6vw,86px)] pb-[clamp(40px,5vw,72px)]">
      <Container>
        <div className="grid grid-cols-1 items-center gap-[clamp(32px,5vw,68px)] min-[900px]:grid-cols-[1.06fr_.94fr]">
          <div>
            <span className="mrd-rise mrd-d1 mb-6 inline-flex items-center gap-2.25 text-[13px] font-bold uppercase tracking-[0.09em] text-(--brand-700)">
              <span className="block h-0.5 w-6.5 bg-primary" />
              Men&rsquo;s grooming lounge · Est. 2014
            </span>
            <h1 className="mrd-rise mrd-d2 m-0 font-heading text-[clamp(42px,6vw,84px)] font-extrabold leading-[1.02] tracking-[-0.028em]">
              <span className="block">A precise cut.</span>
              <span className="block">A proper shave.</span>
              <span className="block text-primary">Zero fuss.</span>
            </h1>
            <p className="mrd-rise mrd-d3 mt-7.5 max-w-[52ch] text-[clamp(16px,1.5vw,18.5px)] leading-[1.62] text-foreground/78">
              Traditional barbering, done sharp. Skin fades, hot-towel shaves and beard work by a
              bench of career barbers &mdash; booked to the minute, so you&rsquo;re in the chair, not
              the waiting room.
            </p>
            <div className="mrd-rise mrd-d4 mt-8.5 flex flex-wrap gap-3.5">
              <a
                href="#book"
                className="inline-flex items-center gap-2.5 rounded-[12px] border-2 border-primary bg-primary px-6 py-3.5 font-heading text-[15px] font-extrabold text-white no-underline shadow-(--shadow-soft-sm) transition-all hover:-translate-y-0.5 hover:border-(--brand-700) hover:bg-(--brand-700) hover:shadow-(--shadow-soft-md) active:translate-y-0"
              >
                Book a chair <span className="text-[17px]">→</span>
              </a>
              <a
                href="#services"
                className="inline-flex items-center gap-2 rounded-[12px] border-2 border-foreground/20 bg-transparent px-6 py-3.5 font-heading text-[15px] font-extrabold text-foreground no-underline transition-all hover:-translate-y-0.5 hover:border-foreground hover:bg-foreground hover:text-background active:translate-y-0"
              >
                View the menu
              </a>
            </div>
            <div className="mrd-rise mrd-d5 mt-8.5 flex flex-wrap items-center gap-x-5 gap-y-2.5 text-[13.5px] text-foreground/60">
              <span className="font-heading text-[15px] font-extrabold text-(--brand-700)">★ 4.9</span>
              <span>1,200+ reviews</span>
              <span aria-hidden className="text-border">|</span>
              <span>6 chairs</span>
              <span aria-hidden className="text-border">|</span>
              <span>Walk-ins before noon</span>
            </div>
          </div>

          <div className="mrd-rise mrd-d3 relative">
            <figure className="m-0 aspect-4/5 overflow-hidden rounded-[16px] border border-foreground/12">
              <div className="relative size-full">
                <Image
                  src={heroImage.src}
                  alt={heroImage.alt}
                  fill
                  priority
                  sizes="(max-width: 900px) 100vw, 45vw"
                  className="object-cover"
                />
              </div>
            </figure>
            <div className="mrd-floatA absolute -left-4.5 top-5.5 flex items-center gap-3 rounded-[14px] border border-border bg-background px-4.5 py-3.5 shadow-(--shadow-soft-lg)">
              <span className="font-heading text-[30px] font-extrabold leading-none text-primary">4.9</span>
              <span className="text-[12px] leading-[1.35] text-foreground/70">
                ★★★★★
                <br />
                1,200+ reviews
              </span>
            </div>
            <div className="mrd-floatB absolute -right-4 bottom-6.5 rounded-[14px] bg-primary px-4.5 py-3.5 text-white shadow-(--shadow-soft-lg)">
              <div className="text-[11px] font-bold uppercase tracking-[0.08em] opacity-85">
                Next available
              </div>
              <div className="mt-0.75 font-heading text-[18px] font-extrabold">Today · 3:00 PM</div>
            </div>
            <div className="mrd-floatA absolute -top-4 right-6 rounded-[11px] bg-foreground px-3.5 py-2 font-heading text-[12px] font-extrabold tracking-[0.06em] text-background shadow-(--shadow-soft-md)">
              EST. 2014
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

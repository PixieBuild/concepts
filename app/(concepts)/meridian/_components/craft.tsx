import Image from "next/image";
import { Container } from "./container";
import { Kicker } from "./kicker";
import { SectionHeading } from "./section-heading";

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=800&q=80&auto=format&fit=crop`;

const shots = [
  { cap: "In the chair", src: img("1770253980732-dfed1cfdfa43") },
  { cap: "The finish", src: img("1754473397061-e18dc1091855") },
  { cap: "Line work", src: img("1747832910187-f27508ac4c60") },
];

export function Craft() {
  return (
    <section id="craft" className="scroll-mt-17.5 py-[clamp(60px,7vw,104px)] pb-[clamp(48px,6vw,80px)]">
      <Container>
        <Kicker>Inside the shop</Kicker>
        <SectionHeading className="mb-2.5">The craft</SectionHeading>
        <p className="mb-8.5 max-w-[52ch] text-[16px] leading-[1.6] text-foreground/72">
          A look at the room and the work that happens in the chair &mdash; steady hands, sharp
          lines, no rush.
        </p>
        <div className="grid grid-cols-1 gap-4.5 min-[760px]:grid-cols-3">
          {shots.map((g) => (
            <figure key={g.cap} className="group m-0">
              <div className="aspect-4/5 overflow-hidden rounded-[14px] border border-foreground/12">
                <div className="relative size-full">
                  <Image
                    src={g.src}
                    alt={g.cap}
                    fill
                    sizes="(max-width: 760px) 100vw, 33vw"
                    className="object-cover transition-transform duration-400 ease-[cubic-bezier(.2,.7,.2,1)] group-hover:scale-105"
                  />
                </div>
              </div>
              <figcaption className="mt-3 text-[13px] font-bold uppercase tracking-[0.04em] text-foreground/60">
                {g.cap}
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}

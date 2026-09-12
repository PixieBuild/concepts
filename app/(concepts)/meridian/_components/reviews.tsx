import { Container } from "./container";
import { Kicker } from "./kicker";
import { SectionHeading } from "./section-heading";

const reviews = [
  { quote: "Sharpest fade in the city. I book Marcus a month out and it's worth every minute.", name: "James O.", meta: "Skin Fade" },
  { quote: "Walked out looking like the best version of myself. The hot-towel shave is unreal.", name: "Daniel R.", meta: "Full Service" },
  { quote: "Clean, precise, no small talk unless you want it. Exactly what I want from a barber.", name: "Anthony P.", meta: "Cut & Beard" },
];

export function Reviews() {
  return (
    <section
      id="reviews"
      className="scroll-mt-15.5 border-y-2 border-border bg-secondary py-[clamp(60px,7vw,104px)]"
    >
      <Container>
        <Kicker>Word of mouth</Kicker>
        <SectionHeading className="mb-10">What men say</SectionHeading>
        <div className="grid grid-cols-1 gap-x-10 min-[900px]:grid-cols-3">
          {reviews.map((r) => (
            <figure key={r.name} className="m-0 border-t-2 border-border py-8.5">
              <div className="mb-4 text-[15px] tracking-[2px] text-primary">★★★★★</div>
              <blockquote className="m-0 font-heading text-[20px] font-extrabold leading-[1.35] tracking-[-0.01em]">
                &ldquo;{r.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-4.5 text-[14px] text-foreground/64">
                {r.name} · {r.meta}
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}

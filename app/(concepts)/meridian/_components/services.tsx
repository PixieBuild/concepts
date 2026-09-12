import { Container } from "./container";
import { Kicker } from "./kicker";
import { SectionHeading } from "./section-heading";

const serviceGroups = [
  {
    label: "Cuts",
    items: [
      { name: "Signature Cut", desc: "Consultation, clipper-and-scissor cut, wash and style.", price: "$55" },
      { name: "Skin Fade", desc: "Bald or taper fade blended to the skin, sharp finish.", price: "$60" },
      { name: "Executive Trim", desc: "A tidy-up between visits to keep the shape holding.", price: "$40" },
      { name: "Buzz & Line-up", desc: "One-length clipper cut with a crisp razor edge-up.", price: "$35" },
    ],
  },
  {
    label: "Shaves & beard",
    items: [
      { name: "Hot Towel Shave", desc: "Steam towels, hot lather and a straight-razor shave.", price: "$50" },
      { name: "Beard Sculpt", desc: "Trimmed, shaped and lined with oil and a hot towel.", price: "$35" },
      { name: "Cut & Beard", desc: "Signature cut paired with a full beard sculpt.", price: "$80" },
    ],
  },
  {
    label: "The full works",
    items: [
      { name: "The Full Service", desc: "Cut, hot-towel shave and an express facial. The reset.", price: "$140" },
      { name: "Grey Blending", desc: "Subtle colour to soften the grey, natural finish.", price: "$65" },
      { name: "Scalp & Facial", desc: "Deep-clean facial and invigorating scalp treatment.", price: "$70" },
    ],
  },
];

export const serviceNames = serviceGroups.flatMap((g) => g.items.map((s) => s.name));

export function Services() {
  return (
    <section
      id="services"
      className="scroll-mt-17.5 border-t-2 border-border py-[clamp(60px,7vw,104px)] pb-[clamp(48px,6vw,84px)]"
    >
      <Container>
        <Kicker>The menu</Kicker>
        <SectionHeading className="mb-2.5">Services &amp; pricing</SectionHeading>
        <p className="m-0 max-w-[50ch] text-[16px] leading-[1.6] text-foreground/72">
          Every service includes a hot towel and a straight-razor neck finish. No membership
          required.
        </p>

        <div className="mt-11 flex flex-col gap-11">
          {serviceGroups.map((grp) => (
            <div key={grp.label}>
              <div className="mb-4.5 flex items-center gap-2.75 text-[13px] font-bold uppercase tracking-[0.09em] text-(--brand-700)">
                <span className="block size-2 bg-primary" />
                {grp.label}
              </div>
              <div className="grid grid-cols-1 gap-3.5 min-[620px]:grid-cols-2">
                {grp.items.map((s) => (
                  <div
                    key={s.name}
                    className="flex flex-col gap-2.75 rounded-[16px] border border-foreground/12 bg-background p-5.5 transition-all hover:-translate-y-0.75 hover:border-foreground/30 hover:shadow-(--shadow-soft-md)"
                  >
                    <div className="flex items-baseline justify-between gap-3.5">
                      <span className="font-heading text-[19px] font-extrabold leading-[1.2]">
                        {s.name}
                      </span>
                      <span className="whitespace-nowrap font-heading text-[20px] font-extrabold text-primary">
                        {s.price}
                      </span>
                    </div>
                    <p className="m-0 flex-1 text-[14px] leading-[1.55] text-foreground/64">{s.desc}</p>
                    <a
                      href="#book"
                      className="inline-flex items-center gap-1.5 self-start rounded-[10px] border-[1.5px] border-foreground/28 bg-transparent px-3.75 py-2 font-heading text-[13px] font-extrabold text-foreground no-underline transition-colors hover:border-primary hover:bg-primary hover:text-white"
                    >
                      Book <span className="text-[15px]">→</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

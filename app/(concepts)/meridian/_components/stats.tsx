import { Container } from "./container";

const stats = [
  { num: "4.9", label: "Average rating, 1,200+ cuts" },
  { num: "12", label: "Years on the block" },
  { num: "6", label: "Career barbers on the bench" },
  { num: "35min", label: "Average time in the chair" },
];

export function Stats() {
  return (
    <section className="border-t-2 border-border py-[clamp(36px,4vw,56px)]">
      <Container>
        <div className="grid grid-cols-2 gap-x-6 gap-y-7.5 min-[620px]:grid-cols-4">
          {stats.map((st) => (
            <div key={st.label}>
              <p className="m-0 font-heading text-[clamp(32px,3.4vw,48px)] font-extrabold leading-none text-primary">
                {st.num}
              </p>
              <p className="mt-3.25 max-w-[22ch] text-[12.5px] uppercase tracking-[0.06em] text-foreground/64">
                {st.label}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

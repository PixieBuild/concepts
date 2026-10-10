import { QUOTE } from "../_lib/content";

export function Quote() {
  return (
    <section className="px-6 py-28 text-center sm:px-10 lg:py-40">
      <p className="eyebrow text-muted-foreground">From a customer</p>
      <blockquote className="mx-auto mt-8 max-w-[24ch] font-heading text-[clamp(2.3rem,4.6vw,4.9rem)] leading-[1.02]">“{QUOTE.text}”</blockquote>
      <p className="mt-8 text-[0.95rem] text-muted-foreground">
        {QUOTE.by} · {QUOTE.product}
      </p>
    </section>
  );
}

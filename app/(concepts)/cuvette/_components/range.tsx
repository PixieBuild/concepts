import Image from "next/image";

import { IMAGE_BASE, PRODUCTS, SET } from "../_lib/content";

export function Range() {
  return (
    <section id="range" className="relative bg-background px-6 py-24 sm:px-10 lg:py-32">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow text-muted-foreground">The range</p>
          <h2 className="mt-4 font-heading text-[clamp(2.8rem,5.4vw,5.6rem)] leading-[0.94]">
            Three bottles. <em>That’s the routine.</em>
          </h2>
        </div>
        <a href="#" className="border-b border-foreground pb-1 text-[0.95rem]">
          Shop all serums
        </a>
      </div>

      <div className="mt-14 grid gap-x-5 gap-y-12 md:grid-cols-2 lg:grid-cols-4">
        {PRODUCTS.map((p) => (
          <article key={p.slug} className="group flex flex-col">
            <div className="relative aspect-[4/5] overflow-hidden" style={{ backgroundColor: p.card }}>
              <Image
                src={`${IMAGE_BASE}/still-${p.slug}.webp`}
                alt={`${p.name} ${p.percent} serum in a glass dropper bottle on a stone plinth`}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
                className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.035]"
              />
            </div>
            <div className="mt-5 flex items-baseline justify-between gap-4">
              <h3 className="text-[1.05rem] font-medium">
                {p.name} <span className="font-mono text-[0.85rem] text-muted-foreground">{p.percent}</span>
              </h3>
              <p className="tabular-nums">{p.price}</p>
            </div>
            <p className="mt-1.5 max-w-[34ch] text-[0.93rem] leading-snug text-muted-foreground">{p.benefit}</p>
            <a href="#" className="mt-5 inline-flex w-fit rounded-full border border-foreground px-5 py-2.5 text-[0.9rem] transition-colors duration-300 hover:bg-foreground hover:text-background">
              Add to bag
            </a>
          </article>
        ))}

        <article className="flex min-h-[26rem] flex-col justify-between bg-foreground p-7 text-background">
          <p className="eyebrow text-background/60">{SET.saving}</p>
          <div>
            <h3 className="font-heading text-[clamp(2.4rem,3.4vw,3.4rem)] leading-[0.95]">{SET.name}</h3>
            <p className="mt-3 text-[0.95rem] text-background/70">{SET.items}, in the order you use them.</p>
            <div className="mt-8 flex items-center justify-between gap-4">
              <p className="text-[1.1rem] tabular-nums">{SET.price}</p>
              <a href="#" className="rounded-full bg-background px-5 py-2.5 text-[0.9rem] text-foreground">
                Add the set
              </a>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

import { BRAND, ORIGIN } from "../_lib/content";

const COLUMNS = [
  { title: "Shop", links: ["Vitamin C 15%", "Hyaluronic 2%", "Niacinamide 10%", "The morning set"] },
  { title: "Learn", links: ["The actives", "Routine finder", "Clinical results", "Journal"] },
  { title: "Help", links: ["Delivery", "Returns", "Contact", "Stockists"] },
];

export function Footer() {
  return (
    <footer className="border-t border-border px-6 pt-16 pb-10 sm:px-10">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="font-heading text-[clamp(2.1rem,3.4vw,3.3rem)] leading-[1.02]">
            Notes on actives, <em>once a month.</em>
          </p>
          <form className="mt-7 flex max-w-md border-b border-foreground">
            <label htmlFor="cuvette-email" className="sr-only">
              Email address
            </label>
            <input id="cuvette-email" type="email" placeholder="Email address" className="min-w-0 flex-1 bg-transparent py-3 outline-none placeholder:text-muted-foreground" />
            <button type="button" className="py-3 text-[0.92rem]">
              Subscribe
            </button>
          </form>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 text-[0.93rem] sm:grid-cols-3 lg:col-span-6 lg:col-start-7">
          {COLUMNS.map((column) => (
            <div key={column.title}>
              <p className="eyebrow text-muted-foreground">{column.title}</p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link}>
                    <a href="#">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="mt-20 flex flex-wrap items-end justify-between gap-6">
        <p className="font-heading text-[clamp(5rem,17vw,17rem)] leading-[0.78]">{BRAND}</p>
        <p className="font-mono text-[0.7rem] tracking-[0.08em] text-muted-foreground uppercase">{ORIGIN} · © 2026</p>
      </div>
    </footer>
  );
}

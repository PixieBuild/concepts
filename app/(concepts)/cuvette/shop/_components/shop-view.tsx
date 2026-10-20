"use client";

import { useRef } from "react";
import { useSearchParams } from "next/navigation";
import { XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { SetCard } from "../../_lib/client-catalog";
import { isSet, rangeSummary } from "../../_lib/product";
import { useCatalog } from "../../_components/catalog-provider";
import { DEFAULT_QUERY, SORTS, applyQuery, isFiltered, parseQuery, plural, type ShopData, type ShopQuery } from "../_lib/query";
import { FilterLink, FilterPanel } from "./filter-panel";
import { ProductTile } from "./product-tile";
import { SetTile } from "./set-tile";

type Props = { data: ShopData };

const VAT = "Prices include VAT · Unit price per litre";

/** Reads the filters from the URL. Wrapped in Suspense by the page: the prerendered fallback is the whole shop, unfiltered. */
export function ShopFromUrl({ data }: Props) {
  const params = useSearchParams();
  return <ShopView data={data} query={parseQuery(params, data)} />;
}

function MobileFilters({ data, query, shown }: { data: ShopData; query: ShopQuery; shown: number }) {
  const active = Number(!!query.concern) + Number(!!query.type);
  const sort = SORTS.find((s) => s.id === query.sort)!;
  return (
    <Sheet>
      <SheetTrigger className="inline-flex min-h-11 items-center gap-3 rounded-(--radius) border border-input px-4 text-[0.95rem] hover:border-foreground">
        Filter and sort
        <span className="label text-muted-foreground">{active ? `${active} on` : sort.id === "featured" ? "" : sort.label}</span>
      </SheetTrigger>
      <SheetContent side="bottom" showCloseButton={false} className="max-h-[88dvh] gap-0 p-0">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
          <SheetTitle className="font-normal">
            <span className="label">Filter and sort</span>
          </SheetTitle>
          <SheetClose className="label -mr-2 inline-flex min-h-11 items-center px-2">Close</SheetClose>
        </div>
        <div data-lenis-prevent className="flex-1 overflow-y-auto px-4 pt-6 pb-8">
          <FilterPanel data={data} query={query} />
        </div>
        <div className="shrink-0 border-t border-border p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <SheetClose className="inline-flex h-12 w-full items-center justify-center rounded-(--radius) bg-primary text-[0.95rem] text-primary-foreground">
            {shown ? `Show ${shown} ${shown === 1 ? "product" : "products"}` : "Nothing matches: change a filter"}
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ActiveFilters({ data, query, onNavigate }: { data: ShopData; query: ShopQuery; onNavigate: () => void }) {
  if (!isFiltered(query)) return null;
  const concern = data.concerns.find((f) => f.id === query.concern);
  const type = data.types.find((f) => f.id === query.type);
  const chip = "inline-flex min-h-11 items-center gap-2 rounded-(--radius) border border-border px-3 text-[0.9rem] hover:border-foreground";
  return (
    <ul aria-label="Filters on" className="flex flex-wrap items-center gap-2">
      {concern && (
        <li>
          <FilterLink query={{ ...query, concern: null }} onNavigate={onNavigate} className={chip}>
            {concern.label}
            <XIcon aria-label="remove" className="size-3.5" />
          </FilterLink>
        </li>
      )}
      {type && (
        <li>
          <FilterLink query={{ ...query, type: null }} onNavigate={onNavigate} className={chip}>
            {plural(type.label)}
            <XIcon aria-label="remove" className="size-3.5" />
          </FilterLink>
        </li>
      )}
      <li>
        <FilterLink query={{ ...DEFAULT_QUERY, sort: query.sort }} onNavigate={onNavigate} className="link label inline-flex min-h-11 items-center px-2 text-muted-foreground hover:text-foreground">
          Clear all
        </FilterLink>
      </li>
    </ul>
  );
}

function Empty({ data, query, onNavigate }: { data: ShopData; query: ShopQuery; onNavigate: () => void }) {
  const concern = data.concerns.find((f) => f.id === query.concern)?.label.toLowerCase();
  const type = data.types.find((f) => f.id === query.type)?.label;
  return (
    <div className="flex flex-col items-start gap-5 border-b border-border py-20 sm:py-28">
      <p className="title">Nothing on the shelf for that yet.</p>
      <p className="max-w-md text-muted-foreground">
        We don’t make {type ? plural(type).toLowerCase() : "anything"}
        {concern ? ` for ${concern} skin` : ""} at the moment. Drop a filter to see what comes closest.
      </p>
      <FilterLink query={{ ...DEFAULT_QUERY, sort: query.sort }} onNavigate={onNavigate} className="link inline-flex min-h-11 items-center">
        Show the whole shop
      </FilterLink>
    </div>
  );
}

export function ShopView({ data, query }: Props & { query: ShopQuery }) {
  const catalog = useCatalog();
  const results = useRef<HTMLDivElement>(null);
  const shown = applyQuery(data, query).flatMap((slug) => catalog.get(slug) ?? []);
  const singles = shown.filter((p) => !isSet(p));
  const sets = shown.filter((p): p is SetCard => isSet(p));
  const total = data.orders.featured.length;

  // A filter picked from the sticky rail far down the grid brings the shorter list back into view.
  const toResults = () => {
    const el = results.current;
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: "start" });
  };

  return (
    <div className="lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-12 2xl:grid-cols-[15rem_minmax(0,1fr)] 2xl:gap-16">
      <aside aria-label="Filter and sort" className="hidden lg:block">
        <div className="sticky top-20 pb-10">
          <FilterPanel data={data} query={query} onNavigate={toResults} />
        </div>
      </aside>

      <div ref={results} className="min-w-0 scroll-mt-20">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-border pb-3">
          <p aria-live="polite" className="label mr-auto text-muted-foreground">
            {shown.length ? rangeSummary([...singles, ...sets]) : "No products"}
            {isFiltered(query) && ` · of ${total}`}
          </p>
          <p className="label text-muted-foreground max-sm:hidden">{VAT}</p>
          <div className="lg:hidden">
            <MobileFilters data={data} query={query} shown={shown.length} />
          </div>
          <div className="w-full empty:hidden lg:order-first lg:w-auto">
            <ActiveFilters data={data} query={query} onNavigate={toResults} />
          </div>
        </div>

        {singles.length > 0 && (
          <ul className="grid grid-cols-2 gap-x-3 gap-y-10 pt-6 sm:gap-x-5 sm:gap-y-14 min-[768px]:grid-cols-3 min-[1280px]:grid-cols-4 min-[2200px]:grid-cols-5">
            {singles.map((p, i) => (
              <ProductTile key={p.slug} product={p} frame={i + 1} priority={i < 2} />
            ))}
          </ul>
        )}

        {sets.length > 0 && <Sets sets={sets} first={singles.length === 0} />}
        {shown.length === 0 && <Empty data={data} query={query} onNavigate={toResults} />}
        <p className="label mt-14 text-muted-foreground sm:hidden">{VAT}</p>
      </div>
    </div>
  );
}

function Sets({ sets, first }: { sets: SetCard[]; first: boolean }) {
  return (
    <section aria-labelledby="sets-title" className={cn(first ? "pt-6" : "mt-20 sm:mt-28", sets.length === 1 && "max-w-[64rem]")}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 id="sets-title" className="title">
          Sets
        </h2>
        <p className="label text-muted-foreground">Bought together, numbered in the order you use them</p>
      </div>
      <ul className={cn("mt-6 grid gap-5", sets.length > 1 && "2xl:grid-cols-2")}>
        {sets.map((set) => (
          <SetTile key={set.slug} set={set} />
        ))}
      </ul>
    </section>
  );
}


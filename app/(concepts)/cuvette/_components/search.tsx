"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type RefObject } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { priceShort } from "../_lib/format";
import { priceOf, productHref, type ProductCard } from "../_lib/product";
import { Bottle } from "./bottle/bottle";
import { useCatalog } from "./catalog-provider";

const SEARCH_EVENT = "cuvette:search";

export function openSearch() {
  window.dispatchEvent(new Event(SEARCH_EVENT));
}

type Field = { kind: "name" | "concern" | "job" | "ingredient" | "keyword"; text: string };
type Hit = { product: ProductCard; score: number; why: string | null };

function fieldsOf(p: ProductCard): Field[] {
  return [
    ...[p.title, p.name, p.strength, p.lead, p.descriptor].map((text) => ({ kind: "name" as const, text })),
    ...p.concerns.map((text) => ({ kind: "concern" as const, text })),
    ...p.jobs.map((text) => ({ kind: "job" as const, text })),
    ...[...p.actives.map((a) => a.name), ...p.inci].map((text) => ({ kind: "ingredient" as const, text })),
    ...[...p.keywords, ...p.tags].map((text) => ({ kind: "keyword" as const, text })),
  ];
}

const WEIGHT: Record<Field["kind"], number> = { name: 4, concern: 3, job: 3, keyword: 2, ingredient: 1 };

// Keywords are lowercase search aliases, so a keyword hit shows the product's descriptor instead.
function describe(field: Field): string | null {
  switch (field.kind) {
    case "ingredient":
      return `Contains ${field.text}`;
    case "concern":
      return `For ${field.text.toLowerCase()} skin`;
    case "job":
      return `To ${field.text.toLowerCase()}`;
    default:
      return null;
  }
}

const BROWSE_MAX = 6;

/** Every product the store has, hidden ones too: a shopper who knows the name can still find it. */
function search(query: string, products: ProductCard[]): Hit[] {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  const hits: Hit[] = [];
  for (const product of products) {
    const fields = fieldsOf(product);
    let score = 0;
    let why: string | null = null;
    let every = true;
    for (const token of tokens) {
      const found = fields.filter((f) => f.text.toLowerCase().includes(token)).sort((a, b) => WEIGHT[b.kind] - WEIGHT[a.kind]);
      if (!found.length) {
        every = false;
        break;
      }
      score += WEIGHT[found[0].kind];
      why ??= describe(found[0]);
    }
    if (every) hits.push({ product, score, why });
  }
  return hits.sort((a, b) => b.score - a.score);
}

/** A concern from one product, a lead active from the next, so the chips span the range and both kinds of query. */
function suggestionsFrom(products: ProductCard[], max = 4): string[] {
  const terms = products.map((p, i) => (i % 2 ? p.actives[0]?.name.split(",")[0] : p.concerns[0]));
  return [...new Set(terms.filter((t): t is string => !!t).map((t) => t.toLowerCase()))].slice(0, max);
}

function useSlashShortcut(onOpen: () => void) {
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable=''], [contenteditable='true']")) return;
      event.preventDefault();
      onOpen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpen]);
}

export function SearchButton({ className }: { className?: string }) {
  return (
    <button type="button" aria-haspopup="dialog" aria-keyshortcuts="/" onClick={openSearch} className={cn("inline-flex min-h-11 items-center", className)}>
      Search
    </button>
  );
}

/** One instance per page, mounted by the header; open it with `openSearch()` or the / key. */
export function Search() {
  const [open, setOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const show = useCallback(() => setOpen(true), []);
  useSlashShortcut(show);

  useEffect(() => {
    window.addEventListener(SEARCH_EVENT, show);
    return () => window.removeEventListener(SEARCH_EVENT, show);
  }, [show]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        initialFocus={input}
        className="top-0 left-0 max-h-svh w-full max-w-none translate-x-0 translate-y-0 gap-0 overflow-y-auto rounded-none p-0 ring-0 sm:max-w-none data-open:zoom-in-100 data-open:slide-in-from-top-4 data-closed:zoom-out-100"
      >
        {open && <SearchPanel input={input} onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function SearchPanel({ input, onDone }: { input: RefObject<HTMLInputElement | null>; onDone: () => void }) {
  const router = useRouter();
  const id = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const { products, listed } = useCatalog();
  const browsing = !query.trim();
  const hits = useMemo(
    () => (browsing ? listed.slice(0, BROWSE_MAX).map((product) => ({ product, score: 0, why: null })) : search(query, products)),
    [browsing, query, products, listed],
  );
  const suggestions = useMemo(() => suggestionsFrom(listed), [listed]);
  const current = Math.min(active, Math.max(0, hits.length - 1));

  const go = (p: ProductCard) => {
    onDone();
    router.push(productHref(p.slug));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!hits.length) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((current + step + hits.length) % hits.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(hits[current].product);
    }
  };

  const suggest = (term: string) => {
    setQuery(term);
    setActive(0);
    input.current?.focus();
  };

  return (
    <div data-lenis-prevent className="mx-auto w-full max-w-3xl px-4 pt-4 pb-8 sm:px-10 sm:pt-6 sm:pb-12">
      <div className="flex items-center justify-between gap-4">
        <DialogTitle className="font-normal text-muted-foreground">
          <span className="label">Search the range</span>
        </DialogTitle>
        <DialogClose className="label -mr-2 inline-flex min-h-11 items-center px-2">Close</DialogClose>
      </div>
      <DialogDescription className="sr-only">Search by product name, ingredient or skin concern. Use the arrow keys to move through results and Enter to open one.</DialogDescription>

      <input
        ref={input}
        type="search"
        role="combobox"
        aria-expanded={hits.length > 0}
        aria-controls={`${id}-list`}
        aria-activedescendant={hits.length ? `${id}-${hits[current].product.slug}` : undefined}
        aria-autocomplete="list"
        aria-label="Search by name, ingredient or concern"
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="go"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
        }}
        onKeyDown={onKeyDown}
        placeholder="Ingredient, concern or name"
        className="title mt-3 h-16 w-full appearance-none rounded-none border-b [&::-webkit-search-cancel-button]:appearance-none border-foreground bg-transparent font-light outline-none placeholder:text-muted-foreground/70 focus-visible:outline-none sm:h-20"
      />

      {hits.length ? (
        <>
          <div id={`${id}-list`} role="listbox" aria-label={browsing ? "First products in the range" : "Products"} className="mt-2">
            {hits.map(({ product, why }, i) => (
              <Link
                key={product.slug}
                id={`${id}-${product.slug}`}
                href={productHref(product.slug)}
                role="option"
                aria-selected={i === current}
                tabIndex={-1}
                onClick={onDone}
                onMouseMove={() => setActive(i)}
                className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-4 border-b border-border py-3 aria-selected:bg-secondary sm:-mx-3 sm:px-3"
              >
                <span className="relative block aspect-square w-14 overflow-hidden bg-[#0e0f10]">
                  <Bottle product={product} shot="thumb" sizes="56px" alt="" />
                </span>
                <span className="min-w-0">
                  <span className="product-name block truncate text-[1.05rem]">{product.title}</span>
                  <span className="block truncate text-[0.9rem] text-muted-foreground">{why ?? product.descriptor}</span>
                </span>
                <span className="text-right">{priceShort(priceOf(product))}</span>
              </Link>
            ))}
          </div>
          {browsing && (
            <Link href="/cuvette/shop" onClick={onDone} className="link mt-4 inline-flex min-h-11 items-center">
              All {listed.length} products
            </Link>
          )}
        </>
      ) : (
        <div className="mt-6" aria-live="polite">
          <p className="text-[1.02rem]">
            Nothing for &lsquo;{query.trim()}&rsquo;. <span className="text-muted-foreground">Try an ingredient or a concern.</span>
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {suggestions.map((term) => (
              <li key={term}>
                <button type="button" onClick={() => suggest(term)} className="inline-flex h-11 items-center border border-border px-4 transition-colors hover:border-foreground">
                  {term}
                </button>
              </li>
            ))}
          </ul>
          <Link href="/cuvette/shop" onClick={onDone} className="link mt-6 inline-flex min-h-11 items-center">
            Browse all products
          </Link>
        </div>
      )}
    </div>
  );
}

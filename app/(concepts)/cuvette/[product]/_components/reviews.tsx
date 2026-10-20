"use client";

import { useEffect, useMemo, useState } from "react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import type { Review } from "../../_lib/product";
import { formatCount, formatDate } from "../../_lib/format";
import { byHelpful, filterOptions, matches, visibleReviews, type ReviewFilter } from "../_lib/reviews";
import { DetailSheet, SheetButton } from "./detail-sheet";

const HELPFUL_KEY = "cuvette:helpful:v1";
const ALL_REVIEWS = "all-reviews";

function readHelpful(): string[] {
  try {
    const stored = JSON.parse(window.localStorage.getItem(HELPFUL_KEY) ?? "[]");
    return Array.isArray(stored) ? stored.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-[0.8125rem] tracking-[0.12em]" role="img" aria-label={`Rated ${rating} out of 5`}>
      <span>{"★".repeat(rating)}</span>
      <span className="opacity-25">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

type EntryProps = { review: Review; helpful: boolean; onHelpful: () => void; compact?: boolean };

function Entry({ review: r, helpful, onHelpful, compact }: EntryProps) {
  return (
    <article className={cn("grid gap-x-10 gap-y-4 border-t border-border py-8", !compact && "md:grid-cols-[13rem_1fr]")}>
      <div>
        <p className="product-name">{r.name}</p>
        <p className="label mt-2 space-y-0.5 text-muted-foreground">
          <span className="block">
            {r.city} · {r.skin}
          </span>
          <span className="block">
            {r.age} · {r.verified ? "Verified buyer" : "Unverified"}
          </span>
          <span className="block">{r.usedFor}</span>
        </p>
      </div>
      <div className="max-w-[60ch]">
        <p className="flex items-center justify-between gap-4">
          <Stars rating={r.rating} />
          <time dateTime={r.date} className="label text-muted-foreground">
            {formatDate(r.date)}
          </time>
        </p>
        <h3 className="mt-3 text-[1.125rem] leading-snug font-medium [font-stretch:112%]">{r.title}</h3>
        <p className="mt-2 text-muted-foreground">{r.body}</p>
        {r.reply && (
          <div className="mt-5 border-s border-border ps-5">
            <p className="label text-muted-foreground">
              Reply from Cuvette · {r.reply.by}, {r.reply.role}
            </p>
            <p className="mt-2">{r.reply.body}</p>
          </div>
        )}
        <button
          type="button"
          aria-pressed={helpful}
          onClick={onHelpful}
          className="mt-3 inline-flex min-h-11 items-center text-[0.8125rem] text-muted-foreground transition-colors hover:text-foreground aria-pressed:text-foreground"
        >
          {helpful ? "Marked helpful" : "Helpful"} ({r.helpful + (helpful ? 1 : 0)})
        </button>
      </div>
    </article>
  );
}

type Props = {
  title: string;
  reviews: Review[];
  histogram: [number, number, number, number, number];
  average: string;
  count: number;
};

export function Reviews({ title, reviews, histogram, average, count }: Props) {
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const [helpful, setHelpful] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => setHelpful(readHelpful());
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  function toggleHelpful(id: string) {
    const next = helpful.includes(id) ? helpful.filter((h) => h !== id) : [...helpful, id];
    setHelpful(next);
    try {
      window.localStorage.setItem(HELPFUL_KEY, JSON.stringify(next));
    } catch {}
  }

  const options = useMemo(() => filterOptions(reviews), [reviews]);
  const shown = visibleReviews(reviews, filter);
  const matching = byHelpful(reviews.filter((r) => matches(r, filter)));
  const top = histogram[0] + histogram[1];
  const label = options.find((o) => o.value === filter)?.label;

  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="scroll-mt-28 px-(--gutter)">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <h2 id="reviews-heading" className="label text-muted-foreground">
            Reviews
          </h2>
          <p className="figure-xl mt-6" aria-label={`Average ${average} out of 5`}>
            {average}
          </p>
          <p className="mt-4 text-muted-foreground">
            {formatCount(count)} reviews · {Math.round((top / count) * 100)}% rate it 4 or 5
          </p>
          <dl className="mt-8 max-w-sm space-y-2.5">
            {histogram.map((n, i) => (
              <div key={i} className="grid grid-cols-[1rem_1fr_3rem] items-center gap-3">
                <dt className="label text-muted-foreground">{5 - i}</dt>
                <dd className="h-px bg-border">
                  <span className="block h-0.5 -translate-y-[0.5px] bg-foreground" style={{ width: `${(n / count) * 100}%` }} />
                </dd>
                <dd className="label text-right text-muted-foreground">{formatCount(n)}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="lg:col-span-8">
          <ToggleGroup
            value={[filter]}
            onValueChange={(v) => setFilter((v[0] as ReviewFilter | undefined) ?? "all")}
            aria-label="Filter reviews"
            className="-mx-4 w-[calc(100%+2rem)] flex-nowrap gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:w-full sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
          >
            {options.map((o) => (
              <ToggleGroupItem
                key={o.value}
                value={o.value}
                variant="outline"
                className="h-11 rounded-(--radius) border-border px-4 text-[0.9rem] font-normal text-foreground/85 hover:border-foreground hover:bg-transparent data-pressed:border-foreground data-pressed:bg-foreground data-pressed:text-background"
              >
                {o.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <p className="sr-only" aria-live="polite">
            {filter === "all" ? "Showing the most helpful reviews" : `Showing reviews for ${label}`}
          </p>

          <div className="mt-8">
            {shown.map((r) => (
              <Entry key={r.id} review={r} helpful={helpful.includes(r.id)} onHelpful={() => toggleHelpful(r.id)} />
            ))}
          </div>

          <div className="border-t border-border pt-4">
            <SheetButton id={ALL_REVIEWS} className="link">
              Most helpful reviews ({matching.length})
            </SheetButton>
          </div>
        </div>
      </div>

      <DetailSheet
        id={ALL_REVIEWS}
        eyebrow={`${title} · reviews`}
        title="Most helpful reviews"
        description={filter === "all" ? `Written reviews, most helpful first. From ${formatCount(count)} ratings.` : filter.startsWith("skin:") ? `Written reviews from people with ${label?.toLowerCase()} skin.` : `Written reviews about ${label?.toLowerCase()}.`}
      >
        {matching.map((r) => (
          <Entry key={r.id} review={r} compact helpful={helpful.includes(r.id)} onHelpful={() => toggleHelpful(r.id)} />
        ))}
      </DetailSheet>
    </section>
  );
}

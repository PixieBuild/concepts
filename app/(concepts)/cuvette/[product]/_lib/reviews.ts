import type { Review } from "../../_lib/product";

export const FEATURED = 3;

/** "all", "skin:Dry" or "concern:Redness". */
export type ReviewFilter = string;

export function byHelpful(reviews: Review[]): Review[] {
  return [...reviews].sort((a, b) => b.helpful - a.helpful || b.date.localeCompare(a.date));
}

export function matches(review: Review, filter: ReviewFilter): boolean {
  if (filter === "all") return true;
  const [kind, value] = filter.split(":");
  return kind === "skin" ? review.skin === value : review.concern === value;
}

/** The reviews shown on the page for a filter. Unfiltered, a formulator's reply is always among them. */
export function visibleReviews(reviews: Review[], filter: ReviewFilter = "all"): Review[] {
  const sorted = byHelpful(reviews.filter((r) => matches(r, filter)));
  const top = sorted.slice(0, FEATURED);
  if (filter !== "all" || top.some((r) => r.reply)) return top;
  const replied = sorted.find((r) => r.reply);
  return replied ? [...top.slice(0, FEATURED - 1), replied] : top;
}

export function filterOptions(reviews: Review[]): { value: ReviewFilter; label: string }[] {
  const skins = [...new Set(reviews.map((r) => r.skin))].sort();
  const concerns = [...new Set(reviews.map((r) => r.concern))].sort();
  return [
    { value: "all", label: "All reviews" },
    ...skins.map((s) => ({ value: `skin:${s}`, label: s })),
    ...concerns.map((c) => ({ value: `concern:${c}`, label: c })),
  ];
}

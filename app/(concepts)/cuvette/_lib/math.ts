/** Where `v` sits between `from` and `to`, clamped to 0–1. Use inside `useTransform(mv, (v) => …)`. */
export function between(v: number, from: number, to: number): number {
  return Math.min(1, Math.max(0, (v - from) / (to - from)));
}

import { formatDispatch, type Day } from "../../_lib/delivery";

/** "today", "tomorrow" or "on Mon 19 Oct", to follow "Ships from Porto". */
export function dispatchWords(day: Day, now: Date): string {
  const words = formatDispatch(day, now);
  return words === "today" || words === "tomorrow" ? words : `on ${words}`;
}

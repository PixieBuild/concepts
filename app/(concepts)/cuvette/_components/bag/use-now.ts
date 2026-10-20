import { useSyncExternalStore } from "react";

let now: Date | null = null;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

function tick() {
  now = new Date();
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) {
    now = new Date();
    timer = setInterval(tick, 30_000);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) clearInterval(timer);
  };
}

const getSnapshot = () => (now ??= new Date());
const getServerSnapshot = () => null;

/** The current time, refreshed every 30 s; null on the server so dates only render after hydration. */
export function useNow(): Date | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

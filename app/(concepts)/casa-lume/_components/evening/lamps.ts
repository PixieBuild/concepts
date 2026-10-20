import { useSyncExternalStore } from "react";

type LampState = {
  on: ReadonlySet<string>;
  off: ReadonlySet<string>;
  relit: ReadonlySet<string>;
};

// Lamps live outside React state so a light changing re-renders only its window and the tally, never the hero.
export function createLamps() {
  let state: LampState = { on: new Set(), off: new Set(), relit: new Set() };
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    update(next: (s: LampState) => LampState) {
      state = next(state);
      listeners.forEach((listener) => listener());
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export type Lamps = ReturnType<typeof createLamps>;

export const withId = (set: ReadonlySet<string>, id: string) => new Set(set).add(id);
export const withoutId = (set: ReadonlySet<string>, id: string) => new Set([...set].filter((x) => x !== id));

export function useLamp(lamps: Lamps, id: string) {
  const off = useSyncExternalStore(lamps.subscribe, () => lamps.get().off.has(id), () => false);
  const relit = useSyncExternalStore(lamps.subscribe, () => lamps.get().relit.has(id), () => false);
  return { off, relit };
}

export function useLitCount(lamps: Lamps) {
  return useSyncExternalStore(
    lamps.subscribe,
    () => {
      const { on, off } = lamps.get();
      let count = 0;
      for (const id of on) if (!off.has(id)) count++;
      return count;
    },
    () => 0,
  );
}

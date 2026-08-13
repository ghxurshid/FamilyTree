import { useSyncExternalStore } from 'react';

export type Listener = () => void;

export interface Store<T> {
  getState(): T;
  setState(patch: Partial<T> | ((state: T) => Partial<T>)): void;
  subscribe(listener: Listener): () => void;
}

/**
 * Minimal, tipli store. React 18'ning `useSyncExternalStore`'i ustida —
 * tashqi kutubxonasiz, selektorlar bilan aniq qayta renderlar.
 */
export function createStore<T extends object>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<Listener>();

  return {
    getState: () => state,
    setState(patch) {
      const next = typeof patch === 'function' ? patch(state) : patch;
      let changed = false;
      for (const key of Object.keys(next) as (keyof T)[]) {
        if (!Object.is(state[key], next[key])) {
          changed = true;
          break;
        }
      }
      if (!changed) return;
      state = { ...state, ...next };
      for (const listener of [...listeners]) listener();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/** Store'dan tanlab o'qish — tanlangan qiymat o'zgarmasa render bo'lmaydi. */
export function useStore<T extends object, S>(
  store: Store<T>,
  selector: (state: T) => S,
): S {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState()),
  );
}

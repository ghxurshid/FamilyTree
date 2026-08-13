import { searchService } from '@/services';
import type { Person } from '@/types/person';
import { createStore, useStore } from './createStore';

interface SearchState {
  open: boolean;
  query: string;
  results: Person[];
  highlight: number;
  loading: boolean;
}

const store = createStore<SearchState>({
  open: false,
  query: '',
  results: [],
  highlight: 0,
  loading: false,
});

let requestId = 0;
let debounce: number | undefined;

/** Qidiruv servis qatlami orqali ketadi — backend keyin shu joyga ulanadi. */
async function run(query: string) {
  const current = ++requestId;
  if (!query.trim()) {
    store.setState({ results: [], loading: false, highlight: 0 });
    return;
  }
  store.setState({ loading: true });
  try {
    const results = await searchService.searchPeople(query, 8);
    if (current === requestId) store.setState({ results, loading: false, highlight: 0 });
  } catch {
    if (current === requestId) store.setState({ results: [], loading: false });
  }
}

export const searchStore = {
  ...store,

  open() {
    store.setState({ open: true, query: '', results: [], highlight: 0 });
  },

  close() {
    window.clearTimeout(debounce);
    store.setState({ open: false, loading: false });
  },

  setQuery(query: string) {
    store.setState({ query, highlight: 0 });
    window.clearTimeout(debounce);
    debounce = window.setTimeout(() => void run(query), 120);
  },

  moveHighlight(delta: number) {
    const { highlight, results } = store.getState();
    if (!results.length) return;
    const next = Math.min(Math.max(highlight + delta, 0), results.length - 1);
    store.setState({ highlight: next });
  },

  highlighted(): Person | null {
    const { results, highlight } = store.getState();
    return results[highlight] ?? null;
  },
};

export function useSearch<S>(selector: (state: SearchState) => S): S {
  return useStore(store, selector);
}

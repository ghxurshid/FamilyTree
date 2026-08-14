import { STORAGE_KEYS, storage } from '@/services/storage';
import { applyTelegramChrome } from '@/services/telegram';
import type { Preferences, ResolvedTheme, ThemePreference } from '@/types/ui';
import { createStore, useStore } from './createStore';

const DEFAULTS: Preferences = {
  theme: 'system',
  alphabet: 'latin',
  fontScale: 1,
  genLabels: true,
  relLabels: true,
  photos: true,
  minimap: true,
  reduceMotion: false,
  contrast: false,
};

interface PreferencesState extends Preferences {
  resolvedTheme: ResolvedTheme;
  /** Kamaytirilgan harakat — sozlama yoki tizim darajasida. */
  motionReduced: boolean;
}

const systemPrefersLight = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-color-scheme: light)').matches;

const systemReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function resolveTheme(theme: ThemePreference): ResolvedTheme {
  if (theme === 'system') return systemPrefersLight() ? 'light' : 'dark';
  return theme;
}

const stored = { ...DEFAULTS, ...storage.read<Partial<Preferences>>(STORAGE_KEYS.preferences, {}) };

const store = createStore<PreferencesState>({
  ...stored,
  resolvedTheme: resolveTheme(stored.theme),
  motionReduced: stored.reduceMotion || systemReducedMotion(),
});

function persist(state: PreferencesState) {
  const { resolvedTheme: _resolved, motionReduced: _motion, ...prefs } = state;
  storage.write(STORAGE_KEYS.preferences, prefs);
}

/** Mavzu, kontrast va matn kattaligini hujjat ildiziga qo'llaydi. */
function applyToDocument(state: PreferencesState) {
  const root = document.documentElement;
  root.dataset.theme = state.resolvedTheme;
  root.dataset.contrast = state.contrast ? '1' : '0';
  root.dataset.reduceMotion = state.motionReduced ? '1' : '0';
  root.style.setProperty('--fscale', String(state.fontScale));
  // Telegram ichida mijoz paneli ham ilova mavzusiga bo'yaladi.
  applyTelegramChrome();
}

function commit(patch: Partial<Preferences>) {
  const previous = store.getState();
  const merged: PreferencesState = { ...previous, ...patch };
  merged.resolvedTheme = resolveTheme(merged.theme);
  merged.motionReduced = merged.reduceMotion || systemReducedMotion();
  store.setState(merged);
  persist(merged);
  applyToDocument(merged);
}

export const preferencesStore = {
  ...store,
  set: commit,
  toggle: (key: keyof Preferences) => {
    const current = store.getState()[key];
    if (typeof current === 'boolean') commit({ [key]: !current } as Partial<Preferences>);
  },
  cycleTheme: () => {
    const order: ThemePreference[] = ['system', 'dark', 'light'];
    const next = order[(order.indexOf(store.getState().theme) + 1) % order.length];
    commit({ theme: next });
  },
  /** Tizim mavzusi/harakat sozlamasi o'zgarganda qayta hisoblash. */
  syncWithSystem: () => commit({}),
  applyToDocument: () => applyToDocument(store.getState()),
};

export function usePreferences<S>(selector: (state: PreferencesState) => S): S {
  return useStore(store, selector);
}

export type { PreferencesState };

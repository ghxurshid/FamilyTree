/**
 * Yagona saqlash qatlami. Hech bir komponent localStorage'ga to'g'ridan
 * murojaat qilmaydi — kalitlar va JSON xatolari shu yerda boshqariladi.
 */
const PREFIX = 'shajara.';

function safeStorage(): Storage | null {
  try {
    const probe = '__shajara_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

const backing = typeof window === 'undefined' ? null : safeStorage();
const memory = new Map<string, string>();

export const storage = {
  read<T>(key: string, fallback: T): T {
    try {
      const raw = backing ? backing.getItem(PREFIX + key) : memory.get(PREFIX + key);
      if (raw == null) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },

  write(key: string, value: unknown): void {
    try {
      const raw = JSON.stringify(value);
      if (backing) backing.setItem(PREFIX + key, raw);
      else memory.set(PREFIX + key, raw);
    } catch {
      /* kvota to'lgan yoki xususiy rejim — sozlama shu seansda qoladi */
    }
  },

  remove(key: string): void {
    try {
      if (backing) backing.removeItem(PREFIX + key);
      else memory.delete(PREFIX + key);
    } catch {
      /* e'tiborsiz */
    }
  },
};

export const STORAGE_KEYS = {
  preferences: 'preferences',
  session: 'session',
} as const;

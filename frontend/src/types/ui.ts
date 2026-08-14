export type ThemePreference = 'system' | 'dark' | 'light';
export type ResolvedTheme = 'dark' | 'light';
export type Alphabet = 'latin' | 'cyrillic';

/** Kamera masshtabiga qarab kartadagi ma'lumot zichligi. */
export type TreeDensity = 'min' | 'mid' | 'full';

/** Daraxt ko'rinish rejimlari — dizayndagi pastki chap filtr. */
export type TreeViewMode = 'all' | 'ancestors' | 'descendants' | 'branch';

/** Mobil pastki varaqning to'xtash nuqtalari: qisqa ko'rinish va to'liq ochiq. */
export type PanelSnap = 'peek' | 'full';

export type ToastKind = 'ok' | 'warn' | 'error';

export interface Toast {
  id: string;
  text: string;
  kind: ToastKind;
}

export interface Preferences {
  theme: ThemePreference;
  alphabet: Alphabet;
  fontScale: number;
  genLabels: boolean;
  relLabels: boolean;
  photos: boolean;
  minimap: boolean;
  reduceMotion: boolean;
  contrast: boolean;
}

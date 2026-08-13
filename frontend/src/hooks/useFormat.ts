import { useMemo } from 'react';
import { usePreferences } from '@/stores/preferencesStore';
import {
  generationLabel,
  initials,
  lifespan,
  personName,
  tr,
} from '@/features/family-tree/lib/format';
import type { Person } from '@/types/person';
import type { Alphabet } from '@/types/ui';

export interface Formatter {
  alphabet: Alphabet;
  t(text: string): string;
  name(person: Person | null): string;
  initials(person: Person | null): string;
  years(person: Person): string;
  generation(generation: number): string;
}

/** Alifboga bog'liq matn yordamchilari — bitta joyda. */
export function useFormat(): Formatter {
  const alphabet = usePreferences((state) => state.alphabet);
  return useMemo<Formatter>(
    () => ({
      alphabet,
      t: (text: string) => tr(text, alphabet),
      name: (person) => personName(person, alphabet),
      initials: (person) => initials(person, alphabet),
      years: (person) => lifespan(person, alphabet),
      generation: (generation) => generationLabel(generation, alphabet),
    }),
    [alphabet],
  );
}

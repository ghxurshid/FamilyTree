import type { Person } from '@/types/person';
import type { Alphabet } from '@/types/ui';
import { toCyrillic } from '@/utils/transliterate';

/** Tanlangan alifboda matn. */
export function tr(text: string, alphabet: Alphabet): string {
  return alphabet === 'cyrillic' ? toCyrillic(text) : text;
}

export function personName(person: Person | null, alphabet: Alphabet): string {
  if (!person) return '';
  if (alphabet === 'cyrillic') return person.nameCyr || toCyrillic(person.name);
  return person.name;
}

export function initials(person: Person | null, alphabet: Alphabet): string {
  return (personName(person, alphabet) || '?').trim().charAt(0).toUpperCase();
}

export function lifespan(person: Person, alphabet: Alphabet): string {
  if (!person.birthYear) return '';
  if (person.deathYear) return `${person.birthYear} – ${person.deathYear}`;
  return `${person.birthYear} – ${tr('hozir', alphabet)}`;
}

export function ageOf(person: Person): number | null {
  if (!person.birthYear) return null;
  return (person.deathYear ?? new Date().getFullYear()) - person.birthYear;
}

export function generationLabel(generation: number, alphabet: Alphabet): string {
  return tr(`${generation}-avlod`, alphabet);
}

export function genderTone(gender: Person['gender']): string {
  if (gender === 'female') return 'var(--color-female)';
  if (gender === 'male') return 'var(--color-male)';
  return 'var(--color-unknown)';
}

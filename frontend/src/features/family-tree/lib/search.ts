import type { Person } from '@/types/person';

export interface SearchOptions {
  limit?: number;
}

function haystack(person: Person): string {
  return [
    person.name,
    person.nameCyr,
    person.profession,
    person.city,
    person.birthYear ?? '',
    person.deathYear ?? '',
  ]
    .join(' ')
    .toLowerCase();
}

/**
 * Mahalliy qidiruv — ism, familiya, kasb, shahar va yil bo'yicha qismiy
 * moslik. Backend qidiruvi kelganda shu shakl saqlanadi.
 */
export function searchPeople(
  people: readonly Person[],
  query: string,
  { limit = 8 }: SearchOptions = {},
): Person[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  const hits = people.filter((person) => haystack(person).includes(needle));
  hits.sort((a, b) => {
    const aStarts = a.name.toLowerCase().startsWith(needle) ? 0 : 1;
    const bStarts = b.name.toLowerCase().startsWith(needle) ? 0 : 1;
    if (aStarts !== bStarts) return aStarts - bStarts;
    return a.generation - b.generation;
  });
  return hits.slice(0, limit);
}

export type DirectorySort = 'gen' | 'name' | 'birth';

export interface DirectoryFilters {
  query: string;
  generation: string;
  gender: string;
  sort: DirectorySort;
}

/** Odamlar sahifasidagi filtrlash — daraxt bilan bir xil modeldan. */
export function filterDirectory(
  people: readonly Person[],
  { query, generation, gender, sort }: DirectoryFilters,
): Person[] {
  const needle = query.trim().toLowerCase();
  let list = people.filter((person) => {
    if (needle && !haystack(person).includes(needle)) return false;
    if (generation !== 'all' && String(person.generation) !== generation) return false;
    if (gender !== 'all' && person.gender !== gender) return false;
    return true;
  });

  list = [...list].sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name);
    if (sort === 'birth') return (a.birthYear ?? 9999) - (b.birthYear ?? 9999);
    return a.generation - b.generation || a.name.localeCompare(b.name);
  });

  return list;
}

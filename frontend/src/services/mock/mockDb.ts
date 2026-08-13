import { env } from '@/app/config/env';
import type { Person, PersonId } from '@/types/person';
import { toSnapshot, type FamilyTreeDto } from '../mappers/person';
import raw from './data/family-data.json';

/**
 * Mock ma'lumot bazasi — seans davomida xotirada yashaydi.
 * Manba: `_design/v1/family-data.js` (Olloyor top shajarasi, 590 a'zo,
 * 13 avlod). Yozuvlar haqiqiy, bo'sh maydonlar ataylab bo'sh: dizayn
 * ularni "—" yoki bo'sh holat sifatida ko'rsatadi.
 */
const snapshot = toSnapshot(raw as FamilyTreeDto);

const people = new Map<PersonId, Person>(snapshot.people.map((p) => [p.id, p]));

export const mockDb = {
  family: snapshot.family,
  meId: snapshot.meId,
  generations: snapshot.generations,

  all(): Person[] {
    return [...people.values()];
  },

  get(id: PersonId): Person | null {
    return people.get(id) ?? null;
  },

  put(person: Person): Person {
    people.set(person.id, person);
    return person;
  },

  remove(id: PersonId): void {
    people.delete(id);
  },

  nextId(): PersonId {
    let candidate = people.size + 1;
    while (people.has(String(candidate))) candidate += 1;
    return String(candidate);
  },
};

/** Tarmoq kechikishini taqlid qiladi — yuklanish holatlari haqiqiy ko'rinadi. */
export function latency<T>(value: T, factor = 1): Promise<T> {
  const ms = Math.max(0, env.mockLatency * factor);
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), ms);
  });
}

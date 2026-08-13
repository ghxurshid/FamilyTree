import type { Person, PersonId } from '@/types/person';

/**
 * Normalizatsiya qilingan daraxt. Barcha algoritmlar shu indeks ustida
 * ishlaydi — React komponentlari ichida hech qanday kechish qilinmaydi.
 */
export interface TreeIndex {
  ids: PersonId[];
  byId: Record<PersonId, Person>;
  /** Ota id → farzandlar (tug'ilgan yil bo'yicha tartiblangan). */
  childrenOf: Record<PersonId, PersonId[]>;
  /** Shox egasi id → uning juftining id'si. */
  spouseOf: Record<PersonId, PersonId>;
  rootId: PersonId | null;
  generations: number;
}

const EMPTY: PersonId[] = [];

export function buildTreeIndex(people: Person[]): TreeIndex {
  const byId: Record<PersonId, Person> = {};
  const childrenOf: Record<PersonId, PersonId[]> = {};
  const spouseOf: Record<PersonId, PersonId> = {};

  for (const person of people) byId[person.id] = person;

  for (const person of people) {
    if (person.spouseOf) {
      spouseOf[person.spouseOf] = person.id;
      continue;
    }
    if (person.fatherId) {
      (childrenOf[person.fatherId] ??= []).push(person.id);
    }
  }

  for (const key of Object.keys(childrenOf)) {
    childrenOf[key].sort(
      (a, b) => (byId[a]?.birthYear ?? 0) - (byId[b]?.birthYear ?? 0),
    );
  }

  const root = people.find((p) => !p.fatherId && !p.spouseOf) ?? people[0];
  const generations = people.length
    ? Math.max(...people.map((p) => p.generation)) + 1
    : 0;

  return {
    ids: people.map((p) => p.id),
    byId,
    childrenOf,
    spouseOf,
    rootId: root ? root.id : null,
    generations,
  };
}

export function getPerson(index: TreeIndex, id: PersonId | null): Person | null {
  return id ? index.byId[id] ?? null : null;
}

export function childrenOf(index: TreeIndex, id: PersonId): PersonId[] {
  return index.childrenOf[id] ?? EMPTY;
}

/**
 * Shoxni ko'taruvchi odam: kelin/kuyov uchun — turmush o'rtog'i, aks holda
 * o'zi. Joylashuv va farzandlar shu odamga bog'lanadi.
 */
export function carrierOf(index: TreeIndex, id: PersonId): PersonId {
  const person = index.byId[id];
  return person?.spouseOf ? person.spouseOf : id;
}

/** Eng yaqindan boshlab yuqoriga qarab ajdodlar zanjiri. */
export function ancestorsOf(index: TreeIndex, id: PersonId): PersonId[] {
  const out: PersonId[] = [];
  let current = index.byId[carrierOf(index, id)];
  const guard = new Set<PersonId>();
  while (current?.fatherId && !guard.has(current.fatherId)) {
    guard.add(current.fatherId);
    out.push(current.fatherId);
    current = index.byId[current.fatherId];
  }
  return out;
}

export function isDescendantOf(
  index: TreeIndex,
  ancestorId: PersonId,
  id: PersonId,
): boolean {
  return ancestorsOf(index, id).includes(ancestorId);
}

/** Barcha avlodlar (kenglik bo'yicha), o'zi hisobga olinmaydi. */
export function descendantsOf(index: TreeIndex, id: PersonId): PersonId[] {
  const out: PersonId[] = [];
  const queue = [...childrenOf(index, id)];
  const seen = new Set<PersonId>();
  while (queue.length) {
    const current = queue.shift() as PersonId;
    if (seen.has(current)) continue;
    seen.add(current);
    out.push(current);
    queue.push(...childrenOf(index, current));
  }
  return out;
}

export function descendantCount(index: TreeIndex, id: PersonId): number {
  let total = 0;
  for (const child of childrenOf(index, id)) {
    total += 1 + descendantCount(index, child);
  }
  return total;
}

export function siblingsOf(index: TreeIndex, id: PersonId): PersonId[] {
  const person = index.byId[id];
  if (!person?.fatherId) return EMPTY;
  return childrenOf(index, person.fatherId).filter((sibling) => sibling !== id);
}

/** Ikki odamning eng yaqin umumiy ajdodi va ularning pog'onalari. */
export function commonAncestor(
  index: TreeIndex,
  a: PersonId,
  b: PersonId,
): { id: PersonId; upA: number; upB: number } | null {
  const lineA = [a, ...ancestorsOf(index, a)];
  const lineB = [b, ...ancestorsOf(index, b)];
  for (let i = 0; i < lineA.length; i += 1) {
    const j = lineB.indexOf(lineA[i]);
    if (j >= 0) return { id: lineA[i], upA: i, upB: j };
  }
  return null;
}

/** Avlodlar bo'yicha guruhlangan sanoq — People sahifasidagi filtr uchun. */
export function countByGeneration(index: TreeIndex): Map<number, number> {
  const map = new Map<number, number>();
  for (const id of index.ids) {
    const gen = index.byId[id].generation;
    map.set(gen, (map.get(gen) ?? 0) + 1);
  }
  return map;
}

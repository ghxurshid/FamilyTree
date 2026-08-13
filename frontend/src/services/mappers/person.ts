import type { FamilyTreeSnapshot, Gender, Person } from '@/types/person';
import { toCyrillic } from '@/utils/transliterate';

/** Backend/mock javobining shakli — UI bu tipni ko'rmaydi. */
export interface PersonDto {
  id: string | number;
  name: string;
  nameCyr?: string | null;
  gender?: string | null;
  gen?: number | null;
  father?: string | number | null;
  spouse?: string | number | null;
  spouseOf?: string | number | null;
  birth?: number | null;
  death?: number | null;
  city?: string | null;
  prof?: string | null;
  bio?: string | null;
}

export interface FamilyTreeDto {
  family?: { name?: string; nameCyr?: string; place?: string } | null;
  meId?: string | number | null;
  generations?: number | null;
  members: PersonDto[];
}

const id = (value: string | number | null | undefined): string | null =>
  value === null || value === undefined || value === '' ? null : String(value);

function toGender(value: string | null | undefined): Gender {
  if (value === 'male' || value === 'female') return value;
  return 'unknown';
}

export function toPerson(dto: PersonDto): Person {
  const name = dto.name ?? '';
  return {
    id: String(dto.id),
    name,
    nameCyr: dto.nameCyr || toCyrillic(name),
    gender: toGender(dto.gender),
    generation: dto.gen ?? 0,
    fatherId: id(dto.father),
    spouseId: id(dto.spouse),
    spouseOf: id(dto.spouseOf),
    birthYear: dto.birth ?? null,
    deathYear: dto.death ?? null,
    city: dto.city ?? '',
    profession: dto.prof ?? '',
    biography: dto.bio ?? '',
  };
}

export function toPersonDto(person: Person): PersonDto {
  return {
    id: person.id,
    name: person.name,
    nameCyr: person.nameCyr,
    gender: person.gender,
    gen: person.generation,
    father: person.fatherId,
    spouse: person.spouseId,
    spouseOf: person.spouseOf,
    birth: person.birthYear,
    death: person.deathYear,
    city: person.city,
    prof: person.profession,
    bio: person.biography,
  };
}

export function toSnapshot(dto: FamilyTreeDto): FamilyTreeSnapshot {
  const people = dto.members.map(toPerson);
  return {
    family: {
      name: dto.family?.name ?? 'Oila',
      nameCyr: dto.family?.nameCyr ?? toCyrillic(dto.family?.name ?? 'Oila'),
      place: dto.family?.place ?? '',
    },
    meId: id(dto.meId),
    generations:
      dto.generations ??
      (people.length ? Math.max(...people.map((p) => p.generation)) + 1 : 0),
    people,
  };
}

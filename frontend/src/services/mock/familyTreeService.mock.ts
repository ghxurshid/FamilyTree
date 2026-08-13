import type { FamilyTreeService, PersonService, SearchService } from '../types';
import { ApiError } from '../apiError';
import { latency, mockDb } from './mockDb';
import { searchPeople } from '@/features/family-tree/lib/search';
import { toCyrillic } from '@/utils/transliterate';
import type { Person } from '@/types/person';

export const mockFamilyTreeService: FamilyTreeService = {
  async getTree() {
    return latency({
      family: mockDb.family,
      meId: mockDb.meId,
      generations: mockDb.generations,
      people: mockDb.all(),
    });
  },
};

export const mockPersonService: PersonService = {
  async getPerson(id) {
    const person = mockDb.get(id);
    if (!person) throw new ApiError('not-found', 'Bunday odam topilmadi');
    return latency(person, 0.4);
  },

  async createPerson(input) {
    await latency(null, 1.6);
    const anchor = mockDb.get(input.anchorId);
    if (!anchor) throw new ApiError('not-found', 'Ota-ona yozuvi topilmadi');

    const isSpouse = input.relation === 'spouse';
    const name = input.name.trim();
    const person: Person = {
      id: mockDb.nextId(),
      name,
      nameCyr: toCyrillic(name),
      gender: input.gender,
      generation: anchor.generation + (isSpouse ? 0 : 1),
      fatherId: isSpouse ? null : anchor.id,
      spouseId: isSpouse ? anchor.id : null,
      spouseOf: isSpouse ? anchor.id : null,
      birthYear: input.birthYear,
      deathYear: input.deathYear,
      city: input.city,
      profession: input.profession,
      biography: input.biography,
      isNew: true,
    };

    mockDb.put(person);
    // Juft qo'shilganda qarshi bog'lanish ham yoziladi.
    const affected = isSpouse ? [mockDb.put({ ...anchor, spouseId: person.id })] : [];
    return { person, affected };
  },

  async updatePerson(input) {
    await latency(null, 1.4);
    const current = mockDb.get(input.id);
    if (!current) throw new ApiError('not-found', 'Bunday odam topilmadi');

    const name = input.name?.trim() ?? current.name;
    const person = mockDb.put({
      ...current,
      ...input,
      name,
      nameCyr: name === current.name ? current.nameCyr : toCyrillic(name),
    });
    return { person, affected: [] };
  },

  async deletePerson(id) {
    await latency(null, 0.8);
    if (!mockDb.get(id)) throw new ApiError('not-found', 'Bunday odam topilmadi');
    mockDb.remove(id);
  },
};

export const mockSearchService: SearchService = {
  async searchPeople(query, limit) {
    return latency(searchPeople(mockDb.all(), query, { limit }), 0.2);
  },
};

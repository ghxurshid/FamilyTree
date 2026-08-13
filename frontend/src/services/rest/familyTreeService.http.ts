import { http } from '../httpClient';
import { toPerson, toSnapshot, type FamilyTreeDto, type PersonDto } from '../mappers/person';
import type {
  FamilyTreeService,
  PersonMutationResult,
  PersonService,
  SearchService,
} from '../types';

/**
 * Yozuv o'zgarishi javobi. Backend yo yalang'och yozuvni, yo `person` +
 * `affected` juftligini qaytarishi mumkin — ikkalasini ham tushunamiz.
 */
type MutationDto = PersonDto | { person: PersonDto; affected?: PersonDto[] };

function toMutationResult(dto: MutationDto): PersonMutationResult {
  if ('person' in dto && dto.person) {
    return { person: toPerson(dto.person), affected: (dto.affected ?? []).map(toPerson) };
  }
  return { person: toPerson(dto as PersonDto), affected: [] };
}

export const httpFamilyTreeService: FamilyTreeService = {
  async getTree() {
    return toSnapshot(await http.get<FamilyTreeDto>('/family-tree'));
  },
};

export const httpPersonService: PersonService = {
  async getPerson(id) {
    return toPerson(await http.get<PersonDto>(`/people/${encodeURIComponent(id)}`));
  },

  async createPerson(input) {
    return toMutationResult(
      await http.post<MutationDto>('/people', {
        anchorId: input.anchorId,
        relation: input.relation,
        name: input.name,
        gender: input.gender,
        birth: input.birthYear,
        death: input.deathYear,
        city: input.city,
        prof: input.profession,
        bio: input.biography,
      }),
    );
  },

  async updatePerson({ id, ...changes }) {
    return toMutationResult(
      await http.patch<MutationDto>(`/people/${encodeURIComponent(id)}`, {
        name: changes.name,
        gender: changes.gender,
        birth: changes.birthYear,
        death: changes.deathYear,
        city: changes.city,
        prof: changes.profession,
        bio: changes.biography,
      }),
    );
  },

  async deletePerson(id) {
    await http.delete<void>(`/people/${encodeURIComponent(id)}`);
  },
};

export const httpSearchService: SearchService = {
  async searchPeople(query, limit = 8) {
    const params = new URLSearchParams({ q: query, limit: String(limit) });
    const result = await http.get<PersonDto[]>(`/people/search?${params.toString()}`);
    return result.map(toPerson);
  },
};

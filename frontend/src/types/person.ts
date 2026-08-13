export type PersonId = string;

export type Gender = 'male' | 'female' | 'unknown';

/** Domen modeli — UI shu shakl bilan ishlaydi, API javobi bilan emas. */
export interface Person {
  id: PersonId;
  name: string;
  /** Kirill yozuvidagi ism. Bo'sh bo'lsa lotin ismdan hosil qilinadi. */
  nameCyr: string;
  gender: Gender;
  /** Avlod raqami — 0 eng katta ajdod. */
  generation: number;
  /** Otasining id'si. Ildizda va oilaga kelin bo'lib kirganda null. */
  fatherId: PersonId | null;
  /** Turmush o'rtog'ining id'si (ikki tomonlama bog'lanish). */
  spouseId: PersonId | null;
  /**
   * Oilaga kelin/kuyov bo'lib kirgan odam — daraxtda juftining yonida turadi
   * va o'z shoxini yasamaydi.
   */
  spouseOf: PersonId | null;
  birthYear: number | null;
  deathYear: number | null;
  city: string;
  profession: string;
  biography: string;
  /** Ushbu seansda qo'shilgan yozuv — kartada qisqa urg'u beriladi. */
  isNew?: boolean;
}

/** Formadan keladigan ma'lumot — id va munosabat servis qatlamida qo'shiladi. */
export interface PersonDraft {
  name: string;
  gender: Gender;
  birthYear: number | null;
  deathYear: number | null;
  city: string;
  profession: string;
  biography: string;
}

export type NewPersonRelation = 'child' | 'spouse';

export interface CreatePersonInput extends PersonDraft {
  /** Kimga nisbatan qo'shilyapti. */
  anchorId: PersonId;
  relation: NewPersonRelation;
}

export interface UpdatePersonInput extends Partial<PersonDraft> {
  id: PersonId;
}

export interface FamilyMeta {
  name: string;
  nameCyr: string;
  place: string;
}

export interface FamilyTreeSnapshot {
  family: FamilyMeta;
  /** Kirgan foydalanuvchiga mos keluvchi shaxs. */
  meId: PersonId | null;
  generations: number;
  people: Person[];
}

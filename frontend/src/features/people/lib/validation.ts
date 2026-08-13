import type { PersonDraft } from '@/types/person';

export type PersonFormValues = {
  name: string;
  gender: PersonDraft['gender'];
  birth: string;
  death: string;
  city: string;
  profession: string;
  biography: string;
};

export type PersonFormErrors = Partial<Record<keyof PersonFormValues, string>>;

export const emptyPersonForm = (city = ''): PersonFormValues => ({
  name: '',
  gender: 'male',
  birth: '',
  death: '',
  city,
  profession: '',
  biography: '',
});

/** Forma qoidalari — komponentdan tashqarida, alohida test qilinadi. */
export function validatePersonForm(values: PersonFormValues): PersonFormErrors {
  const errors: PersonFormErrors = {};

  if (!values.name.trim()) {
    errors.name = 'Ism kiritilishi shart';
  }
  if (values.birth && !/^\d{4}$/.test(values.birth)) {
    errors.birth = "To'rt xonali yil (masalan 1998)";
  }
  if (values.death && !/^\d{4}$/.test(values.death)) {
    errors.death = "To'rt xonali yil (masalan 1998)";
  }
  if (
    values.death &&
    values.birth &&
    /^\d{4}$/.test(values.death) &&
    /^\d{4}$/.test(values.birth) &&
    Number(values.death) < Number(values.birth)
  ) {
    errors.death = "Vafot yili tug'ilgan yildan oldin bo'lolmaydi";
  }

  return errors;
}

export function toDraft(values: PersonFormValues): PersonDraft {
  return {
    name: values.name.trim(),
    gender: values.gender,
    birthYear: values.birth ? Number(values.birth) : null,
    deathYear: values.death ? Number(values.death) : null,
    city: values.city.trim(),
    profession: values.profession.trim(),
    biography: values.biography.trim(),
  };
}

/** Faqat raqam, 4 xona — yil maydonlari uchun. */
export function sanitizeYear(input: string): string {
  return input.replace(/\D/g, '').slice(0, 4);
}

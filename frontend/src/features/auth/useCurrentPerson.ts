import { useCallback } from 'react';
import { useAuth } from '@/stores/authStore';
import { useFamilyTree } from '@/stores/familyTreeStore';
import { canEditPerson } from '@/features/family-tree/lib/permissions';
import type { Person, PersonId } from '@/types/person';

/**
 * Kirgan foydalanuvchi — shajaradagi oddiy shaxs sifatida. Alohida "soxta
 * foydalanuvchi tuguni" yaratilmaydi.
 */
export function useCurrentPerson(): Person | null {
  const personId = useAuth((state) => state.user?.personId ?? null);
  const byId = useFamilyTree((state) => state.index.byId);
  return personId ? byId[personId] ?? null : null;
}

export function useCurrentPersonId(): PersonId | null {
  const authenticated = useAuth((state) => state.status === 'authenticated');
  const personId = useAuth((state) => state.user?.personId ?? null);
  return authenticated ? personId : null;
}

/** Tahrirlash huquqini tekshiruvchi funksiya — mantiq komponentda emas. */
export function useCanEdit(): (id: PersonId | null) => boolean {
  const index = useFamilyTree((state) => state.index);
  const meId = useCurrentPersonId();
  return useCallback((id: PersonId | null) => canEditPerson(index, meId, id), [index, meId]);
}

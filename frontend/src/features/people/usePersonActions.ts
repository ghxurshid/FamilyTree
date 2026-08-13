import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { familyTreeStore, useFamilyTree } from '@/stores/familyTreeStore';
import { personEditorStore } from '@/stores/personEditorStore';
import { toast } from '@/stores/toastStore';
import { useAuth } from '@/stores/authStore';
import { useCanEdit } from '@/features/auth/useCurrentPerson';
import { carrierOf } from '@/features/family-tree/lib/treeIndex';
import { ROUTES } from '@/app/config/routes';
import type { NewPersonRelation, PersonId } from '@/types/person';

export interface PersonActions {
  /** Odamni tanlash — kerak bo'lsa daraxtga o'tib, kamerani olib boradi. */
  open(id: PersonId, options?: { navigate?: boolean; zoom?: number }): void;
  edit(id: PersonId): void;
  add(anchorId: PersonId, relation?: NewPersonRelation): void;
}

/**
 * Tahrirlash/qo'shish har joyda bir xil ishlashi uchun yagona kirish nuqtasi:
 * daraxt, Odamlar sahifasi va profil — hammasi shu amallarni chaqiradi.
 */
export function usePersonActions(): PersonActions {
  const navigate = useNavigate();
  const index = useFamilyTree((state) => state.index);
  const authenticated = useAuth((state) => state.status === 'authenticated');
  const canEdit = useCanEdit();

  const open = useCallback<PersonActions['open']>(
    (id, options = {}) => {
      familyTreeStore.select(id, { zoom: options.zoom });
      if (options.navigate !== false) {
        navigate(`${ROUTES.tree}?person=${encodeURIComponent(id)}`);
      }
    },
    [navigate],
  );

  const edit = useCallback<PersonActions['edit']>(
    (id) => {
      if (!authenticated) {
        navigate(ROUTES.login);
        return;
      }
      if (!canEdit(id)) {
        toast.warn("Bu odamni tahrirlash huquqingiz yo'q");
        return;
      }
      const person = index.byId[id];
      if (person) personEditorStore.startEdit(person);
    },
    [authenticated, canEdit, index, navigate],
  );

  const add = useCallback<PersonActions['add']>(
    (anchorId, relation = 'child') => {
      if (!authenticated) {
        navigate(ROUTES.login);
        return;
      }
      const carrier = carrierOf(index, anchorId);
      if (!canEdit(carrier)) {
        toast.warn("Bu shoxni tahrirlash huquqingiz yo'q");
        return;
      }
      const anchor = index.byId[carrier];
      if (!anchor) return;
      familyTreeStore.select(carrier, { fly: false });
      personEditorStore.startAdd(anchor, relation);
    },
    [authenticated, canEdit, index, navigate],
  );

  return { open, edit, add };
}

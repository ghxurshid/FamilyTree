import { useMemo } from 'react';
import { useCurrentPersonId } from '@/features/auth/useCurrentPerson';
import { useFamilyTree } from '@/stores/familyTreeStore';
import { layoutTree, type TreeLayout } from '../lib/layout';

/**
 * Joylashuv faqat unga ta'sir qiluvchi holat o'zgarganda qayta hisoblanadi
 * (a'zolar, yig'ilgan shoxlar, rejim). Kamera harakati layoutga tegmaydi.
 */
export function useTreeLayout(): TreeLayout {
  const index = useFamilyTree((state) => state.index);
  const collapsed = useFamilyTree((state) => state.collapsed);
  const mode = useFamilyTree((state) => state.viewMode);
  // Ma'lumotdagi `meId` emas — "men"ga bog'liq rejimlar faqat kirgan foydalanuvchida.
  const meId = useCurrentPersonId();
  const selectedId = useFamilyTree((state) => state.selectedId);

  // "branch" rejimidan boshqa holatda tanlov joylashuvga ta'sir qilmaydi.
  const branchAnchor = mode === 'branch' ? selectedId : null;

  return useMemo(
    () => layoutTree({ index, collapsed, mode, meId, selectedId: branchAnchor }),
    [index, collapsed, mode, meId, branchAnchor],
  );
}

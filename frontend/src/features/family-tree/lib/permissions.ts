import type { PersonId } from '@/types/person';
import { carrierOf, isDescendantOf, type TreeIndex } from './treeIndex';

/**
 * Frontend huquqi — faqat UX uchun. Haqiqiy ruxsatni backend hal qiladi.
 *
 * Qoida: kirgan foydalanuvchi o'zini, farzandlarini va ularning barcha
 * avlodlarini tahrirlay oladi. Boshqa shoxlarga tegmaydi.
 */
export function canEditPerson(
  index: TreeIndex,
  currentPersonId: PersonId | null,
  targetId: PersonId | null,
): boolean {
  if (!currentPersonId || !targetId) return false;
  if (!index.byId[targetId] || !index.byId[currentPersonId]) return false;
  const carrier = carrierOf(index, targetId);
  return carrier === currentPersonId || isDescendantOf(index, currentPersonId, carrier);
}

/** Foydalanuvchi tahrirlay oladigan yozuvlar soni (o'zi bilan birga). */
export function editableCount(
  index: TreeIndex,
  currentPersonId: PersonId | null,
): number {
  if (!currentPersonId) return 0;
  let total = 1;
  const walk = (id: PersonId) => {
    for (const child of index.childrenOf[id] ?? []) {
      total += 1;
      walk(child);
    }
  };
  walk(currentPersonId);
  return total;
}

import type { PersonId } from '@/types/person';
import {
  ancestorsOf,
  carrierOf,
  childrenOf,
  commonAncestor,
  type TreeIndex,
} from './treeIndex';

/**
 * Kirgan foydalanuvchiga nisbatan qarindoshlik nomi (o'zbekcha).
 * Toza funksiya — UI'dan mustaqil, alohida test qilinadi.
 */
export function relationLabel(
  index: TreeIndex,
  meId: PersonId | null,
  targetId: PersonId,
): string {
  const target = index.byId[targetId];
  if (!meId || !target || !index.byId[meId]) return '';
  if (targetId === meId) return 'Siz';

  if (target.spouseOf) {
    if (target.spouseOf === meId) return "Turmush o'rtog'ingiz";
    const up = ancestorsOf(index, meId).indexOf(target.spouseOf);
    if (up === 0) return 'Onangiz';
    if (up === 1) return 'Buvingiz';
    if (up === 2) return 'Katta buvingiz';
    if (up > 2) return `${up + 1}-avlod yuqorida · buvingiz`;
    return `${relationLabel(index, meId, target.spouseOf)} — rafiqasi`;
  }

  const upList = ancestorsOf(index, meId);
  const up = upList.indexOf(targetId);
  if (up >= 0) {
    const names = ['Otangiz', 'Bobongiz', 'Katta bobongiz', "Bobongizning bobosi"];
    return names[up] ?? `${up + 1}-avlod yuqorida · bobokalon`;
  }

  const down = ancestorsOf(index, targetId).indexOf(meId);
  if (down >= 0) {
    const steps = down + 1;
    const female = target.gender === 'female';
    if (steps === 1) return female ? 'Qizingiz' : "O'g'lingiz";
    if (steps === 2) return 'Nabirangiz';
    if (steps === 3) return 'Evarangiz';
    if (steps === 4) return 'Chevarangiz';
    return `${steps}-avlod pastda · avlodingiz`;
  }

  const me = index.byId[meId];
  if (me.fatherId && target.fatherId === me.fatherId) {
    const older = (target.birthYear ?? 0) < (me.birthYear ?? 0);
    if (target.gender === 'female') return older ? 'Opangiz' : 'Singlingiz';
    return older ? 'Akangiz' : 'Ukangiz';
  }

  const common = commonAncestor(index, meId, targetId);
  if (!common) return 'Qarindosh';
  const { upA, upB } = common;
  if (upA === 2 && upB === 1) return target.gender === 'female' ? 'Ammangiz' : 'Amakingiz';
  if (upA === 2 && upB === 2) return 'Amakivachchangiz';
  if (upA === 1 && upB === 2) return 'Jiyaningiz';
  if (upA === 3 && upB === 2) return "Otangizning amakivachchasi";
  if (upA === 3 && upB === 3) return 'Ikkinchi amakivachcha';
  if (upB === 1) return `${upA}-avlod · amaki tomondan`;
  return `Uzoq qarindosh · ${upA + upB} pog'ona`;
}

export interface RelationGroup {
  title: string;
  ids: PersonId[];
}

/** Shaxs paneli uchun qarindoshlar guruhlari — dizayndagi tartibda. */
export function relationGroups(index: TreeIndex, id: PersonId): RelationGroup[] {
  const person = index.byId[id];
  if (!person) return [];

  const groups: RelationGroup[] = [];
  const carrier = carrierOf(index, id);
  const father = person.fatherId;
  const inLawFather = !person.fatherId && person.spouseOf
    ? index.byId[carrier]?.fatherId ?? null
    : null;

  if (father) groups.push({ title: 'Otasi', ids: [father] });

  const mother = father ? index.spouseOf[father] : null;
  if (mother) groups.push({ title: 'Onasi', ids: [mother] });

  if (inLawFather) groups.push({ title: 'Qaynotasi', ids: [inLawFather] });

  const inLawMother = inLawFather ? index.spouseOf[inLawFather] : null;
  if (inLawMother) groups.push({ title: 'Qaynonasi', ids: [inLawMother] });

  const spouse = person.spouseOf ? person.spouseOf : index.spouseOf[person.id];
  if (spouse) groups.push({ title: "Turmush o'rtog'i", ids: [spouse] });

  const kids = childrenOf(index, carrier);
  if (kids.length) groups.push({ title: `Farzandlari — ${kids.length}`, ids: kids });

  const sibs = father
    ? childrenOf(index, father).filter((sibling) => sibling !== person.id)
    : [];
  if (sibs.length) {
    groups.push({ title: `Aka-uka, opa-singil — ${sibs.length}`, ids: sibs });
  }

  const inLawSibs = inLawFather
    ? childrenOf(index, inLawFather).filter((sibling) => sibling !== carrier)
    : [];
  if (inLawSibs.length) {
    groups.push({ title: `Qaynog'a, qaynsingil — ${inLawSibs.length}`, ids: inLawSibs });
  }

  return groups;
}

import {
  CARD_H,
  CARD_W,
  SPOUSE_DX,
  SPOUSE_DX_ACTIVE,
  SPOUSE_DY,
  SPOUSE_DY_ACTIVE,
  SPOUSE_H,
  SPOUSE_W,
} from '@/constants/tree';
import type { Person, PersonId } from '@/types/person';
import type { TreeDensity } from '@/types/ui';
import type { TreeLayout } from './layout';
import { carrierOf, childrenOf, descendantCount, type TreeIndex } from './treeIndex';

export interface TreeNodeModel {
  key: string;
  person: Person;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  isSpouse: boolean;
  /** Juft kartasi tanlanganda oldinga chiqadi. */
  spouseActive: boolean;
  isSelected: boolean;
  /** Tanlangan odamga olib boruvchi chiziqda turibdi. */
  onPath: boolean;
  dimmed: boolean;
  isMe: boolean;
  editable: boolean;
  childCount: number;
  collapsed: boolean;
  collapsedCount: number;
  showAvatar: boolean;
  showMeta: boolean;
  showRelation: boolean;
  showStatus: boolean;
  saving: boolean;
}

export interface NodeModelOptions {
  index: TreeIndex;
  layout: TreeLayout;
  selectedId: PersonId | null;
  meId: PersonId | null;
  density: TreeDensity;
  collapsed: ReadonlySet<PersonId>;
  savingIds: ReadonlySet<PersonId>;
  showAvatars: boolean;
  canEdit(id: PersonId): boolean;
}

/**
 * Kartalar modeli — joylashuv, tanlov va zichlikdan kelib chiqadi.
 * Toza funksiya: React komponentlari faqat chizadi.
 */
export function buildNodeModels(options: NodeModelOptions): TreeNodeModel[] {
  const {
    index,
    layout,
    selectedId,
    meId,
    density,
    collapsed,
    savingIds,
    showAvatars,
    canEdit,
  } = options;

  const selectedCarrier = selectedId ? carrierOf(index, selectedId) : null;
  const lineage = new Set<PersonId>();
  if (selectedCarrier) {
    lineage.add(selectedCarrier);
    let current = index.byId[selectedCarrier];
    while (current?.fatherId) {
      lineage.add(current.fatherId);
      current = index.byId[current.fatherId];
    }
  }
  const selectedChildren = selectedCarrier
    ? new Set(childrenOf(index, selectedCarrier))
    : null;

  const nodes: TreeNodeModel[] = [];

  const push = (
    person: Person,
    x: number,
    y: number,
    width: number,
    height: number,
    isSpouse: boolean,
    spouseActive = false,
  ) => {
    const carrier = carrierOf(index, person.id);
    const isSelected = selectedId === person.id;
    const onPath = !isSelected && !isSpouse && lineage.has(carrier);
    const related =
      !selectedId ||
      lineage.has(carrier) ||
      carrier === selectedCarrier ||
      Boolean(selectedChildren?.has(carrier));
    const childCount = isSpouse ? 0 : childrenOf(index, person.id).length;
    const isCollapsed = collapsed.has(person.id);

    nodes.push({
      key: person.id,
      person,
      x: Math.round(x - width / 2),
      y: Math.round(y - height / 2),
      width,
      height,
      zIndex: isSelected ? 40 : isSpouse ? (spouseActive ? 40 : 3) : 6,
      isSpouse,
      spouseActive,
      isSelected,
      onPath,
      dimmed: Boolean(selectedId) && !related,
      isMe: person.id === meId,
      editable: canEdit(person.id),
      childCount,
      collapsed: isCollapsed,
      collapsedCount: isCollapsed ? descendantCount(index, person.id) : 0,
      showAvatar: isSpouse
        ? spouseActive && density !== 'min'
        : showAvatars && density !== 'min',
      showMeta:
        !(isSpouse && !spouseActive) &&
        density === 'full' &&
        Boolean(person.birthYear || person.deathYear || person.city),
      showRelation: !(isSpouse && !spouseActive) && density !== 'min',
      showStatus: !(isSpouse && !spouseActive) && density !== 'min',
      saving: savingIds.has(person.id),
    });
  };

  for (const id of layout.order) {
    const person = index.byId[id];
    const position = layout.positions[id];
    if (!person || !position) continue;

    push(person, position.x, position.y + CARD_H / 2, CARD_W, CARD_H, false);

    const spouseId = index.spouseOf[id];
    const spouse = spouseId ? index.byId[spouseId] : null;
    if (spouse) {
      const active = selectedId === spouse.id;
      push(
        spouse,
        position.x + (active ? SPOUSE_DX_ACTIVE : SPOUSE_DX),
        position.y + CARD_H / 2 + (active ? SPOUSE_DY_ACTIVE : SPOUSE_DY),
        SPOUSE_W,
        SPOUSE_H,
        true,
        active,
      );
    }
  }

  return nodes;
}

export interface ConnectorModel {
  key: string;
  d: string;
  /** Tanlangan odamgacha bo'lgan yo'l — yorqin chiziq. */
  highlighted: boolean;
}

/** Ota-farzand bog'lovchilari va tanlangan chiziqning yorqin nusxasi. */
export function buildConnectors(
  index: TreeIndex,
  layout: TreeLayout,
  selectedId: PersonId | null,
  collapsed: ReadonlySet<PersonId>,
  busY: (parentY: number) => number,
): { links: ConnectorModel[]; glow: ConnectorModel[] } {
  const links: ConnectorModel[] = [];
  const glow: ConnectorModel[] = [];

  const selectedCarrier = selectedId ? carrierOf(index, selectedId) : null;
  const lineage = new Set<PersonId>();
  if (selectedCarrier) {
    lineage.add(selectedCarrier);
    let current = index.byId[selectedCarrier];
    while (current?.fatherId) {
      lineage.add(current.fatherId);
      current = index.byId[current.fatherId];
    }
  }

  for (const id of layout.order) {
    const parent = layout.positions[id];
    if (!parent || collapsed.has(id)) continue;
    const kids = childrenOf(index, id).filter((child) => layout.positions[child]);
    if (!kids.length) continue;

    const bus = busY(parent.y);
    const xs = kids.map((child) => layout.positions[child].x);
    const left = Math.min(...xs, parent.x);
    const right = Math.max(...xs, parent.x);

    let d = `M${parent.x},${parent.y + CARD_H} V${bus} M${left},${bus} H${right}`;
    for (const child of kids) {
      d += ` M${layout.positions[child].x},${bus} V${layout.positions[child].y}`;
    }
    links.push({ key: id, d, highlighted: false });

    const step = lineage.has(id) ? kids.find((child) => lineage.has(child)) : undefined;
    if (step) {
      const cx = layout.positions[step].x;
      const lo = Math.min(parent.x, cx);
      const hi = Math.max(parent.x, cx);
      glow.push({
        key: `${id}-glow`,
        d: `M${parent.x},${parent.y + CARD_H} V${bus} M${lo},${bus} H${hi} M${cx},${bus} V${layout.positions[step].y}`,
        highlighted: true,
      });
    }
  }

  return { links, glow };
}

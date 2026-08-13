import {
  CANVAS_PAD,
  CARD_H,
  CARD_W,
  GAP_X,
  ROW_H,
  SPOUSE_PEEK,
} from '@/constants/tree';
import type { PersonId } from '@/types/person';
import type { TreeViewMode } from '@/types/ui';
import { ancestorsOf, carrierOf, childrenOf, type TreeIndex } from './treeIndex';

/**
 * "Shox" rejimida tanlangan odamdan necha pog'ona yuqoriga chiqib shox
 * ildizi olinadi. Avlodlar soniga bog'liq emas — daraxt qanchalik chuqur
 * bo'lsa ham ishlaydi.
 */
const BRANCH_UP_LEVELS = 4;

export interface NodePosition {
  /** Kartaning gorizontal markazi. */
  x: number;
  /** Kartaning yuqori qirrasi. */
  y: number;
  depth: number;
}

export interface LayoutRow {
  depth: number;
  y: number;
  generation: number;
  ids: PersonId[];
}

export interface TreeLayout {
  positions: Record<PersonId, NodePosition>;
  /** Joylashtirilgan shox egalari — render tartibida. */
  order: PersonId[];
  rows: LayoutRow[];
  bounds: { width: number; height: number };
}

export interface LayoutOptions {
  index: TreeIndex;
  /** Yig'ilgan shoxlar — bu odamlarning farzandlari chizilmaydi. */
  collapsed: ReadonlySet<PersonId>;
  mode: TreeViewMode;
  /** Kirgan foydalanuvchining shajaradagi id'si. */
  meId: PersonId | null;
  /** Tanlangan odam — "branch" rejimi shu atrofda quriladi. */
  selectedId: PersonId | null;
}

interface LayoutSpec {
  root?: PersonId;
  /** To'g'ri ajdodlar rejimi — bitta vertikal zanjir. */
  chain?: PersonId[];
}

const EMPTY_LAYOUT: TreeLayout = {
  positions: {},
  order: [],
  rows: [],
  bounds: { width: 1000, height: 1000 },
};

function resolveSpec({
  index,
  mode,
  meId,
  selectedId,
}: LayoutOptions): LayoutSpec {
  if (mode === 'ancestors' && meId) {
    return { chain: [meId, ...ancestorsOf(index, meId)].reverse() };
  }
  if (mode === 'descendants' && meId) {
    return { root: meId };
  }
  if (mode === 'branch') {
    const anchor = selectedId ? carrierOf(index, selectedId) : meId;
    if (anchor) {
      const line = [anchor, ...ancestorsOf(index, anchor)];
      const branch = line[Math.min(BRANCH_UP_LEVELS, line.length - 1)];
      return { root: branch };
    }
  }
  return { root: index.rootId ?? undefined };
}

/**
 * Determinatsiyalangan iyerarxik joylashuv: ota farzandlari ustida
 * markazlashadi, hech qanday piksel qo'lda yozilmaydi va daraxt chuqurligi
 * cheklanmagan.
 */
export function layoutTree(options: LayoutOptions): TreeLayout {
  const { index, collapsed } = options;
  const spec = resolveSpec(options);
  if (!spec.root && !spec.chain?.length) return EMPTY_LAYOUT;

  const positions: Record<PersonId, NodePosition> = {};
  const order: PersonId[] = [];
  const nextX: Record<number, number> = {};

  const rightPad = (id: PersonId) =>
    CARD_W / 2 + (index.spouseOf[id] ? SPOUSE_PEEK + GAP_X : 0);

  const visibleKids = (id: PersonId): PersonId[] =>
    spec.chain || collapsed.has(id) ? [] : childrenOf(index, id);

  const shift = (id: PersonId, dx: number, depth: number) => {
    positions[id].x += dx;
    nextX[depth] = Math.max(nextX[depth] ?? 0, positions[id].x + rightPad(id) + GAP_X);
    for (const child of visibleKids(id)) shift(child, dx, depth + 1);
  };

  const place = (id: PersonId, depth: number) => {
    if (!index.byId[id] || positions[id]) return;
    const kids = visibleKids(id);
    const min = (nextX[depth] ?? 0) + CARD_W / 2;
    let x: number;

    if (!kids.length) {
      x = min;
    } else {
      for (const child of kids) place(child, depth + 1);
      const placed = kids.filter((child) => positions[child]);
      const xs = placed.map((child) => positions[child].x);
      const center = xs.length ? (Math.min(...xs) + Math.max(...xs)) / 2 : min;
      x = Math.max(center, min);
      if (x - center > 0.5) {
        for (const child of placed) shift(child, x - center, depth + 1);
      }
    }

    positions[id] = { x, y: depth * ROW_H, depth };
    order.push(id);
    nextX[depth] = x + rightPad(id) + GAP_X;
  };

  if (spec.chain) {
    spec.chain.forEach((id, depth) => place(id, depth));
  } else if (spec.root) {
    place(spec.root, 0);
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let maxY = 0;
  for (const id of order) {
    const position = positions[id];
    minX = Math.min(minX, position.x - CARD_W / 2);
    maxX = Math.max(maxX, position.x + rightPad(id));
    maxY = Math.max(maxY, position.y);
  }
  if (!order.length) return EMPTY_LAYOUT;

  const dx = CANVAS_PAD - minX;
  const rowsByDepth = new Map<number, LayoutRow>();
  for (const id of order) {
    const position = positions[id];
    position.x += dx;
    position.y += CANVAS_PAD;
    const row = rowsByDepth.get(position.depth);
    if (row) {
      row.ids.push(id);
    } else {
      rowsByDepth.set(position.depth, {
        depth: position.depth,
        y: position.y,
        generation: index.byId[id].generation,
        ids: [id],
      });
    }
  }

  return {
    positions,
    order,
    rows: [...rowsByDepth.values()].sort((a, b) => a.depth - b.depth),
    bounds: {
      width: maxX - minX + CANVAS_PAD * 2,
      height: maxY + ROW_H + CANVAS_PAD,
    },
  };
}

/** Ota-farzand bog'lovchisining gorizontal "shina" balandligi. */
export function connectorBusY(parentY: number): number {
  return parentY + CARD_H + (ROW_H - CARD_H) * 0.44;
}

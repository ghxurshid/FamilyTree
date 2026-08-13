import { memo, useEffect, useMemo, useRef } from 'react';
import { CARD_H, CARD_W } from '@/constants/tree';
import { genderTone } from '@/features/family-tree/lib/format';
import type { TreeLayout } from '@/features/family-tree/lib/layout';
import type { TreeIndex } from '@/features/family-tree/lib/treeIndex';
import type { TreeCamera } from '@/features/family-tree/hooks/useTreeCamera';
import type { PersonId } from '@/types/person';
import styles from './tree.module.css';

interface MiniMapProps {
  layout: TreeLayout;
  index: TreeIndex;
  meId: PersonId | null;
  camera: TreeCamera;
  label: string;
}

const MM_W = 176;
const MM_H = 104;

/** Umumiy ko'rinish — nuqtalar va joriy ko'rish maydoni ramkasi. */
function MiniMapImpl({ layout, index, meId, camera, label }: MiniMapProps): JSX.Element {
  const boxRef = useRef<HTMLButtonElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const projection = useMemo(() => {
    const scale = Math.min(MM_W / layout.bounds.width, MM_H / layout.bounds.height);
    return {
      scale,
      ox: (MM_W - layout.bounds.width * scale) / 2,
      oy: (MM_H - layout.bounds.height * scale) / 2,
    };
  }, [layout.bounds.height, layout.bounds.width]);

  const dots = useMemo(
    () =>
      layout.order.map((id) => {
        const position = layout.positions[id];
        const person = index.byId[id];
        return {
          id,
          left: projection.ox + (position.x - CARD_W / 2) * projection.scale,
          top: projection.oy + position.y * projection.scale,
          width: Math.max(2, CARD_W * projection.scale),
          height: Math.max(1.5, CARD_H * projection.scale),
          color: id === meId ? 'var(--color-accent)' : genderTone(person.gender),
        };
      }),
    [index.byId, layout.order, layout.positions, meId, projection],
  );

  useEffect(
    () =>
      camera.subscribe((state) => {
        const node = viewportRef.current;
        const box = boxRef.current;
        if (!node || !box) return;
        const rect = camera.viewportRect();
        node.style.left = `${Math.max(0, projection.ox + (-state.x / state.k) * projection.scale)}px`;
        node.style.top = `${Math.max(0, projection.oy + (-state.y / state.k) * projection.scale)}px`;
        node.style.width = `${Math.min(MM_W, (rect.width / state.k) * projection.scale)}px`;
        node.style.height = `${Math.min(MM_H, (rect.height / state.k) * projection.scale)}px`;
      }),
    [camera, projection],
  );

  return (
    <button
      ref={boxRef}
      type="button"
      className={styles.minimap}
      aria-label={label}
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const worldX = (event.clientX - rect.left - projection.ox) / projection.scale;
        const worldY = (event.clientY - rect.top - projection.oy) / projection.scale;
        camera.focusPoint(worldX, worldY, camera.get().k, 420);
      }}
    >
      {dots.map((dot) => (
        <i
          key={dot.id}
          className={styles.minimapDot}
          style={{
            left: dot.left,
            top: dot.top,
            width: dot.width,
            height: dot.height,
            background: dot.color,
          }}
        />
      ))}
      <div ref={viewportRef} className={styles.minimapViewport} />
    </button>
  );
}

export const MiniMap = memo(MiniMapImpl);

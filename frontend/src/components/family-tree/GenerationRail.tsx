import { memo } from 'react';
import type { LayoutRow } from '@/features/family-tree/lib/layout';
import styles from './tree.module.css';

interface GenerationRailProps {
  rows: readonly LayoutRow[];
  myGeneration: number | null;
  label(generation: number): string;
  onSelect(row: LayoutRow): void;
}

/** Chapdagi avlod navigatori — har bir avlodga bir bosishda o'tish. */
function GenerationRailImpl({
  rows,
  myGeneration,
  label,
  onSelect,
}: GenerationRailProps): JSX.Element {
  return (
    <nav className={styles.rail} aria-label="Avlodlar">
      {rows.map((row) => {
        const mine = myGeneration === row.generation;
        return (
          <button
            key={row.depth}
            type="button"
            className={[styles.railItem, mine ? styles.railItemMine : ''].filter(Boolean).join(' ')}
            onClick={() => onSelect(row)}
          >
            {label(row.generation)}
            <i
              className={styles.railBar}
              style={{ width: Math.max(8, Math.min(40, row.ids.length * 4)) }}
            />
          </button>
        );
      })}
    </nav>
  );
}

export const GenerationRail = memo(GenerationRailImpl);

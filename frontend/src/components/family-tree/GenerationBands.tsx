import { memo } from 'react';
import { CARD_H, ROW_H } from '@/constants/tree';
import type { LayoutRow } from '@/features/family-tree/lib/layout';
import styles from './tree.module.css';

interface GenerationBandsProps {
  rows: readonly LayoutRow[];
  width: number;
  showLabels: boolean;
  /** Kirgan foydalanuvchining avlodi — "sizning avlodingiz" yozuvi uchun. */
  myGeneration: number | null;
  label(generation: number): string;
  myLabel: string;
}

/**
 * Har bir avlod uchun ko'rinadigan ajratgich. Joylashuv qatoridan
 * hisoblanadi — hech qanday qo'lda yozilgan piksel yo'q.
 */
function GenerationBandsImpl({
  rows,
  width,
  showLabels,
  myGeneration,
  label,
  myLabel,
}: GenerationBandsProps): JSX.Element {
  return (
    <>
      {rows.map((row, i) => (
        <div
          key={row.depth}
          className={[styles.band, i % 2 ? styles.bandAlt : ''].filter(Boolean).join(' ')}
          style={{
            top: row.y - (ROW_H - CARD_H) / 2,
            width,
            height: ROW_H,
          }}
        >
          {showLabels ? (
            <span className={styles.bandLabel}>
              {label(row.generation)}
              {myGeneration === row.generation ? (
                <b className={styles.bandLabelSub}>{myLabel}</b>
              ) : null}
            </span>
          ) : null}
        </div>
      ))}
    </>
  );
}

export const GenerationBands = memo(GenerationBandsImpl);

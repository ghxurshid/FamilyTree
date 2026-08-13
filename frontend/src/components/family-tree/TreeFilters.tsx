import { memo } from 'react';
import type { TreeViewMode } from '@/types/ui';
import styles from './tree.module.css';

interface TreeFiltersProps {
  value: TreeViewMode;
  onChange(mode: TreeViewMode): void;
  showMarriage: boolean;
  t(text: string): string;
}

const MODES: { key: TreeViewMode; label: string }[] = [
  { key: 'all', label: 'Butun oila' },
  { key: 'ancestors', label: "To'g'ri ajdodlar" },
  { key: 'descendants', label: 'Mening avlodlarim' },
  { key: 'branch', label: 'Shox' },
];

/** Ko'rinish rejimlari va rang izohi — kanvasning pastki chap burchagi. */
function TreeFiltersImpl({
  value,
  onChange,
  showMarriage,
  t,
}: TreeFiltersProps): JSX.Element {
  return (
    <div className={styles.bottomLeft}>
      <div className={styles.filterGroup} role="radiogroup" aria-label={t("Ko'rinish rejimi")}>
        {MODES.map((mode) => (
          <button
            key={mode.key}
            type="button"
            role="radio"
            aria-checked={value === mode.key}
            className={[styles.filterOption, value === mode.key ? styles.filterOptionActive : '']
              .filter(Boolean)
              .join(' ')}
            onClick={() => onChange(mode.key)}
          >
            {t(mode.label)}
          </button>
        ))}
      </div>

      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <i className={styles.legendSwatch} style={{ background: 'var(--color-male)' }} />
          <span>{t('Erkak')}</span>
        </span>
        <span className={styles.legendItem}>
          <i className={styles.legendSwatch} style={{ background: 'var(--color-female)' }} />
          <span>{t('Ayol')}</span>
        </span>
        {showMarriage ? (
          <span className={styles.legendItem}>
            <i className={styles.legendDashed} />
            <span>{t('Nikoh')}</span>
          </span>
        ) : null}
      </div>
    </div>
  );
}

export const TreeFilters = memo(TreeFiltersImpl);

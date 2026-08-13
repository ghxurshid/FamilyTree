import { memo } from 'react';
import type { TreeViewMode } from '@/types/ui';
import styles from './tree.module.css';

interface TreeFiltersProps {
  value: TreeViewMode;
  onChange(mode: TreeViewMode): void;
  showMarriage: boolean;
  /** "Men"ga bog'liq rejimlar — faqat kirgan foydalanuvchida ma'noga ega. */
  showMine: boolean;
  t(text: string): string;
}

const MODES: { key: TreeViewMode; label: string; mine?: true }[] = [
  { key: 'all', label: 'Butun oila' },
  { key: 'ancestors', label: "To'g'ri ajdodlar", mine: true },
  { key: 'descendants', label: 'Mening avlodlarim', mine: true },
  { key: 'branch', label: 'Shox' },
];

/** Ko'rinish rejimlari va rang izohi — kanvasning pastki chap burchagi. */
function TreeFiltersImpl({
  value,
  onChange,
  showMarriage,
  showMine,
  t,
}: TreeFiltersProps): JSX.Element {
  const modes = MODES.filter((mode) => showMine || !mode.mine);
  // Chiqib ketilganda "men"li rejim yashiriladi va daraxt butunlay ko'rsatiladi —
  // shu sababli faol belgi ham "Butun oila"ga o'tadi.
  const active = modes.some((mode) => mode.key === value) ? value : 'all';

  return (
    <div className={styles.bottomLeft}>
      <div className={styles.filterGroup} role="radiogroup" aria-label={t("Ko'rinish rejimi")}>
        {modes.map((mode) => (
          <button
            key={mode.key}
            type="button"
            role="radio"
            aria-checked={active === mode.key}
            className={[styles.filterOption, active === mode.key ? styles.filterOptionActive : '']
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

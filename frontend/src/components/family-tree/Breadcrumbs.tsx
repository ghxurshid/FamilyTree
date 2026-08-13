import { memo } from 'react';
import type { PersonId } from '@/types/person';
import styles from './tree.module.css';

export interface Crumb {
  id: PersonId;
  name: string;
  relation: string;
  current: boolean;
}

interface BreadcrumbsProps {
  crumbs: readonly Crumb[];
  onSelect(id: PersonId): void;
}

/** Ildizdan tanlangan odamgacha bo'lgan zanjir. */
function BreadcrumbsImpl({ crumbs, onSelect }: BreadcrumbsProps): JSX.Element | null {
  if (!crumbs.length) return null;
  return (
    <nav className={styles.breadcrumbs} aria-label="Ajdodlar zanjiri">
      {crumbs.map((crumb) => (
        <button
          key={crumb.id}
          type="button"
          className={[styles.crumb, crumb.current ? styles.crumbCurrent : '']
            .filter(Boolean)
            .join(' ')}
          aria-current={crumb.current ? 'true' : undefined}
          onClick={() => onSelect(crumb.id)}
        >
          {crumb.relation ? <span className={styles.crumbRel}>{crumb.relation}</span> : null}
          {crumb.name}
        </button>
      ))}
    </nav>
  );
}

export const Breadcrumbs = memo(BreadcrumbsImpl);

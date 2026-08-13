import type { ReactNode } from 'react';
import styles from './ui.module.css';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: EmptyStateProps): JSX.Element {
  return (
    <div className={[styles.empty, className].filter(Boolean).join(' ')}>
      <div className={styles.emptyTitle}>{title}</div>
      {description ? <div className={styles.emptyText}>{description}</div> : null}
      {action ? <div style={{ marginTop: 14 }}>{action}</div> : null}
    </div>
  );
}

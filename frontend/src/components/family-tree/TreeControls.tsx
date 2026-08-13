import { useEffect, useRef, type ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';
import type { TreeCamera } from '@/features/family-tree/hooks/useTreeCamera';
import styles from './tree.module.css';

interface TreeControlsProps {
  camera: TreeCamera;
  homeLabel: string;
  showHomeLabel: boolean;
  onFit(): void;
  onHome(): void;
  onExpandAll(): void;
  onCollapseAll(): void;
  /** Yig'ilgan shox bormi — yo'q bo'lsa "ochish" tugmasi so'nadi. */
  canExpandAll: boolean;
  /** Ochiq shox bormi — yo'q bo'lsa "yig'ish" tugmasi so'nadi. */
  canCollapseAll: boolean;
  bottom: number | string;
  minimap?: ReactNode;
  labels: {
    zoomIn: string;
    zoomOut: string;
    fit: string;
    home: string;
    expandAll: string;
    collapseAll: string;
  };
}

/** Zoom, shoxlarni ochish/yig'ish, "butun daraxt" va "menga qaytish" boshqaruvlari. */
export function TreeControls({
  camera,
  homeLabel,
  showHomeLabel,
  onFit,
  onHome,
  onExpandAll,
  onCollapseAll,
  canExpandAll,
  canCollapseAll,
  bottom,
  minimap,
  labels,
}: TreeControlsProps): JSX.Element {
  const zoomRef = useRef<HTMLDivElement>(null);

  useEffect(
    () =>
      camera.subscribe((state) => {
        if (zoomRef.current) zoomRef.current.textContent = `${Math.round(state.k * 100)}%`;
      }),
    [camera],
  );

  return (
    <div className={styles.controls} style={{ bottom }}>
      {minimap}
      <div className={styles.zoomGroup}>
        <button
          type="button"
          className={styles.zoomButton}
          aria-label={labels.zoomIn}
          onClick={() => camera.zoomIn()}
        >
          <Icon name="plus" size={15} />
        </button>
        <div ref={zoomRef} className={styles.zoomValue} aria-live="off">
          100%
        </div>
        <button
          type="button"
          className={styles.zoomButton}
          aria-label={labels.zoomOut}
          onClick={() => camera.zoomOut()}
        >
          <Icon name="minus" size={15} />
        </button>
      </div>

      <div className={styles.branchGroup}>
        <button
          type="button"
          className={styles.branchButton}
          aria-label={labels.expandAll}
          title={`${labels.expandAll} (E)`}
          disabled={!canExpandAll}
          onClick={onExpandAll}
        >
          <Icon name="expand-all" size={16} />
        </button>
        <button
          type="button"
          className={styles.branchButton}
          aria-label={labels.collapseAll}
          title={`${labels.collapseAll} (C)`}
          disabled={!canCollapseAll}
          onClick={onCollapseAll}
        >
          <Icon name="collapse-all" size={16} />
        </button>
      </div>

      <button
        type="button"
        className={styles.controlButton}
        aria-label={labels.fit}
        title={`${labels.fit} (F)`}
        onClick={onFit}
      >
        <Icon name="fit" size={16} />
      </button>

      <button
        type="button"
        className={styles.homeButton}
        aria-label={labels.home}
        title={`${labels.home} (0)`}
        onClick={onHome}
      >
        <span className={styles.homeDot} />
        {showHomeLabel ? <span>{homeLabel}</span> : null}
      </button>
    </div>
  );
}

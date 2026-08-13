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
  bottom: number | string;
  minimap?: ReactNode;
  labels: {
    zoomIn: string;
    zoomOut: string;
    fit: string;
    home: string;
  };
}

/** Zoom, "butun daraxt" va "menga qaytish" boshqaruvlari. */
export function TreeControls({
  camera,
  homeLabel,
  showHomeLabel,
  onFit,
  onHome,
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

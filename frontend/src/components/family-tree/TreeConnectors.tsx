import { memo } from 'react';
import type { ConnectorModel } from '@/features/family-tree/lib/nodes';
import styles from './tree.module.css';

interface TreeConnectorsProps {
  width: number;
  height: number;
  links: readonly ConnectorModel[];
  glow: readonly ConnectorModel[];
  dimmed: boolean;
}

/**
 * Bog'lovchi chiziqlar SVG'da: har bir ota uchun bitta yo'l, tanlangan
 * odamgacha bo'lgan zanjir esa uch qatlamli yorqin chiziq bilan.
 */
function TreeConnectorsImpl({
  width,
  height,
  links,
  glow,
  dimmed,
}: TreeConnectorsProps): JSX.Element {
  return (
    <svg className={styles.linkLayer} width={width} height={height} aria-hidden="true">
      <g className={dimmed ? styles.linkDimmed : undefined}>
        {links.map((link) => (
          <path key={link.key} className={styles.link} d={link.d} />
        ))}
      </g>
      {glow.map((link) => (
        <g key={link.key} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={link.d} stroke="var(--color-accent)" strokeWidth={18} opacity={0.24} />
          <path d={link.d} stroke="var(--color-accent-400)" strokeWidth={9} opacity={0.55} />
          <path d={link.d} stroke="var(--glow-core)" strokeWidth={5.4} />
        </g>
      ))}
    </svg>
  );
}

export const TreeConnectors = memo(TreeConnectorsImpl);

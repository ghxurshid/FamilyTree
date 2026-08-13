import type { CSSProperties } from 'react';
import styles from './ui.module.css';

interface AvatarProps {
  initials: string;
  tone: string;
  size: number;
  bordered?: boolean;
  className?: string;
}

/** Bosh harf doirasi — jins ohangida. */
export function Avatar({
  initials,
  tone,
  size,
  bordered = false,
  className,
}: AvatarProps): JSX.Element {
  const style = {
    '--tone': tone,
    width: size,
    height: size,
    fontSize: Math.max(10, Math.round(size * 0.37 * 10) / 10),
  } as CSSProperties;

  return (
    <span
      aria-hidden="true"
      className={[styles.avatar, bordered ? styles.avatarBordered : '', className]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      {initials}
    </span>
  );
}

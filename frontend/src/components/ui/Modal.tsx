import { useEffect, useRef, type ReactNode } from 'react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import styles from './ui.module.css';

interface ModalProps {
  open: boolean;
  onClose(): void;
  label: string;
  width?: number;
  align?: 'center' | 'top';
  children: ReactNode;
  className?: string;
}

/** Fokusni ushlab turuvchi, Esc bilan yopiladigan modal. */
export function Modal({
  open,
  onClose,
  label,
  width = 400,
  align = 'center',
  children,
  className,
}: ModalProps): JSX.Element | null {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      className={styles.backdrop}
      style={
        align === 'top'
          ? { alignItems: 'flex-start', padding: '9vh 16px 16px', zIndex: 'var(--z-search)' }
          : { zIndex: 'var(--z-auth)' }
      }
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={[styles.modal, className].filter(Boolean).join(' ')}
        style={{ width: `min(${width}px, 100%)` }}
      >
        {children}
      </div>
    </div>
  );
}

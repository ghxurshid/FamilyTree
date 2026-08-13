import { toast as toastApi, useToasts } from '@/stores/toastStore';
import styles from './ui.module.css';

const KIND_CLASS = {
  ok: '',
  warn: styles.toastWarn,
  error: styles.toastError,
} as const;

/** Markazlashgan xabar oynasi — barcha muvaffaqiyat/xato bildirishnomalari. */
export function Toaster(): JSX.Element | null {
  const toasts = useToasts();
  if (!toasts.length) return null;

  return (
    <div className={styles.toastStack} role="status" aria-live="polite">
      {toasts.map((item) => (
        <div
          key={item.id}
          className={[styles.toast, KIND_CLASS[item.kind]].filter(Boolean).join(' ')}
          onClick={() => toastApi.dismiss(item.id)}
        >
          <span className={styles.toastDot} />
          <span>{item.text}</span>
        </div>
      ))}
    </div>
  );
}

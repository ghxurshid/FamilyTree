import styles from './ui.module.css';

interface SwitchRowProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange(next: boolean): void;
}

export function SwitchRow({
  label,
  description,
  checked,
  onChange,
}: SwitchRowProps): JSX.Element {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={styles.switchRow}
      onClick={() => onChange(!checked)}
    >
      <span>
        <span className={styles.switchLabel}>{label}</span>
        {description ? <span className={styles.switchSub}>{description}</span> : null}
      </span>
      <span
        aria-hidden="true"
        className={[styles.switch, checked ? styles.switchOn : ''].filter(Boolean).join(' ')}
      >
        <span className={styles.switchKnob} />
      </span>
    </button>
  );
}

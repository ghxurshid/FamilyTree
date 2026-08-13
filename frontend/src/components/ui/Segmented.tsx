import styles from './ui.module.css';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  value: T;
  options: readonly SegmentedOption<T>[];
  onChange(value: T): void;
  /** Variantlar bo'shliqni teng bo'lib olsinmi. */
  stretch?: boolean;
  label: string;
  className?: string;
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  stretch = false,
  label,
  className,
}: SegmentedProps<T>): JSX.Element {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={[styles.segmented, stretch ? styles.segmentedFull : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          className={[styles.segment, option.value === value ? styles.segmentActive : '']
            .filter(Boolean)
            .join(' ')}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

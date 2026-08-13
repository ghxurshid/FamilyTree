import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import styles from './ui.module.css';

interface BaseProps {
  label: string;
  error?: string;
  className?: string;
}

type TextFieldProps = BaseProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'className'>;

export function TextField({
  label,
  error,
  className,
  ...rest
}: TextFieldProps): JSX.Element {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <label className={styles.fieldLabel} htmlFor={id}>
        {label}
      </label>
      <input
        {...rest}
        id={id}
        className={[styles.input, error ? styles.inputInvalid : ''].filter(Boolean).join(' ')}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      {error ? (
        <span className={styles.fieldError} id={errorId} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

type TextAreaProps = BaseProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'>;

export function TextArea({ label, error, className, ...rest }: TextAreaProps): JSX.Element {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <label className={styles.fieldLabel} htmlFor={id}>
        {label}
      </label>
      <textarea
        {...rest}
        id={id}
        className={[styles.input, error ? styles.inputInvalid : ''].filter(Boolean).join(' ')}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      {error ? (
        <span className={styles.fieldError} id={errorId} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

import type { InputHTMLAttributes, ReactNode } from 'react';
import { FieldError, FieldLabel, fieldClasses } from './Field';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'onChange' | 'value'> {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  /** Ajuda curta abaixo do rótulo (ex.: onde achar o CPF). */
  hint?: ReactNode;
  /** Conteúdo logo abaixo do campo (ex.: sugestão de e-mail). */
  after?: ReactNode;
}

export function TextField({ id, label, value, onChange, error, hint, after, ...rest }: Props) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  return (
    <div>
      <FieldLabel id={id}>{label}</FieldLabel>
      {hint && (
        <p id={`${id}-hint`} className="-mt-0.5 mb-1.5 text-sm text-fg-muted">
          {hint}
        </p>
      )}
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={fieldClasses(!!error)}
        {...rest}
      />
      {after}
      <FieldError id={id} message={error} />
    </div>
  );
}

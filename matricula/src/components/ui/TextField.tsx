import type { InputHTMLAttributes } from 'react';
import { FieldError, FieldLabel, fieldClasses } from './Field';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'onChange' | 'value'> {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function TextField({ id, label, value, onChange, error, ...rest }: Props) {
  return (
    <div>
      <FieldLabel id={id}>{label}</FieldLabel>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={fieldClasses(!!error)}
        {...rest}
      />
      <FieldError id={id} message={error} />
    </div>
  );
}

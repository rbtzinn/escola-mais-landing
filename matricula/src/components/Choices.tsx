import clsx from 'clsx';
import { Icon } from '@/components/icons';
import { FieldError } from '@/components/ui/Field';

interface GroupProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  /** Opções curtas (A+, PP) ficam lado a lado; longas, uma por linha. */
  compact?: boolean;
}

/** Grupo de opções com legenda: rádios ou caixas de marcar, desenhados como botões grandes. */
export function ChoiceFieldset({ id, label, hint, error, children, compact }: GroupProps) {
  return (
    <fieldset
      id={id}
      tabIndex={-1}
      aria-describedby={[hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined}
      aria-invalid={error ? true : undefined}
      className="min-w-0 outline-none"
    >
      <legend className="mb-1.5 text-sm font-semibold">{label}</legend>
      {hint && (
        <p id={`${id}-hint`} className="-mt-0.5 mb-2 text-sm text-fg-muted">
          {hint}
        </p>
      )}
      <div className={clsx('flex gap-2', compact ? 'flex-wrap' : 'flex-col sm:flex-row sm:flex-wrap')}>
        {children}
      </div>
      <FieldError id={id} message={error} />
    </fieldset>
  );
}

interface OptionProps {
  name: string;
  type: 'radio' | 'checkbox';
  label: string;
  checked: boolean;
  onChange: () => void;
  invalid?: boolean;
}

/** Uma opção: o input real fica escondido visualmente, mas é ele que recebe foco e teclado. */
export function ChoiceOption({ name, type, label, checked, onChange, invalid }: OptionProps) {
  return (
    <label
      className={clsx(
        'relative flex min-h-12 items-center gap-2.5 rounded-xl border-2 px-4 py-2.5 text-[0.98rem] leading-snug font-medium transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
        checked
          ? 'border-primary bg-primary text-on-primary'
          : clsx('bg-surface hover:border-fg', invalid ? 'border-danger' : 'border-fg/25'),
      )}
    >
      <input
        type={type}
        name={name}
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={clsx(
          'flex size-5 shrink-0 items-center justify-center border-2',
          type === 'radio' ? 'rounded-full' : 'rounded-md',
          checked ? 'border-on-primary bg-on-primary text-primary' : 'border-fg/40',
        )}
      >
        {checked && <Icon name="check" size={14} strokeWidth={3} />}
      </span>
      {label}
    </label>
  );
}

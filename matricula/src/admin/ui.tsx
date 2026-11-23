import clsx from 'clsx';
import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Icon, type IconName } from '@/components/icons';
import { useTheme } from '@/hooks/useTheme';

type Variant = 'primary' | 'ghost' | 'danger' | 'pink';

export function Button({
  variant = 'primary',
  icon,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; icon?: IconName }) {
  return (
    <button
      type="button"
      className={clsx(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 font-semibold transition disabled:opacity-60',
        variant === 'primary' && 'bg-primary text-on-primary hover:brightness-110',
        variant === 'pink' &&
          'bg-pink font-display text-lg font-extrabold text-cream hover:brightness-110',
        variant === 'ghost' && 'border-2 border-fg/25 hover:border-fg',
        variant === 'danger' && 'border-2 border-danger/60 text-danger hover:bg-danger/10',
        className,
      )}
      {...rest}
    >
      {icon && <Icon name={icon} size={18} />}
      {children}
    </button>
  );
}

export function Card({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx('rounded-2xl border-2 border-fg/15 bg-surface p-4 sm:p-5', className)}>
      {(title || action) && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="font-display text-2xl font-extrabold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** Aviso que o leitor de tela anuncia. Vazio, não ocupa espaço. */
export function Notice({ tone = 'ok', children }: { tone?: 'ok' | 'error'; children?: ReactNode }) {
  return (
    <div role="status" aria-live="polite">
      {children && (
        <p
          className={clsx(
            'flex items-start gap-2 rounded-xl border-2 px-4 py-3 font-semibold',
            tone === 'error' ? 'border-danger/50 bg-danger/10' : 'border-ok/50 bg-ok/10',
          )}
        >
          <Icon
            name={tone === 'error' ? 'alert' : 'check'}
            size={20}
            className={clsx('mt-0.5 shrink-0', tone === 'error' ? 'text-danger' : 'text-ok')}
          />
          <span>{children}</span>
        </p>
      )}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={clsx(
        'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-sm font-bold',
        status === 'Pendente' && 'bg-accent text-on-accent',
        status === 'Cancelado' && 'bg-fg/15 text-fg-muted line-through',
        status !== 'Pendente' && status !== 'Cancelado' && 'bg-ok text-cream',
      )}
    >
      {status}
    </span>
  );
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={theme === 'dark'}
      aria-label="Modo escuro"
      className="flex size-11 items-center justify-center rounded-full text-cream hover:bg-cream/15"
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
    </button>
  );
}

/** Confirmação na própria tela (sem confirm()): o primeiro clique pergunta, o segundo faz. */
export function ConfirmButton({
  label,
  confirm,
  onConfirm,
  disabled,
}: {
  label: string;
  confirm: string;
  onConfirm: () => void;
  disabled?: boolean;
}) {
  const [asking, setAsking] = useState(false);
  if (!asking)
    return (
      <Button variant="danger" icon="trash" onClick={() => setAsking(true)} disabled={disabled}>
        {label}
      </Button>
    );
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="text-sm font-semibold">{confirm}</span>
      <Button
        variant="danger"
        onClick={() => {
          setAsking(false);
          onConfirm();
        }}
      >
        Sim
      </Button>
      <Button variant="ghost" onClick={() => setAsking(false)}>
        Não
      </Button>
    </span>
  );
}

/** Hoje + n dias em dd/mm/aaaa. */
export function plusDays(n: number, from = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + n);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

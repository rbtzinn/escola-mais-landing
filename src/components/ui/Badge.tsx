import clsx from 'clsx';

/** Selo discreto usado para marcar conteúdo fictício ("Exemplo", "Ilustrativo"). */
export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'accent';
  className?: string;
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide',
        tone === 'accent'
          ? 'bg-accent text-on-accent'
          : 'border border-border bg-surface text-fg-muted',
        className,
      )}
    >
      {children}
    </span>
  );
}

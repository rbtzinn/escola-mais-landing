import clsx from 'clsx';

/** Carimbo discreto usado para marcar conteúdo fictício ("Exemplo", "Ilustrativo"). */
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
        'inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-[0.7rem] font-medium tracking-wide whitespace-nowrap',
        tone === 'accent'
          ? 'border-transparent bg-accent text-on-accent'
          : 'border-border bg-surface text-fg-muted',
        className,
      )}
    >
      {children}
    </span>
  );
}

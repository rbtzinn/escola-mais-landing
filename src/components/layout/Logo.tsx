import clsx from 'clsx';

/** Marca do Escola+: a palavra em grotesca pesada, na cor do texto ao redor. */
export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-baseline font-sans text-[1.75rem] leading-none font-bold tracking-[-0.02em]',
        className,
      )}
    >
      Escola<span aria-hidden="true">+</span>
      <span className="sr-only">mais</span>
    </span>
  );
}

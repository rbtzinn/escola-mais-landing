import clsx from 'clsx';

/** Marca do Escola+: a palavra em serifa e o "+" em um quadradinho, como um expoente. */
export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-start gap-1 font-display text-[1.7rem] leading-none font-semibold',
        className,
      )}
    >
      Escola
      <svg width="15" height="15" viewBox="0 0 15 15" aria-hidden="true" className="mt-0.5">
        <rect width="15" height="15" rx="2" fill="var(--primary)" />
        <path d="M7.5 3.6v7.8M3.6 7.5h7.8" stroke="var(--on-primary)" strokeWidth="2" />
      </svg>
      <span className="sr-only">+</span>
    </span>
  );
}

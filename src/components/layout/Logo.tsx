import clsx from 'clsx';

/** Marca do Escola+: símbolo geométrico (arco de escola com sinal de mais) e wordmark. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={clsx('inline-flex items-center gap-2.5', className)}>
      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
        <rect width="34" height="34" rx="9" fill="var(--primary)" />
        <path
          d="M7 15 17 8l10 7v11H7z"
          fill="none"
          stroke="var(--on-primary)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M17 17.5v6M14 20.5h6"
          stroke="var(--accent)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
      <span className="font-display text-xl font-extrabold">
        Escola<span className="text-secondary">+</span>
      </span>
    </span>
  );
}

import clsx from 'clsx';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

const base =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 py-2.5 text-[0.95rem] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60';

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary hover:brightness-110',
  secondary: 'border border-border bg-surface text-fg hover:border-primary hover:text-primary',
  ghost: 'text-fg hover:bg-muted',
};

export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={clsx(base, variants[variant], className)} {...props} />;
}

export function ButtonLink({
  variant = 'primary',
  className,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant }) {
  return <a className={clsx(base, variants[variant], className)} {...props} />;
}

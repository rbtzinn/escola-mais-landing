import clsx from 'clsx';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'whatsapp';
type Size = 'md' | 'sm';

const base =
  'inline-flex items-center justify-center gap-2 rounded-md font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-60';

const sizes: Record<Size, string> = {
  md: 'min-h-11 px-6 py-2.5 text-[0.95rem]',
  sm: 'min-h-10 px-4 py-2 text-sm',
};

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary hover:brightness-110',
  secondary: 'border border-fg/35 bg-surface text-fg hover:border-fg hover:bg-muted',
  ghost: 'text-fg hover:bg-muted',
  whatsapp: 'bg-whatsapp text-on-whatsapp hover:brightness-95',
};

/** Classes do botão, para aplicar em outros elementos (ex.: o Link do Next, que não recarrega a página). */
export const buttonClasses = (
  variant: Variant = 'primary',
  className?: string,
  size: Size = 'md',
) => clsx(base, sizes[size], variants[variant], className);

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClasses(variant, className, size)} {...props} />;
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant; size?: Size }) {
  return <a className={buttonClasses(variant, className, size)} {...props} />;
}

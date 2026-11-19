'use client';

import clsx from 'clsx';
import { Icon } from '@/components/icons';
import { useTheme } from '@/hooks/useTheme';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      aria-label="Modo escuro"
      className={clsx(
        'flex size-11 items-center justify-center rounded-full transition-colors',
        className ?? 'hover:bg-muted',
      )}
    >
      <Icon name={dark ? 'sun' : 'moon'} />
    </button>
  );
}

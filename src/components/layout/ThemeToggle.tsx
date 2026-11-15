'use client';

import { Icon } from '@/components/icons';
import { useTheme } from '@/hooks/useTheme';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      aria-label="Modo escuro"
      className="flex size-11 items-center justify-center rounded-full transition-colors hover:bg-muted"
    >
      <Icon name={dark ? 'sun' : 'moon'} />
    </button>
  );
}

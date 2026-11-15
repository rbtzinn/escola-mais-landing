'use client';

import { useCallback, useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';

const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

/** Tema atual (definido antes da pintura pelo script do layout) e função para alternar. */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => 'light' as Theme);

  const setTheme = useCallback((next: Theme) => {
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('theme', next);
    } catch {
      // Armazenamento indisponível (modo privado): a escolha vale só nesta visita.
    }
    listeners.forEach((l) => l());
  }, []);

  const toggle = useCallback(
    () => setTheme(getSnapshot() === 'dark' ? 'light' : 'dark'),
    [setTheme],
  );

  return { theme, setTheme, toggle };
}

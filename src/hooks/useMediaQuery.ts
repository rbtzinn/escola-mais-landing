'use client';

import { useSyncExternalStore } from 'react';

const MOBILE_QUERY = '(max-width: 639px)';

function subscribe(cb: () => void) {
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

/**
 * Verdadeiro em telas de celular (menos de 640 px). No servidor retorna falso;
 * o cliente corrige na hidratação sem gerar erro.
 */
export function useIsMobile(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false,
  );
}

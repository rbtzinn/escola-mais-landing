'use client';

import { useSyncExternalStore } from 'react';
import { type DemoState, demoStore } from '@/lib/demoStore';

/** Lê o estado da demo (escola, registros de atraso, relógio) e re-renderiza quando muda. */
export function useDemoStore(): DemoState {
  return useSyncExternalStore(demoStore.subscribe, demoStore.get, demoStore.getServer);
}

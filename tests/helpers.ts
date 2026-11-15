import { afterEach } from 'vitest';

const original = window.matchMedia;

/** Simula uma tela de celular (< 640 px) no jsdom; restaurado após cada teste. */
export function mockMobile() {
  window.matchMedia = ((query: string) =>
    ({
      matches: query.includes('max-width'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
      onchange: null,
    }) as MediaQueryList) as typeof window.matchMedia;
}

afterEach(() => {
  window.matchMedia = original;
});

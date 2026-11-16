import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { demoStore } from '@/lib/demoStore';

afterEach(() => cleanup());
// O estado da demo vive em memória (módulo): zera entre os testes.
afterEach(() => demoStore.reset());
// O link do aluno lembra quem entrou neste celular (localStorage): esquece entre os testes.
afterEach(() => window.localStorage.clear());

// jsdom não implementa estes recursos usados pelos componentes.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
      onchange: null,
    }) as MediaQueryList;
}
Element.prototype.scrollIntoView = Element.prototype.scrollIntoView || (() => {});

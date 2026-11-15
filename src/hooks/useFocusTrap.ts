'use client';

import { useEffect, type RefObject } from 'react';

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Prende o foco dentro do container enquanto ativo, bloqueia o scroll do body,
 * fecha com Esc e devolve o foco ao elemento que o tinha antes.
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  onEscape: () => void,
) {
  useEffect(() => {
    if (!active) return;
    const container = ref.current;
    if (!container) return;
    const previous = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const items = () => Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
    (items()[0] ?? container).focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onEscape();
        return;
      }
      if (e.key !== 'Tab') return;
      const list = items();
      if (list.length === 0) {
        e.preventDefault();
        return;
      }
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      previous?.focus?.();
    };
    // onEscape é lido via closure atual a cada abertura; reexecutar fecharia o foco.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, ref]);
}

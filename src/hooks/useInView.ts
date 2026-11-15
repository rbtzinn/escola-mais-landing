'use client';

import { useEffect, useState, type RefObject } from 'react';

interface Options {
  once?: boolean;
  rootMargin?: string;
}

/** Informa se o elemento está visível na viewport (IntersectionObserver). */
export function useInView<T extends Element>(
  ref: RefObject<T | null>,
  { once = true, rootMargin = '0px 0px -10% 0px' }: Options = {},
): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Navegadores sem IntersectionObserver (muito antigos) ficam sem a animação de entrada.
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { rootMargin, threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, once, rootMargin]);

  return inView;
}

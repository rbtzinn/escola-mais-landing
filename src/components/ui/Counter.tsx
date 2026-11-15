'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from '@/hooks/useInView';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

interface Props {
  to: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  durationMs?: number;
  className?: string;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/** Contador animado ao entrar na tela. Com movimento reduzido, mostra o valor final direto. */
export function Counter({
  to,
  prefix = '',
  suffix = '',
  decimals = 0,
  durationMs = 1400,
  className,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref);
  const reduced = usePrefersReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView || reduced) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / durationMs, 1);
      setValue(to * easeOutCubic(p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduced, to, durationMs]);

  const nf = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const final = `${prefix}${nf.format(to)}${suffix}`;
  const shown = reduced ? to : value;

  return (
    <span ref={ref} className={className} aria-label={final} role="text">
      <span aria-hidden="true">{`${prefix}${nf.format(shown)}${suffix}`}</span>
    </span>
  );
}

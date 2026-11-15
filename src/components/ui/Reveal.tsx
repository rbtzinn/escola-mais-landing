'use client';

import clsx from 'clsx';
import { useRef, type CSSProperties } from 'react';
import { useInView } from '@/hooks/useInView';

/** Faz o conteúdo surgir suavemente ao entrar na tela. Sem movimento se o usuário preferir. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref);
  return (
    <div
      ref={ref}
      className={clsx('reveal', className)}
      data-visible={visible}
      style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}

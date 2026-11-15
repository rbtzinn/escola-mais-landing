'use client';

import clsx from 'clsx';
import { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@/components/icons';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface Props {
  title: string;
  onClose: () => void;
  /** `top` deixa o painel mais para cima, para o teclado do celular não cobrir a lista. */
  align?: 'center' | 'top';
  /** Seletor CSS do elemento que recebe o foco ao abrir. */
  initialFocus?: string;
  children: React.ReactNode;
}

/**
 * Painel de escolha para celulares: caixa no centro da tela com o fundo embaçado.
 * Fecha com o botão X, tocando no fundo ou com Esc; prende o foco enquanto aberto.
 */
export function PickerPanel(props: Props) {
  if (typeof document === 'undefined') return null;
  return createPortal(<Panel {...props} />, document.body);
}

function Panel({ title, onClose, align = 'center', initialFocus, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useFocusTrap(ref, true, onClose, initialFocus);

  return (
    <div
      className={clsx(
        'fade-in fixed inset-0 z-[90] flex justify-center bg-black/50 p-4 backdrop-blur-sm',
        align === 'top' ? 'items-start pt-[10vh]' : 'items-center',
      )}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[70dvh] w-full max-w-sm flex-col rounded-2xl border border-border bg-surface text-fg shadow-card"
      >
        <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-2">
          <h2 id={titleId} className="font-display text-lg font-extrabold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="-mr-2 flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-muted"
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col pb-2">{children}</div>
      </div>
    </div>
  );
}

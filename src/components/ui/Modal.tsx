'use client';

import clsx from 'clsx';
import { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@/components/icons';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Linha curta sob o título (ex.: a turma do aluno). */
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  /** Botões fixos no rodapé, alinhados à direita. */
  footer?: React.ReactNode;
  /**
   * `center`: caixa no centro (no celular, sobe de baixo).
   * `side`: painel à direita na altura toda, para fichas (no celular, sobe de baixo).
   */
  variant?: 'center' | 'side';
  size?: 'md' | 'lg';
}

/** Modal acessível: portal, foco preso, Esc e clique no fundo fecham, devolve o foco ao gatilho. */
export function Modal({ open, ...rest }: Props) {
  if (!open || typeof document === 'undefined') return null;
  return createPortal(<ModalContent {...rest} />, document.body);
}

function ModalContent({
  onClose,
  title,
  subtitle,
  children,
  footer,
  variant = 'center',
  size = 'md',
}: Omit<Props, 'open'>) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useFocusTrap(ref, true, onClose);
  const side = variant === 'side';

  return (
    <div
      className={clsx(
        'fade-in fixed inset-0 z-[90] flex items-end justify-center bg-black/60',
        side ? 'sm:items-stretch sm:justify-end' : 'sm:items-center sm:p-6',
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
        tabIndex={-1}
        className={clsx(
          'sheet-enter flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-surface text-fg shadow-card',
          size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-lg',
          side
            ? 'sheet-enter-side sm:max-h-none sm:rounded-none sm:rounded-l-3xl'
            : 'sm:max-h-[88vh] sm:rounded-3xl',
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 id={titleId} className="font-display text-xl font-extrabold sm:text-2xl">
              {title}
            </h2>
            {subtitle && <div className="mt-0.5 text-sm text-fg-muted">{subtitle}</div>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="-mt-1 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-full text-fg-muted hover:bg-muted hover:text-fg"
          >
            <Icon name="close" />
          </button>
        </header>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 leading-relaxed text-fg-muted sm:px-6">
          {children}
        </div>
        {footer && (
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-surface px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}

'use client';

import { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@/components/icons';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

/** Modal acessível: portal, foco preso, Esc e clique no fundo fecham, devolve o foco ao gatilho. */
export function Modal({ open, onClose, title, children }: Props) {
  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <ModalContent onClose={onClose} title={title}>
      {children}
    </ModalContent>,
    document.body,
  );
}

function ModalContent({ onClose, title, children }: Omit<Props, 'open'>) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useFocusTrap(ref, true, onClose);

  return (
    <div
      className="fade-in fixed inset-0 z-[90] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-6"
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
        className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-t-3xl bg-surface p-6 text-fg shadow-card sm:rounded-3xl sm:p-8"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id={titleId} className="font-display text-2xl font-extrabold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="-mt-1 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-muted"
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="space-y-3 leading-relaxed text-fg-muted">{children}</div>
      </div>
    </div>
  );
}

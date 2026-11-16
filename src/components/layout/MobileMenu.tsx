'use client';

import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/Button';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { NAV_LINKS } from '@/data/content';

/**
 * Painel de navegação do celular: foco preso, Esc fecha, devolve o foco ao botão do menu.
 * Renderizado no body: dentro do header, o backdrop-blur prenderia o `fixed` à altura dele.
 */
export function MobileMenu({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, true, onClose);

  return createPortal(
    <div
      ref={ref}
      id="menu-mobile"
      role="dialog"
      aria-modal="true"
      aria-label="Menu de navegação"
      tabIndex={-1}
      className="fade-in fixed inset-0 z-[60] flex flex-col bg-bg px-5 py-4 md:hidden"
    >
      <div className="flex items-center justify-between">
        <span className="eyebrow text-fg-muted">Menu</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar menu"
          className="flex size-11 items-center justify-center rounded-md hover:bg-muted"
        >
          <Icon name="close" />
        </button>
      </div>
      <nav aria-label="Seções da página" className="mt-6 flex flex-col border-t border-fg">
        {NAV_LINKS.map((l) => (
          <a
            key={l.href}
            href={l.href}
            onClick={onClose}
            className="flex min-h-16 items-center border-b border-fg/20 font-display text-2xl font-medium"
          >
            {l.label}
          </a>
        ))}
      </nav>
      <ButtonLink href="/#demonstracao" onClick={onClose} className="mt-8">
        Solicitar demonstração
      </ButtonLink>
    </div>,
    document.body,
  );
}

'use client';

import { useRef } from 'react';
import { Icon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/Button';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { NAV_LINKS } from '@/data/content';

/** Painel de navegação do celular: foco preso, Esc fecha, devolve o foco ao botão do menu. */
export function MobileMenu({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, true, onClose);

  return (
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
        <span className="font-display text-xl font-extrabold">Menu</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar menu"
          className="flex size-11 items-center justify-center rounded-full hover:bg-muted"
        >
          <Icon name="close" />
        </button>
      </div>
      <nav aria-label="Seções da página" className="mt-6 flex flex-col">
        {NAV_LINKS.map((l) => (
          <a
            key={l.href}
            href={l.href}
            onClick={onClose}
            className="flex min-h-14 items-center border-b border-border text-lg font-semibold"
          >
            {l.label}
          </a>
        ))}
      </nav>
      <ButtonLink href="#demonstracao" onClick={onClose} className="mt-8">
        Solicitar demonstração
      </ButtonLink>
    </div>
  );
}

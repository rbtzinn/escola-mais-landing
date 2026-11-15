'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { NAV_LINKS } from '@/data/content';
import { Logo } from './Logo';
import { MobileMenu } from './MobileMenu';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={clsx(
        'sticky top-0 z-50 transition-[background-color,box-shadow,border-color] duration-200',
        scrolled ? 'border-b border-border bg-bg/95 backdrop-blur' : 'border-b border-transparent',
      )}
    >
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="Escola+, ir para o início" className="rounded-lg">
          <Logo />
        </Link>
        <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-3.5 py-2 text-sm font-semibold text-fg-muted transition-colors hover:bg-muted hover:text-fg"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <ButtonLink href="/#demonstracao" className="!min-h-10 !px-5 !py-2 text-sm max-sm:hidden">
            Solicitar demonstração
          </ButtonLink>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu"
            aria-expanded={menuOpen}
            aria-controls="menu-mobile"
            className="flex size-11 items-center justify-center rounded-full hover:bg-muted md:hidden"
          >
            <Icon name="menu" />
          </button>
        </div>
      </Container>
      {menuOpen && <MobileMenu onClose={() => setMenuOpen(false)} />}
    </header>
  );
}

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
        'sticky top-0 z-50 border-b transition-[background-color,border-color] duration-200',
        scrolled ? 'border-fg/25 bg-bg/95 backdrop-blur' : 'border-transparent',
      )}
    >
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="Escola+, ir para o início" className="rounded-sm">
          <Logo />
        </Link>
        <nav aria-label="Principal" className="hidden items-center gap-6 md:flex lg:gap-7">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="py-2 text-[0.95rem] text-fg-muted decoration-accent decoration-2 underline-offset-[6px] transition-colors hover:text-fg hover:underline"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <ButtonLink href="/#demonstracao" size="sm" className="max-sm:hidden">
            Solicitar demonstração
          </ButtonLink>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu"
            aria-expanded={menuOpen}
            aria-controls="menu-mobile"
            className="flex size-11 items-center justify-center rounded-md hover:bg-muted md:hidden"
          >
            <Icon name="menu" />
          </button>
        </div>
      </Container>
      {menuOpen && <MobileMenu onClose={() => setMenuOpen(false)} />}
    </header>
  );
}

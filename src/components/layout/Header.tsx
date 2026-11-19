'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  // Na landing, o cabeçalho flutua sobre o topo rosa e azul, em creme; ao rolar, ganha fundo azul.
  const home = usePathname() === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={clsx(
        'top-0 z-50 border-b transition-[background-color,border-color] duration-200',
        home ? 'fixed inset-x-0 text-cream' : 'sticky',
        home
          ? scrolled
            ? 'border-cream/20 bg-blue'
            : 'border-transparent'
          : scrolled
            ? 'border-fg/25 bg-bg/95 backdrop-blur'
            : 'border-transparent',
      )}
    >
      <Container
        className={clsx(
          'flex h-16 items-center justify-between gap-4',
          home && 'max-w-none sm:px-8 lg:h-20 lg:px-[2.9vw]',
        )}
      >
        <Link href="/" aria-label="Escola+, ir para o início" className="rounded-sm">
          <Logo />
        </Link>
        <nav
          aria-label="Principal"
          className={clsx(
            'hidden items-center gap-6 lg:gap-7',
            home ? 'lg:ml-auto lg:flex lg:gap-[2.2vw]' : 'md:flex',
          )}
        >
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={clsx(
                'py-2 decoration-2 underline-offset-[6px] transition-colors hover:underline',
                home
                  ? 'font-display text-[1.15rem] font-bold text-cream decoration-pink lg:text-[1.3vw]'
                  : 'text-[0.95rem] text-fg-muted decoration-accent hover:text-fg',
              )}
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          <ThemeToggle className={home ? 'hover:bg-cream/15' : undefined} />
          {home ? (
            <Link
              href="/demo"
              className="ml-2 inline-flex min-h-11 items-center rounded-full border-2 border-cream px-5 font-display text-[1.1rem] font-bold whitespace-nowrap text-cream transition-colors hover:bg-cream hover:text-blue max-sm:hidden lg:text-[1.3vw]"
            >
              Testar com minha planilha
            </Link>
          ) : (
            <ButtonLink href="/#demonstracao" size="sm" className="max-sm:hidden">
              Solicitar demonstração
            </ButtonLink>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu"
            aria-expanded={menuOpen}
            aria-controls="menu-mobile"
            className={clsx(
              'flex size-11 items-center justify-center rounded-md',
              home ? 'lg:hidden' : 'md:hidden',
              home ? 'hover:bg-cream/15' : 'hover:bg-muted',
            )}
          >
            <Icon name="menu" />
          </button>
        </div>
      </Container>
      {menuOpen && <MobileMenu onClose={() => setMenuOpen(false)} />}
    </header>
  );
}

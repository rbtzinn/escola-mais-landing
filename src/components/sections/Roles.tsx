import clsx from 'clsx';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';

const ROLES = [
  { label: 'Professor', href: '/demo/dia/chamada', className: 'bg-green text-ink -rotate-2' },
  { label: 'Portaria', href: '/demo/dia/portaria', className: 'bg-blue text-cream rotate-1' },
  { label: 'Cozinha', href: '/demo/dia/merenda', className: 'bg-pink text-cream -rotate-1' },
  { label: 'Coordenação', href: '/demo/dia/coordenacao', className: 'bg-yellow text-ink rotate-1' },
];

/** Faixa logo abaixo do topo: cada pessoa da escola tem a sua tela, e cada crachá abre a dela. */
export function Roles() {
  return (
    <section aria-labelledby="telas-titulo" className="paper-cream border-y-2 border-line">
      <Container className="flex flex-col gap-6 py-8 lg:max-w-none lg:flex-row lg:items-center lg:justify-between lg:px-[3.6vw] lg:py-[1.9vw]">
        <h2
          id="telas-titulo"
          className="font-display text-[2.6rem] leading-[0.95] font-extrabold text-fg sm:text-6xl lg:text-[4.6vw]"
        >
          Cada pessoa na sua tela
        </h2>
        <ul className="flex flex-wrap gap-3 lg:gap-[0.6vw]">
          {ROLES.map((r) => (
            <li key={r.href}>
              <Link
                href={r.href}
                className={clsx(
                  'inline-flex min-h-12 items-center rounded-full border-2 border-ink px-5 font-display text-2xl font-extrabold transition-transform hover:-translate-y-0.5 hover:rotate-0 sm:text-3xl lg:min-h-[4.3vw] lg:px-[1.1vw] lg:text-[2.35vw]',
                  r.className,
                )}
              >
                {r.label}
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

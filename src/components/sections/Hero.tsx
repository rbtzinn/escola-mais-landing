import { Icon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { DashboardMockup } from './DashboardMockup';

export function Hero() {
  return (
    <section id="topo" aria-labelledby="hero-titulo" className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [mask-image:linear-gradient(to_bottom,black,transparent_85%)] [background-size:22px_22px] opacity-60"
      />
      <Container className="grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:py-24">
        <div>
          <Reveal>
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm font-semibold text-fg-muted">
              <Icon name="school" size={18} className="text-primary" />
              Feito para redes municipais e estaduais
            </p>
          </Reveal>
          <Reveal delay={80}>
            <h1
              id="hero-titulo"
              className="mt-6 font-display text-4xl leading-[1.08] font-extrabold text-balance sm:text-5xl lg:text-6xl"
            >
              Gestão escolar pública mais <span className="text-primary">simples</span> e{' '}
              <span className="text-secondary">transparente</span>.
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-fg-muted sm:text-xl">
              Frequência, indicadores, merenda, manutenção e prestação de contas em um só lugar, da
              sala de aula à secretaria de educação.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="#demonstracao">
                Solicitar demonstração
                <Icon name="arrow" size={20} />
              </ButtonLink>
              <ButtonLink href="#funcionalidades" variant="secondary">
                Ver funcionalidades
              </ButtonLink>
            </div>
          </Reveal>
        </div>
        <Reveal delay={200}>
          <DashboardMockup />
        </Reveal>
      </Container>
    </section>
  );
}

import { Icon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { DashboardMockup } from './DashboardMockup';

export function Hero() {
  return (
    <section id="topo" aria-labelledby="hero-titulo" className="overflow-hidden">
      <Container className="pt-6 pb-16 sm:pt-8 sm:pb-20 lg:pb-24">
        {/* Cabeçalho de documento: situa a página antes do título. */}
        <p className="eyebrow flex flex-wrap gap-x-8 gap-y-1 border-y border-fg/25 py-3 text-fg-muted">
          <span className="max-sm:hidden">Gestão escolar</span>
          <span>Para a direção e a coordenação da escola pública</span>
          <span className="max-sm:hidden sm:ml-auto">Projeto demonstrativo</span>
        </p>

        <div className="mt-10 grid items-center gap-14 sm:mt-14 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <Reveal>
              <h1
                id="hero-titulo"
                className="font-display text-[2.9rem] leading-[1] font-medium text-balance sm:text-7xl lg:text-[5.25rem]"
              >
                Sua escola <em className="text-primary">organizada</em>, sem passar o dia em{' '}
                <span className="marker">planilhas</span>.
              </h1>
            </Reveal>
            <Reveal delay={80}>
              <p className="mt-7 max-w-xl text-lg leading-relaxed text-fg-muted sm:text-xl">
                Transforme planilhas em painéis, responda aos pais com menos esforço e organize
                demandas, declarações e horários em um só lugar.
              </p>
            </Reveal>
            <Reveal delay={160}>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="#demonstracao">
                  Solicitar demonstração
                  <Icon name="arrow" size={20} />
                </ButtonLink>
                <ButtonLink href="/demo" variant="secondary">
                  Testar com sua planilha
                </ButtonLink>
              </div>
              <p className="mt-5 text-sm text-fg-muted">
                O teste aceita CSV ou Excel, não pede cadastro e lê a planilha só no seu navegador.
              </p>
            </Reveal>
          </div>
          <Reveal delay={120} className="lg:col-span-5">
            <DashboardMockup />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

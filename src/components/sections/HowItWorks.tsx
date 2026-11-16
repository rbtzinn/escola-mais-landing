import { Icon } from '@/components/icons';
import { ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { STEPS } from '@/data/content';

export function HowItWorks() {
  return (
    <section
      id="como-funciona"
      aria-labelledby="como-titulo"
      className="border-t border-fg bg-muted py-20 sm:py-28"
    >
      <Container>
        <Reveal className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            id="como-titulo"
            index="03"
            eyebrow="Como funciona"
            title="Da planilha ao painel em três passos"
          />
          <ButtonLink href="/demo" className="self-start lg:self-auto">
            Testar com a planilha da sua escola
            <Icon name="arrow" size={20} />
          </ButtonLink>
        </Reveal>
        <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <Reveal delay={i * 100} className="border-t-2 border-fg pt-4">
                <span
                  aria-hidden="true"
                  className="block font-display text-7xl leading-none font-normal text-primary italic sm:text-8xl"
                >
                  {i + 1}
                </span>
                <h3 className="mt-5 font-display text-2xl leading-tight font-medium">{s.title}</h3>
                <p className="mt-2 text-lg leading-relaxed text-fg-muted">{s.text}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

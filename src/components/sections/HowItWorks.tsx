import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { STEPS } from '@/data/content';

export function HowItWorks() {
  return (
    <section id="como-funciona" aria-labelledby="como-titulo" className="bg-muted py-20 sm:py-24">
      <Container>
        <Reveal>
          <SectionHeading
            id="como-titulo"
            eyebrow="Como funciona"
            title="Da planilha ao painel em três passos"
            align="center"
          />
        </Reveal>
        <ol className="relative mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          <div
            aria-hidden="true"
            className="absolute top-6 right-[16%] left-[16%] hidden border-t-2 border-dashed border-border md:block"
          />
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <Reveal
                delay={i * 120}
                className="relative flex gap-5 md:flex-col md:items-center md:text-center"
              >
                <span className="relative flex size-12 shrink-0 items-center justify-center rounded-full bg-primary font-display text-xl font-extrabold text-on-primary ring-8 ring-muted">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-display text-xl font-bold">{s.title}</h3>
                  <p className="mt-2 leading-relaxed text-fg-muted">{s.text}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

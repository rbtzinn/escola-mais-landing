import clsx from 'clsx';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { TESTIMONIALS } from '@/data/content';

export function Testimonials() {
  return (
    <section id="depoimentos" aria-labelledby="depoimentos-titulo" className="py-20 sm:py-28">
      <Container>
        <Reveal>
          <SectionHeading
            id="depoimentos-titulo"
            index="06"
            eyebrow="Depoimentos ilustrativos"
            title="O que gestores de escola poderiam dizer"
            description="As falas abaixo são exemplos, sem pessoas reais."
          />
        </Reveal>
        <ul className="mt-14 grid gap-x-10 border-t border-fg md:grid-cols-2">
          {TESTIMONIALS.map((t, i) => (
            <li key={t.role} className={clsx('border-b border-fg/20', i === 0 && 'md:col-span-2')}>
              <Reveal delay={i * 80} className="h-full">
                <figure className="flex h-full flex-col py-9 sm:py-10">
                  <blockquote
                    className={clsx(
                      'flex-1 font-display leading-[1.2] text-pretty',
                      i === 0
                        ? 'max-w-4xl text-[1.75rem] sm:text-[2.6rem]'
                        : 'text-2xl sm:text-[1.7rem]',
                    )}
                  >
                    “{t.quote}”
                  </blockquote>
                  <figcaption className="eyebrow mt-6 text-fg-muted">
                    <span className="text-fg">{t.role}</span> · {t.context}
                  </figcaption>
                </figure>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

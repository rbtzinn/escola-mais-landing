import { Icon } from '@/components/icons';
import { Badge } from '@/components/ui/Badge';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { TESTIMONIALS } from '@/data/content';

export function Testimonials() {
  return (
    <section id="depoimentos" aria-labelledby="depoimentos-titulo" className="py-20 sm:py-24">
      <Container>
        <Reveal>
          <SectionHeading
            id="depoimentos-titulo"
            eyebrow="Depoimentos"
            title="O que gestores de escola poderiam dizer"
          />
          <Badge className="mt-5">Depoimentos ilustrativos, sem pessoas reais</Badge>
        </Reveal>
        <ul className="mt-10 grid gap-5 lg:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <li key={t.role}>
              <Reveal delay={i * 100} className="h-full">
                <figure className="flex h-full flex-col rounded-2xl border border-border bg-surface p-6 sm:p-7">
                  <Icon name="quote" size={32} className="text-secondary" />
                  <blockquote className="mt-4 flex-1 text-lg leading-relaxed">
                    “{t.quote}”
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-5">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary">
                      <Icon name="users" size={22} />
                    </span>
                    <span>
                      <span className="block font-semibold">{t.role}</span>
                      <span className="block text-sm text-fg-muted">{t.context}</span>
                    </span>
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

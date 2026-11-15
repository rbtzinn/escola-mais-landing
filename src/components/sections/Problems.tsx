import { Icon } from '@/components/icons';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { PROBLEMS } from '@/data/content';

export function Problems() {
  return (
    <section id="problemas" aria-labelledby="problemas-titulo" className="bg-muted py-20 sm:py-24">
      <Container>
        <Reveal>
          <SectionHeading
            id="problemas-titulo"
            eyebrow="O desafio"
            title="Gerir uma rede de escolas não deveria depender de papel e planilhas soltas"
          />
        </Reveal>
        <ul className="mt-12 grid gap-5 sm:grid-cols-2">
          {PROBLEMS.map((p, i) => (
            <li key={p.title}>
              <Reveal delay={i * 80} className="h-full">
                <article className="h-full rounded-2xl border border-border bg-surface p-6 sm:p-7">
                  <span className="flex size-12 items-center justify-center rounded-xl bg-danger/10 text-danger">
                    <Icon name={p.icon} />
                  </span>
                  <h3 className="mt-5 font-display text-xl font-bold">{p.title}</h3>
                  <p className="mt-2 leading-relaxed text-fg-muted">{p.text}</p>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

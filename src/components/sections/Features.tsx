import { Icon } from '@/components/icons';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { FEATURES } from '@/data/content';

export function Features() {
  return (
    <section
      id="funcionalidades"
      aria-labelledby="funcionalidades-titulo"
      className="py-20 sm:py-24"
    >
      <Container>
        <Reveal>
          <SectionHeading
            id="funcionalidades-titulo"
            eyebrow="Funcionalidades"
            title="Tudo o que a rede precisa, conectado"
            description="Cada módulo conversa com os demais: o que a escola registra hoje já aparece no painel da secretaria."
          />
        </Reveal>
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <li key={f.title}>
              <Reveal delay={(i % 3) * 80} className="h-full">
                <article className="h-full rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-primary sm:p-7">
                  <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon name={f.icon} />
                  </span>
                  <h3 className="mt-5 font-display text-xl font-bold">{f.title}</h3>
                  <p className="mt-2 leading-relaxed text-fg-muted">{f.text}</p>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

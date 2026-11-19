import { Icon } from '@/components/icons';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { PROBLEMS } from '@/data/content';

/** O que toma o tempo da direção: um bloco azul colado com fita, com quatro bilhetes creme. */
export function Problems() {
  return (
    <section id="problemas" aria-labelledby="problemas-titulo" className="py-16 sm:py-24">
      <Container>
        <div className="paper-blue tape rounded-3xl px-5 py-12 sm:px-12 sm:py-16">
          <Reveal>
            <SectionHeading
              id="problemas-titulo"
              tone="cream"
              align="center"
              className="max-w-3xl"
              title="O que toma o tempo da direção"
              description="Gerir uma escola não deveria depender de planilha solta, papelada e grupo de WhatsApp."
            />
          </Reveal>
          <ul className="mt-10 grid gap-4 sm:mt-12 md:grid-cols-2 lg:gap-5">
            {PROBLEMS.map((p, i) => (
              <li key={p.title}>
                <Reveal
                  delay={i * 60}
                  className="h-full rounded-2xl bg-cream p-6 text-ink shadow-card sm:p-7"
                >
                  <span className="flex size-11 items-center justify-center rounded-full bg-pink text-cream">
                    <Icon name={p.icon} size={22} />
                  </span>
                  <h3 className="mt-4 font-display text-[1.75rem] leading-[1.05] font-extrabold">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-lg leading-relaxed text-ink/75">{p.text}</p>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}

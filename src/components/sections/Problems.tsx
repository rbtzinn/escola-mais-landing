import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { PROBLEMS } from '@/data/content';

export function Problems() {
  return (
    <section
      id="problemas"
      aria-labelledby="problemas-titulo"
      className="border-t border-fg py-20 sm:py-28"
    >
      <Container className="grid gap-12 lg:grid-cols-12 lg:gap-10">
        <Reveal className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <SectionHeading
              id="problemas-titulo"
              index="01"
              eyebrow="O problema"
              title="Gerir uma escola não deveria depender de planilha solta, papelada e grupo de WhatsApp"
            />
          </div>
        </Reveal>
        <ol className="border-t border-fg lg:col-span-7">
          {PROBLEMS.map((p, i) => (
            <li key={p.title} className="border-b border-fg/20">
              <Reveal delay={i * 60} className="grid grid-cols-[2.5rem_1fr] gap-x-4 py-7 sm:py-8">
                <span aria-hidden="true" className="eyebrow pt-2 text-danger">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="font-display text-2xl leading-tight font-medium sm:text-[1.75rem]">
                    {p.title}
                  </h3>
                  <p className="mt-2 max-w-xl text-lg leading-relaxed text-fg-muted">{p.text}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

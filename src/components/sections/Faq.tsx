import { Accordion } from '@/components/ui/Accordion';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { FAQ } from '@/data/content';

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-titulo" className="border-t border-fg py-20 sm:py-28">
      <Container className="grid gap-12 lg:grid-cols-12 lg:gap-10">
        <Reveal className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <SectionHeading
              id="faq-titulo"
              index="06"
              eyebrow="Dúvidas"
              title="Perguntas que costumam surgir"
              description="Não achou a sua? Fale com a gente na demonstração."
            />
          </div>
        </Reveal>
        <Reveal delay={100} className="lg:col-span-8">
          <Accordion items={FAQ} />
        </Reveal>
      </Container>
    </section>
  );
}

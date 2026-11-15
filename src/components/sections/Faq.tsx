import { Accordion } from '@/components/ui/Accordion';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { FAQ } from '@/data/content';

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-titulo" className="bg-muted py-20 sm:py-24">
      <Container className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
        <Reveal>
          <SectionHeading
            id="faq-titulo"
            eyebrow="Dúvidas frequentes"
            title="Perguntas que costumam surgir"
            description="Não achou a sua? Fale com a gente na demonstração."
          />
        </Reveal>
        <Reveal delay={100}>
          <Accordion items={FAQ} />
        </Reveal>
      </Container>
    </section>
  );
}

import { Badge } from '@/components/ui/Badge';
import { Container } from '@/components/ui/Container';
import { Counter } from '@/components/ui/Counter';
import { Reveal } from '@/components/ui/Reveal';
import { IMPACT } from '@/data/content';

/** Faixa escura fixa (nos dois temas) para destacar os números. Valores fictícios. */
export function Impact() {
  return (
    <section
      id="impacto"
      aria-labelledby="impacto-titulo"
      className="bg-[#14352b] py-20 text-[#f5f2ec] sm:py-24"
    >
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <Badge tone="accent">Números de exemplo</Badge>
          <h2
            id="impacto-titulo"
            className="mt-4 font-display text-3xl leading-tight font-extrabold text-balance sm:text-4xl"
          >
            Quanto tempo uma escola pode ganhar
          </h2>
        </Reveal>
        <dl className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
          {IMPACT.map((n, i) => (
            <Reveal key={n.label} delay={i * 80} className="flex flex-col text-center">
              <dt className="order-2 mt-2 text-sm leading-snug text-[#cfe3d9] sm:text-base">
                {n.label}
              </dt>
              <dd className="font-display text-4xl font-extrabold text-[#e8b321] sm:text-5xl">
                <Counter to={n.value} prefix={n.prefix} suffix={n.suffix} />
              </dd>
            </Reveal>
          ))}
        </dl>
        <p className="mx-auto mt-12 max-w-xl text-center text-sm text-[#cfe3d9]">
          Valores fictícios, criados apenas para demonstrar o layout. Não representam resultados
          reais.
        </p>
      </Container>
    </section>
  );
}

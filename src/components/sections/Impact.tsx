import { Container } from '@/components/ui/Container';
import { Counter } from '@/components/ui/Counter';
import { Reveal } from '@/components/ui/Reveal';
import { IMPACT } from '@/data/content';

/** Faixa "quadro-verde", fixa nos dois temas, para os números. Valores fictícios. */
export function Impact() {
  return (
    <section
      id="impacto"
      aria-labelledby="impacto-titulo"
      className="bg-[#143a2e] py-20 text-[#f1efe4] sm:py-28"
    >
      <Container>
        <Reveal className="max-w-2xl">
          <p className="eyebrow mb-5 flex items-center gap-3 text-[#b9d2c6]">
            <span className="text-[#f2c230]">05</span>
            <span aria-hidden="true" className="h-px w-8 bg-[#f1efe4]/40" />
            Impacto · números de exemplo
          </p>
          <h2
            id="impacto-titulo"
            className="font-display text-[2rem] leading-[1.08] font-medium text-balance sm:text-[2.75rem]"
          >
            Quanto tempo uma escola pode ganhar
          </h2>
        </Reveal>
        <dl className="mt-14 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4 lg:gap-x-10">
          {IMPACT.map((n, i) => (
            <Reveal
              key={n.label}
              delay={i * 80}
              className="flex flex-col border-t border-[#f1efe4]/35 pt-4"
            >
              <dt className="order-2 mt-3 max-w-[14rem] leading-snug text-[#cfe0d7]">{n.label}</dt>
              <dd className="font-display text-6xl leading-none font-normal whitespace-nowrap text-[#f2c230] sm:text-7xl lg:text-[5.5rem]">
                <Counter to={n.value} prefix={n.prefix} suffix={n.suffix} />
              </dd>
            </Reveal>
          ))}
        </dl>
        <p className="mt-12 max-w-xl text-sm text-[#b9d2c6]">
          Valores fictícios, criados apenas para demonstrar o layout. Não representam resultados
          reais.
        </p>
      </Container>
    </section>
  );
}

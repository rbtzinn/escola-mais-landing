import Link from 'next/link';
import { Icon } from '@/components/icons';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { FEATURES } from '@/data/content';

// As duas primeiras funcionalidades são o coração do produto e ganham destaque, com um exemplo.
const [MESSAGES, SHEETS, ...OTHERS] = FEATURES;

/** Exemplo de aviso automático, como chegaria à família. Texto fictício. */
function MessageSample() {
  return (
    <figure className="mt-7 max-w-md border border-fg/25 bg-surface p-4">
      <figcaption className="eyebrow flex items-center gap-2 text-fg-muted">
        <WhatsAppIcon size={14} className="text-primary" />
        Modelo · aviso de falta · 7h42
      </figcaption>
      <p className="mt-2.5 leading-relaxed">
        Bom dia! A Ana, do 7º B, ainda não chegou à escola hoje. Está tudo bem? Se ela não vier,
        responda com o motivo.
      </p>
      <p className="mt-2 text-sm text-fg-muted">Secretaria da Escola Municipal Exemplo</p>
    </figure>
  );
}

/** Uma planilha comum (à esquerda) e o que o painel tira dela (à direita). Dados fictícios. */
function SheetSample() {
  return (
    <div className="mt-7 max-w-md">
      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-3">
        <div aria-hidden="true" className="border border-fg/25 bg-surface font-mono text-[0.7rem]">
          {['aluno;turma;faltas', 'Ana;7B;2', 'Bruno;7B;11', 'Carla;9C;0'].map((row, i) => (
            <p
              key={row}
              className={
                i === 0
                  ? 'border-b border-fg/25 bg-muted px-2.5 py-1.5 text-fg-muted'
                  : 'border-b border-border px-2.5 py-1.5 last:border-b-0'
              }
            >
              {row}
            </p>
          ))}
        </div>
        <Icon name="arrow" size={20} className="self-center text-fg-muted" />
        <dl
          aria-label="Exemplo do que o painel mostra"
          className="grid content-center gap-2.5 border border-fg/70 bg-surface px-3.5 py-3"
        >
          {[
            ['Frequência', '92,4%'],
            ['Em risco', '18'],
          ].map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-3">
              <dt className="text-xs text-fg-muted">{label}</dt>
              <dd className="font-display text-2xl leading-none font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <Link
        href="/demo"
        className="mt-5 inline-flex min-h-11 items-center gap-2 font-semibold text-primary underline decoration-accent decoration-2 underline-offset-[6px] hover:decoration-primary"
      >
        Testar agora com a sua planilha
        <Icon name="arrow" size={18} />
      </Link>
    </div>
  );
}

export function Features() {
  return (
    <section
      id="funcionalidades"
      aria-labelledby="funcionalidades-titulo"
      className="border-t border-fg py-20 sm:py-28"
    >
      <Container>
        <Reveal>
          <SectionHeading
            id="funcionalidades-titulo"
            index="02"
            eyebrow="Funcionalidades"
            title="Menos trabalho manual para quem gere a escola"
            description="Pensado para o diretor e o coordenador resolverem o dia a dia, sem virar especialista em tecnologia."
          />
        </Reveal>

        <div className="mt-14 grid border-t border-fg md:grid-cols-2">
          {[
            { feature: MESSAGES, sample: <MessageSample /> },
            { feature: SHEETS, sample: <SheetSample /> },
          ].map(({ feature, sample }, i) => (
            <Reveal
              key={feature.title}
              delay={i * 80}
              className={
                i === 0
                  ? 'border-b border-fg/20 py-10 md:border-r md:pr-10 lg:pr-14'
                  : 'border-b border-fg/20 py-10 md:pl-10 lg:pl-14'
              }
            >
              <article>
                <h3 className="font-display text-3xl leading-tight font-medium sm:text-4xl">
                  {feature.title}
                </h3>
                <p className="mt-4 max-w-lg text-lg leading-relaxed text-fg-muted">
                  {feature.text}
                </p>
                {sample}
              </article>
            </Reveal>
          ))}
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-12 lg:gap-10">
          <Reveal className="lg:col-span-4">
            <h3 className="font-display text-2xl leading-tight font-medium text-balance sm:text-3xl lg:sticky lg:top-28">
              E o resto da rotina, <em>no mesmo lugar</em>
            </h3>
          </Reveal>
          <ul className="border-t border-fg/40 lg:col-span-8">
            {OTHERS.map((f) => (
              <li key={f.title} className="border-b border-fg/20">
                <Reveal className="grid gap-x-8 gap-y-1.5 py-5 sm:grid-cols-[minmax(0,15rem)_1fr]">
                  <h4 className="flex items-start gap-3 font-display text-xl leading-snug font-medium">
                    <Icon name={f.icon} size={20} className="mt-1 shrink-0 text-primary" />
                    {f.title}
                  </h4>
                  <p className="leading-relaxed text-fg-muted max-sm:pl-8">{f.text}</p>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}

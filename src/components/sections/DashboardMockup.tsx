import clsx from 'clsx';
import { Icon } from '@/components/icons';
import { Badge } from '@/components/ui/Badge';

const KPIS = [
  { label: 'Frequência', value: '92,4%', note: '+1,8 p.p.' },
  { label: 'Em risco', value: '18', note: '−4 no mês' },
  { label: 'Atrasos hoje', value: '7', note: '3 avisos' },
];

const CLASSES = [
  { name: '6º A', value: 96 },
  { name: '7º B', value: 93 },
  { name: '8º A', value: 91 },
  { name: '9º C', value: 84, low: true },
  { name: '1º EM', value: 94 },
];

const MESSAGES = [
  { item: 'Aviso de falta', status: '42 enviadas', done: true },
  { item: 'Reunião de pais', status: '118 enviadas', done: true },
  { item: 'Boletim', status: 'aguardando', done: false },
];

/**
 * "Folha do dia": o resumo da escola como uma página de diário de classe, com uma anotação à
 * caneta. Feita só com HTML; dados fictícios e oculta de leitores de tela (há legenda em texto).
 */
export function DashboardMockup() {
  return (
    <figure
      className="relative mx-auto max-w-md lg:max-w-none"
      aria-label="Ilustração de um resumo do dia do Escola+ com dados fictícios"
    >
      {/* folha de trás */}
      <div
        aria-hidden="true"
        className="absolute inset-0 translate-x-2 translate-y-3 rotate-[1.6deg] border border-border bg-surface"
      />
      <div
        aria-hidden="true"
        className="relative -rotate-[0.7deg] border border-fg/70 bg-surface shadow-card select-none"
      >
        <div className="flex items-start justify-between gap-3 border-b border-fg/70 px-5 py-4">
          <div>
            <p className="eyebrow text-fg-muted">Resumo do dia</p>
            <p className="mt-1 font-display text-xl leading-tight font-medium">
              Escola Municipal Exemplo
            </p>
            <p className="text-sm text-fg-muted">612 alunos · 18 turmas</p>
          </div>
          <Badge tone="accent">Dados ilustrativos</Badge>
        </div>

        <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
          {KPIS.map((k) => (
            <div key={k.label} className="px-4 py-3.5 sm:px-5">
              <p className="text-xs text-fg-muted">{k.label}</p>
              <p className="mt-0.5 font-display text-[1.7rem] leading-none font-medium sm:text-4xl">
                {k.value}
              </p>
              <p className="mt-1.5 text-xs font-semibold text-primary">{k.note}</p>
            </div>
          ))}
        </div>

        <div className="relative border-b border-border px-5 py-4">
          <p className="eyebrow mb-2.5 text-fg-muted">Frequência por turma</p>
          <ul className="space-y-2">
            {CLASSES.map((c) => (
              <li key={c.name} className="grid grid-cols-[3.25rem_1fr_2.5rem] items-center gap-3">
                <span className="font-mono text-xs">{c.name}</span>
                <span className="h-1.5 bg-fg/10">
                  <span
                    className={clsx('block h-full', c.low ? 'bg-danger' : 'bg-primary')}
                    style={{ width: `${c.value}%` }}
                  />
                </span>
                <span
                  className={clsx(
                    'text-right font-mono text-xs',
                    c.low && 'font-medium text-danger',
                  )}
                >
                  {c.value}%
                </span>
              </li>
            ))}
          </ul>
          {/* anotação "à caneta" */}
          <p className="mt-3 -rotate-1 font-display text-[1.05rem] leading-snug text-secondary italic">
            ↑ 9º C caiu de novo. Ligar para 3 famílias hoje.
          </p>
        </div>

        <div className="px-5 py-4">
          <p className="eyebrow mb-2 text-fg-muted">Avisos às famílias</p>
          <ul className="divide-y divide-border text-sm">
            {MESSAGES.map((m) => (
              <li key={m.item} className="flex items-center gap-2.5 py-1.5">
                <span
                  className={clsx(
                    'flex size-4 shrink-0 items-center justify-center border',
                    m.done ? 'border-primary bg-primary text-on-primary' : 'border-fg/40',
                  )}
                >
                  {m.done && <Icon name="check" size={12} strokeWidth={3} />}
                </span>
                <span className="flex-1">{m.item}</span>
                <span className="font-mono text-xs text-fg-muted">{m.status}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <figcaption className="sr-only">
        Resumo de exemplo de uma escola com 612 alunos: frequência de 92,4%, 18 alunos em risco e 7
        atrasos hoje, com 3 avisos enviados. Frequência por turma: 6º A 96%, 7º B 93%, 8º A 91%, 9º
        C 84% (em alerta) e 1º EM 94%. Avisos às famílias: 42 avisos de falta e 118 convites de
        reunião enviados, boletim aguardando. Todos os dados são fictícios.
      </figcaption>
    </figure>
  );
}

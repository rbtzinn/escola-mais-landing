import { Badge } from '@/components/ui/Badge';

const BARS = [62, 70, 66, 78, 74, 85, 91, 88];
const MONTHS = ['Mar', 'Abr', 'Mai', 'Jun', 'Ago', 'Set', 'Out', 'Nov'];

const KPIS = [
  { label: 'Frequência', value: '92,4%', delta: '+1,8 p.p.', tone: 'text-primary' },
  { label: 'Alunos em risco', value: '18', delta: '−4 no mês', tone: 'text-primary' },
  { label: 'Atrasos hoje', value: '7', delta: '3 avisos enviados', tone: 'text-primary' },
];

const MESSAGES = [
  { item: 'Aviso de falta', status: '42 enviadas', done: true },
  { item: 'Reunião', status: '118 enviadas', done: true },
  { item: 'Boletim', status: 'Aguardando', done: false },
];

/** Painel ilustrativo feito só com HTML/SVG. Dados fictícios; oculto de leitores de tela. */
export function DashboardMockup() {
  return (
    <figure
      className="relative"
      aria-label="Ilustração de um painel do Escola+ com dados fictícios"
    >
      <div
        aria-hidden="true"
        className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/25 to-secondary/25 blur-2xl"
      />
      <div
        aria-hidden="true"
        className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card select-none"
      >
        {/* barra da janela */}
        <div className="flex items-center gap-2 border-b border-border bg-muted px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
          <span className="ml-3 truncate text-xs font-medium text-fg-muted">
            Painel da escola · Visão geral
          </span>
        </div>

        <div className="p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="font-display text-sm font-bold sm:text-base">
              Escola Municipal Exemplo · 612 alunos
            </p>
            <Badge tone="accent">Dados ilustrativos</Badge>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {KPIS.map((k) => (
              <div key={k.label} className="rounded-xl border border-border bg-bg p-2.5 sm:p-3">
                <p className="text-[0.65rem] leading-tight font-semibold text-fg-muted sm:text-xs">
                  {k.label}
                </p>
                <p className="mt-1 font-display text-lg font-extrabold sm:text-2xl">{k.value}</p>
                <p className={`${k.tone} text-[0.65rem] font-bold sm:text-xs`}>{k.delta}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-5">
            <div className="rounded-xl border border-border bg-bg p-3 sm:col-span-3">
              <p className="mb-2 text-xs font-semibold text-fg-muted">Frequência mensal (%)</p>
              <svg viewBox="0 0 240 110" className="h-auto w-full" role="presentation">
                {[25, 50, 75].map((y) => (
                  <line
                    key={y}
                    x1="0"
                    x2="240"
                    y1={95 - y * 0.9}
                    y2={95 - y * 0.9}
                    stroke="var(--border)"
                    strokeWidth="1"
                  />
                ))}
                {BARS.map((v, i) => {
                  const h = (v / 100) * 85;
                  return (
                    <g key={i}>
                      <rect
                        x={8 + i * 29}
                        y={95 - h}
                        width="18"
                        height={h}
                        rx="4"
                        fill={i === BARS.length - 1 ? 'var(--primary)' : 'var(--secondary)'}
                        opacity={i === BARS.length - 1 ? 1 : 0.45}
                      />
                      <text
                        x={17 + i * 29}
                        y="108"
                        textAnchor="middle"
                        fontSize="8"
                        fill="var(--text-muted)"
                      >
                        {MONTHS[i]}
                      </text>
                    </g>
                  );
                })}
                <polyline
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={BARS.map((v, i) => `${17 + i * 29},${95 - (v / 100) * 85 - 6}`).join(' ')}
                />
              </svg>
            </div>

            <div className="rounded-xl border border-border bg-bg p-3 sm:col-span-2">
              <p className="mb-2 text-xs font-semibold text-fg-muted">Mensagens aos pais</p>
              <ul className="space-y-2.5">
                {MESSAGES.map((m) => (
                  <li key={m.item}>
                    <div className="mb-1 flex justify-between text-xs font-semibold">
                      <span>{m.item}</span>
                      <span className="text-fg-muted">{m.status}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: m.done ? '100%' : '35%',
                          background: m.done ? 'var(--primary)' : 'var(--accent)',
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="sr-only">
        Painel de exemplo de uma escola com frequência de 92,4%, 18 alunos em risco, 7 atrasos hoje
        com 3 avisos enviados, gráfico de frequência mensal e mensagens aos pais: 42 avisos de falta
        e 118 convites de reunião enviados, boletim aguardando. Todos os dados são fictícios.
      </figcaption>
    </figure>
  );
}

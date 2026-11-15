import { Badge } from '@/components/ui/Badge';

const BARS = [62, 70, 66, 78, 74, 85, 91, 88];
const MONTHS = ['Mar', 'Abr', 'Mai', 'Jun', 'Ago', 'Set', 'Out', 'Nov'];

const KPIS = [
  { label: 'Frequência', value: '92,4%', delta: '+1,8 p.p.', tone: 'text-primary' },
  { label: 'Risco de evasão', value: '3,1%', delta: '−0,9 p.p.', tone: 'text-primary' },
  { label: 'Média de notas', value: '7,2', delta: '+0,3', tone: 'text-primary' },
];

const STOCK = [
  { item: 'Arroz', pct: 78 },
  { item: 'Feijão', pct: 46 },
  { item: 'Leite', pct: 18 },
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
            Painel da rede · Visão geral
          </span>
        </div>

        <div className="p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="font-display text-sm font-bold sm:text-base">
              Rede municipal · 48 escolas
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
              <p className="mb-2 text-xs font-semibold text-fg-muted">Estoque da merenda</p>
              <ul className="space-y-2.5">
                {STOCK.map((s) => (
                  <li key={s.item}>
                    <div className="mb-1 flex justify-between text-xs font-semibold">
                      <span>{s.item}</span>
                      <span className={s.pct < 25 ? 'text-danger' : 'text-fg-muted'}>
                        {s.pct < 25 ? 'Baixo · ' : ''}
                        {s.pct}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${s.pct}%`,
                          background: s.pct < 25 ? 'var(--danger)' : 'var(--primary)',
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
        Painel de exemplo com frequência de 92,4%, risco de evasão de 3,1%, média de notas 7,2,
        gráfico de frequência mensal e estoque de merenda com leite em nível baixo. Todos os dados
        são fictícios.
      </figcaption>
    </figure>
  );
}

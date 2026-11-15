import clsx from 'clsx';
import { formatNumber } from '@/lib/spreadsheet/numbers';
import type { Analysis } from '@/lib/spreadsheet/types';

/** Rosca com a parte dos alunos em risco. O número e o texto ao lado repetem a informação. */
function RiskDonut({ risco, total }: { risco: number; total: number }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  const share = total > 0 ? risco / total : 0;
  return (
    <svg
      viewBox="0 0 100 100"
      className="size-24 shrink-0 -rotate-90 sm:size-28"
      aria-hidden="true"
    >
      <circle
        cx="50"
        cy="50"
        r={r}
        fill="none"
        strokeWidth="14"
        stroke="var(--primary)"
        opacity="0.25"
      />
      {share > 0 && (
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="14"
          stroke="var(--danger)"
          strokeDasharray={`${share * c} ${c}`}
          strokeLinecap="butt"
        />
      )}
    </svg>
  );
}

export function KpiCards({ analysis }: { analysis: Analysis }) {
  const { kpis, turmas } = analysis;
  const pct = kpis.alunos > 0 ? Math.round((kpis.emRisco / kpis.alunos) * 100) : 0;
  const items = [
    {
      label: 'Frequência',
      value: kpis.frequenciaGeral === null ? '—' : `${formatNumber(kpis.frequenciaGeral)}%`,
    },
    { label: 'Média geral', value: kpis.mediaGeral === null ? '—' : formatNumber(kpis.mediaGeral) },
    { label: 'Em risco', value: String(kpis.emRisco), alert: kpis.emRisco > 0 },
    { label: 'Muitos atrasos', value: String(kpis.comAtrasos) },
  ];
  return (
    <section
      aria-label="Resumo da escola"
      className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
    >
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4">
        <RiskDonut risco={kpis.emRisco} total={kpis.alunos} />
        <div className="min-w-0">
          <p className="font-display text-3xl leading-none font-extrabold">
            {kpis.alunos.toLocaleString('pt-BR')}
            <span className="ml-1.5 text-base font-semibold text-fg-muted">alunos</span>
          </p>
          <p className="mt-1 text-sm text-fg-muted">
            {turmas.length} {turmas.length === 1 ? 'turma' : 'turmas'}
          </p>
          <p className="mt-2 text-sm">
            <span className="font-bold text-danger">{pct}%</span> em risco
          </p>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-3">
        {items.map((k) => (
          <div key={k.label} className="min-w-0 rounded-2xl border border-border bg-surface p-3.5">
            <dt className="text-sm font-semibold text-fg-muted">{k.label}</dt>
            <dd
              className={clsx(
                'mt-0.5 font-display text-2xl font-extrabold sm:text-3xl',
                k.alert && 'text-danger',
              )}
            >
              {k.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

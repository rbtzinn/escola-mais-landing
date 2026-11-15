import { formatNumber } from '@/lib/spreadsheet/numbers';
import type { Analysis } from '@/lib/spreadsheet/types';

export function KpiCards({ analysis }: { analysis: Analysis }) {
  const { kpis } = analysis;
  const items = [
    { label: 'Alunos', value: kpis.alunos.toLocaleString('pt-BR') },
    {
      label: 'Frequência geral',
      value: kpis.frequenciaGeral === null ? '—' : `${formatNumber(kpis.frequenciaGeral)}%`,
    },
    { label: 'Média geral', value: kpis.mediaGeral === null ? '—' : formatNumber(kpis.mediaGeral) },
    { label: 'Alunos em risco', value: String(kpis.emRisco), alert: kpis.emRisco > 0 },
    { label: 'Com muitos atrasos', value: String(kpis.comAtrasos) },
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {items.map((k) => (
        <div key={k.label} className="rounded-2xl border border-border bg-surface p-4">
          <dt className="text-sm font-semibold text-fg-muted">{k.label}</dt>
          <dd
            className={`mt-1 font-display text-3xl font-extrabold ${k.alert ? 'text-danger' : ''}`}
          >
            {k.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

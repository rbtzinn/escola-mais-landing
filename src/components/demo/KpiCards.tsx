import clsx from 'clsx';
import type { Comparison } from '@/lib/spreadsheet/compare';
import { formatNumber } from '@/lib/spreadsheet/numbers';
import type { Analysis } from '@/lib/spreadsheet/types';
import { DeltaTag } from './levels';

/** Quatro números da escola, com a variação desde a planilha anterior quando houver. */
export function KpiCards({
  analysis,
  comparison,
}: {
  analysis: Analysis;
  comparison: Comparison | null;
}) {
  const { kpis } = analysis;
  const d = comparison?.kpis;
  const items = [
    {
      label: 'Frequência',
      value: kpis.frequenciaGeral === null ? '—' : `${formatNumber(kpis.frequenciaGeral)}%`,
      delta: d && <DeltaTag value={d.frequenciaGeral} higherIsBetter unit=" p.p." />,
    },
    {
      label: 'Média geral',
      value: kpis.mediaGeral === null ? '—' : formatNumber(kpis.mediaGeral),
      delta: d && <DeltaTag value={d.mediaGeral} higherIsBetter />,
    },
    {
      label: 'Em risco',
      value: String(kpis.emRisco),
      alert: kpis.emRisco > 0,
      delta: d && <DeltaTag value={d.emRisco} higherIsBetter={false} decimals={0} />,
    },
    {
      label: 'Muitos atrasos',
      value: String(kpis.comAtrasos),
      delta: d && <DeltaTag value={d.comAtrasos} higherIsBetter={false} decimals={0} />,
    },
  ];
  return (
    <dl
      aria-label="Indicadores da escola"
      className="grid grid-cols-2 border-y border-fg/60 sm:grid-cols-4 sm:divide-x sm:divide-border max-sm:[&>*]:border-border max-sm:[&>*:nth-child(-n+2)]:border-b max-sm:[&>*:nth-child(odd)]:border-r"
    >
      {items.map((k) => (
        <div key={k.label} className="min-w-0 px-3 py-3 sm:px-4">
          <dt className="text-sm text-fg-muted">{k.label}</dt>
          <dd className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
            <span
              className={clsx(
                'font-display text-3xl font-medium sm:text-4xl',
                k.alert && 'text-danger',
              )}
            >
              {k.value}
            </span>
            {k.delta}
          </dd>
        </div>
      ))}
    </dl>
  );
}

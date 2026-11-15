import clsx from 'clsx';
import type { Comparison } from '@/lib/spreadsheet/compare';
import {
  LEVEL_LABEL,
  LEVEL_LIMITS,
  headline,
  riskShare,
  schoolLevel,
} from '@/lib/spreadsheet/insights';
import { formatNumber } from '@/lib/spreadsheet/numbers';
import type { Analysis } from '@/lib/spreadsheet/types';
import { LEVEL_CARD, LEVEL_DOT, LEVEL_TEXT } from './levels';

/** Resposta de 3 segundos: situação em semáforo + uma frase. */
export function Verdict({
  analysis,
  comparison,
}: {
  analysis: Analysis;
  comparison: Comparison | null;
}) {
  const level = schoolLevel(analysis);
  const { title, detail } = headline(analysis);
  const pct = riskShare(analysis.kpis.emRisco, analysis.kpis.alunos);

  return (
    <section
      aria-labelledby="veredito-titulo"
      className={clsx('rounded-2xl border-2 p-4 sm:p-6', LEVEL_CARD[level])}
    >
      <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-bold">
        <span className="flex items-center gap-2">
          <span className={clsx('size-3 rounded-full', LEVEL_DOT[level])} aria-hidden="true" />
          <span className={LEVEL_TEXT[level]}>Situação da escola: {LEVEL_LABEL[level]}</span>
        </span>
        <span className="font-semibold text-fg-muted">
          {formatNumber(pct, 0)}% em risco · {analysis.kpis.alunos.toLocaleString('pt-BR')} alunos
        </span>
      </p>
      <h3
        id="veredito-titulo"
        className="mt-2 font-display text-2xl leading-tight font-extrabold text-balance sm:text-3xl"
      >
        {title}
      </h3>
      {detail && <p className="mt-1 text-base sm:text-lg">{detail}</p>}
      {comparison && comparison.emComum > 0 && (
        <p className="mt-2 text-sm font-semibold">
          Desde a planilha anterior:{' '}
          <span className="text-primary">
            {comparison.sairam} {comparison.sairam === 1 ? 'saiu' : 'saíram'} do risco
          </span>
          ,{' '}
          <span className="text-danger">
            {comparison.entraram} {comparison.entraram === 1 ? 'entrou' : 'entraram'}
          </span>
          .
        </p>
      )}
      <p className="mt-2 text-xs text-fg-muted">
        Verde até {LEVEL_LIMITS.ok}% dos alunos em risco, amarelo até {LEVEL_LIMITS.atencao}%,
        vermelho acima.
      </p>
    </section>
  );
}

import clsx from 'clsx';
import type { Comparison } from '@/lib/spreadsheet/compare';
import { LEVEL_LABEL, classLevel, riskShare } from '@/lib/spreadsheet/insights';
import { formatNumber } from '@/lib/spreadsheet/numbers';
import type { Analysis } from '@/lib/spreadsheet/types';
import { DeltaTag, LEVEL_CARD, LEVEL_DOT } from './levels';

/** Um quadrado por turma, na cor da situação. Um toque abre a ficha da turma. */
export function ClassGrid({
  analysis,
  comparison,
  onOpen,
}: {
  analysis: Analysis;
  comparison: Comparison | null;
  onOpen: (turma: string) => void;
}) {
  return (
    <section aria-labelledby="grade-titulo">
      <h3 id="grade-titulo" className="mb-2 font-display text-lg font-bold">
        Turmas
      </h3>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {analysis.turmas.map((t) => {
          const level = classLevel(t);
          const d = comparison?.turmas[t.turma];
          return (
            <li key={t.turma}>
              <button
                type="button"
                onClick={() => onOpen(t.turma)}
                className={clsx(
                  'flex h-full w-full flex-col rounded-2xl border-2 p-3 text-left transition-transform hover:-translate-y-0.5',
                  LEVEL_CARD[level],
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-display text-xl font-extrabold">{t.turma}</span>
                  <span
                    className={clsx('size-3 shrink-0 rounded-full', LEVEL_DOT[level])}
                    aria-hidden="true"
                  />
                </span>
                <span className="sr-only">Situação: {LEVEL_LABEL[level]}. </span>
                <span className="mt-1 text-sm font-semibold">
                  {formatNumber(riskShare(t.emRisco, t.alunos), 0)}% em risco
                  <span className="font-normal text-fg-muted">
                    {' '}
                    ({t.emRisco}/{t.alunos})
                  </span>
                </span>
                <span className="text-sm text-fg-muted">
                  {t.frequencia === null
                    ? 'Sem frequência'
                    : `Freq. ${formatNumber(t.frequencia, 0)}%`}
                  {t.media !== null && ` · Média ${formatNumber(t.media)}`}
                </span>
                {d && (
                  <span className="mt-1">
                    <DeltaTag value={d.emRisco} higherIsBetter={false} decimals={0} />
                    <span className="text-xs text-fg-muted"> em risco</span>
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

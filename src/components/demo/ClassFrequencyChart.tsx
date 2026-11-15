import { formatNumber } from '@/lib/spreadsheet/numbers';
import type { Analysis } from '@/lib/spreadsheet/types';

/** Barras horizontais de frequência por turma, com a linha do mínimo. Os valores aparecem em texto. */
export function ClassFrequencyChart({ analysis }: { analysis: Analysis }) {
  const { turmas, options } = analysis;
  const has = turmas.some((t) => t.frequencia !== null);

  return (
    <section
      aria-labelledby="freq-titulo"
      className="rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <h3 id="freq-titulo" className="font-display text-xl font-bold">
        Frequência por turma
      </h3>
      {!has ? (
        <p className="mt-3 text-fg-muted">
          Indique a coluna de faltas para ver a frequência (e os dias letivos acima).
        </p>
      ) : (
        <>
          <ul className="mt-5 space-y-4">
            {turmas.map((t) => {
              const f = t.frequencia;
              const low = f !== null && f < options.freqMin;
              return (
                <li key={t.turma}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-semibold">{t.turma}</span>
                    <span className={low ? 'font-bold text-danger' : 'text-fg-muted'}>
                      {f === null ? 'sem dados' : `${formatNumber(f)}%`}
                      {low && ' · abaixo do mínimo'}
                    </span>
                  </div>
                  <div
                    className="relative h-3 overflow-hidden rounded-full bg-border"
                    aria-hidden="true"
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${f ?? 0}%`,
                        background: low ? 'var(--danger)' : 'var(--primary)',
                      }}
                    />
                    <div
                      className="absolute inset-y-0 w-0.5 bg-fg"
                      style={{ left: `${options.freqMin}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-sm text-fg-muted">
            A linha vertical marca a frequência mínima de {options.freqMin}%.
          </p>
        </>
      )}
    </section>
  );
}

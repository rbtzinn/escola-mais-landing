import clsx from 'clsx';
import { formatNumber } from '@/lib/spreadsheet/numbers';
import type { Analysis } from '@/lib/spreadsheet/types';

function tone(value: number | null, min: number) {
  if (value === null) return '';
  if (value < min) return 'bg-danger/15 text-danger';
  if (value < min + 1.5) return 'bg-accent/30';
  return 'bg-primary/15 text-primary';
}

/** Média por turma e disciplina. A cor reforça o número, que está sempre visível. */
export function GradesTable({ analysis }: { analysis: Analysis }) {
  const { turmas, disciplinas, options } = analysis;

  return (
    <section
      aria-labelledby="notas-titulo"
      className="rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <h3 id="notas-titulo" className="font-display text-xl font-bold">
        Notas por turma e disciplina
      </h3>
      {disciplinas.length === 0 ? (
        <p className="mt-3 text-fg-muted">Marque as colunas de notas para ver as médias.</p>
      ) : (
        <>
          <div
            role="region"
            aria-labelledby="notas-titulo"
            tabIndex={0}
            className="mt-4 overflow-x-auto"
          >
            <table className="w-full min-w-max border-separate border-spacing-1 text-center text-sm">
              <thead>
                <tr>
                  <th scope="col" className="px-3 py-2 text-left font-semibold">
                    Turma
                  </th>
                  {disciplinas.map((d) => (
                    <th key={d} scope="col" className="px-3 py-2 font-semibold">
                      {d}
                    </th>
                  ))}
                  <th scope="col" className="px-3 py-2 font-semibold">
                    Média
                  </th>
                </tr>
              </thead>
              <tbody>
                {turmas.map((t) => (
                  <tr key={t.turma}>
                    <th scope="row" className="px-3 py-2 text-left font-semibold">
                      {t.turma}
                    </th>
                    {disciplinas.map((d) => {
                      const v = t.mediasPorDisciplina[d];
                      return (
                        <td
                          key={d}
                          className={clsx(
                            'rounded-lg px-3 py-2 font-semibold',
                            tone(v, options.mediaMin),
                          )}
                        >
                          {v === null ? '—' : formatNumber(v)}
                        </td>
                      );
                    })}
                    <td
                      className={clsx(
                        'rounded-lg px-3 py-2 font-extrabold',
                        tone(t.media, options.mediaMin),
                      )}
                    >
                      {t.media === null ? '—' : formatNumber(t.media)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-fg-muted">
            Vermelho: abaixo de {formatNumber(options.mediaMin)}. Amarelo: perto do mínimo. Verde:
            acima.
          </p>
        </>
      )}
    </section>
  );
}

import { Badge } from '@/components/ui/Badge';
import type { Analysis } from '@/lib/spreadsheet/types';

/** Alunos com atrasos acima do limite, para avisar as famílias. */
export function LateList({ analysis, hasColumn }: { analysis: Analysis; hasColumn: boolean }) {
  const { atrasos, options } = analysis;
  return (
    <section
      aria-labelledby="atrasos-titulo"
      className="rounded-2xl border border-border bg-surface p-5 sm:p-6"
    >
      <h3 id="atrasos-titulo" className="font-display text-xl font-bold">
        Atrasos ({atrasos.length})
      </h3>
      {!hasColumn ? (
        <p className="mt-3 text-fg-muted">Indique a coluna de atrasos para ver esta lista.</p>
      ) : atrasos.length === 0 ? (
        <p className="mt-3 text-fg-muted">Ninguém com {options.atrasosMin} atrasos ou mais.</p>
      ) : (
        <>
          <p className="mt-1 text-sm text-fg-muted">
            Alunos com {options.atrasosMin} atrasos ou mais: bom momento de avisar a família.
          </p>
          <ul className="mt-4 space-y-2">
            {atrasos.map((s) => (
              <li
                key={`${s.turma}-${s.aluno}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-bg px-4 py-3"
              >
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{s.aluno}</span>
                  <Badge>{s.turma}</Badge>
                </span>
                <span className="text-sm font-bold text-danger">{s.atrasos} atrasos</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

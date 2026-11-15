import clsx from 'clsx';
import { Modal } from '@/components/ui/Modal';
import type { Comparison } from '@/lib/spreadsheet/compare';
import { LEVEL_LABEL, classLevel, riskShare } from '@/lib/spreadsheet/insights';
import { formatNumber } from '@/lib/spreadsheet/numbers';
import type { Analysis, Student } from '@/lib/spreadsheet/types';
import { DeltaTag, LEVEL_DOT } from './levels';

/** Ficha da turma (abre de baixo no celular): números, disciplinas e quem está em risco. */
export function ClassSheet({
  analysis,
  comparison,
  turma,
  onClose,
  onStudent,
}: {
  analysis: Analysis;
  comparison: Comparison | null;
  turma: string | null;
  onClose: () => void;
  onStudent: (s: Student) => void;
}) {
  const t = analysis.turmas.find((x) => x.turma === turma);
  if (!t) return null;
  const level = classLevel(t);
  const d = comparison?.turmas[t.turma];
  const risco = analysis.risco.filter((r) => r.student.turma === t.turma);
  const { mediaMin } = analysis.options;

  return (
    <Modal open onClose={onClose} title={`Turma ${t.turma}`}>
      <p className="flex items-center gap-2 font-semibold text-fg">
        <span className={clsx('size-3 rounded-full', LEVEL_DOT[level])} aria-hidden="true" />
        Situação: {LEVEL_LABEL[level]} · {formatNumber(riskShare(t.emRisco, t.alunos), 0)}% em risco
      </p>
      <dl className="grid grid-cols-3 gap-2 text-center">
        {[
          ['Alunos', String(t.alunos), null],
          [
            'Frequência',
            t.frequencia === null ? '—' : `${formatNumber(t.frequencia, 0)}%`,
            d && <DeltaTag value={d.frequencia} higherIsBetter unit=" p.p." />,
          ],
          [
            'Média',
            t.media === null ? '—' : formatNumber(t.media),
            d && <DeltaTag value={d.media} higherIsBetter />,
          ],
        ].map(([label, value, delta]) => (
          <div key={label as string} className="rounded-xl bg-bg p-2">
            <dt className="text-xs font-semibold">{label}</dt>
            <dd className="font-display text-xl font-extrabold text-fg">{value}</dd>
            {delta && <dd>{delta}</dd>}
          </div>
        ))}
      </dl>

      {analysis.disciplinas.length > 0 && (
        <div>
          <h3 className="mb-1 font-semibold text-fg">Média por disciplina</h3>
          <ul className="space-y-1">
            {analysis.disciplinas.map((disc) => {
              const v = t.mediasPorDisciplina[disc];
              const low = v !== null && v < mediaMin;
              return (
                <li key={disc} className="flex justify-between gap-3 text-sm">
                  <span>{disc}</span>
                  <span className={clsx('font-bold', low ? 'text-danger' : 'text-fg')}>
                    {v === null ? '—' : formatNumber(v)}
                    {low && ' · abaixo'}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div>
        <h3 className="mb-1 font-semibold text-fg">Alunos em risco ({risco.length})</h3>
        {risco.length === 0 ? (
          <p className="text-sm">Ninguém abaixo dos mínimos nesta turma.</p>
        ) : (
          <ul className="space-y-1.5">
            {risco.map(({ student, motivos }) => (
              <li key={student.aluno}>
                <button
                  type="button"
                  onClick={() => onStudent(student)}
                  className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-left hover:border-primary"
                >
                  <span className="block font-semibold text-fg">{student.aluno}</span>
                  <span className="block text-sm">{motivos[0]}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}

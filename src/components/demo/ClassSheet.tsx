import clsx from 'clsx';
import { Icon } from '@/components/icons';
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
    <Modal
      open
      onClose={onClose}
      variant="side"
      title={`Turma ${t.turma}`}
      subtitle={
        <span className="flex items-center gap-2 font-semibold">
          <span className={clsx('size-2.5 rounded-full', LEVEL_DOT[level])} aria-hidden="true" />
          Situação: {LEVEL_LABEL[level]} · {formatNumber(riskShare(t.emRisco, t.alunos), 0)}% em
          risco
        </span>
      }
    >
      <dl className="grid grid-cols-3 gap-2">
        {(
          [
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
          ] as const
        ).map(([label, value, delta]) => (
          <div key={label} className="rounded-xl bg-bg px-3 py-2">
            <dt className="text-xs font-semibold">{label}</dt>
            <dd className="font-display text-xl font-extrabold text-fg">{value}</dd>
            {delta && <dd>{delta}</dd>}
          </div>
        ))}
      </dl>

      {analysis.disciplinas.length > 0 && (
        <section>
          <h3 className="mb-1.5 text-sm font-semibold text-fg">Média por disciplina</h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {analysis.disciplinas.map((disc) => {
              const v = t.mediasPorDisciplina[disc];
              const low = v !== null && v < mediaMin;
              return (
                <div key={disc} className="flex justify-between gap-2 border-b border-border py-1">
                  <dt>{disc}</dt>
                  <dd className={clsx('font-bold', low ? 'text-danger' : 'text-fg')}>
                    {v === null ? '—' : formatNumber(v)}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>
      )}

      <section>
        <h3 className="mb-1.5 text-sm font-semibold text-fg">Alunos em risco ({risco.length})</h3>
        {risco.length === 0 ? (
          <p className="text-sm">Ninguém abaixo dos mínimos nesta turma.</p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
            {risco.map(({ student, motivos }) => (
              <li key={student.aluno}>
                <button
                  type="button"
                  onClick={() => onStudent(student)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-muted"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-fg">{student.aluno}</span>
                    <span className="block truncate text-sm text-danger">{motivos[0]}</span>
                  </span>
                  <Icon name="arrow" size={16} className="shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Modal>
  );
}

'use client';

import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import type { RosterEntry } from '@/lib/attendance/types';

const subscribeNoop = () => () => {};
const useMounted = () =>
  useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

export const MATRICULA_AVISO =
  'Uso da portaria. Não afixar. Informe a matrícula só ao próprio aluno.';

/** Turmas em ordem e, em cada uma, os alunos em ordem alfabética. */
export function rosterByClass(roster: RosterEntry[]): { turma: string; alunos: RosterEntry[] }[] {
  const byClass = new Map<string, RosterEntry[]>();
  for (const r of roster) byClass.set(r.turma, [...(byClass.get(r.turma) ?? []), r]);
  return [...byClass.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'pt-BR', { numeric: true }))
    .map(([turma, alunos]) => ({
      turma,
      alunos: [...alunos].sort((a, b) => a.aluno.localeCompare(b.aluno, 'pt-BR')),
    }));
}

/**
 * Lista de matrículas para imprimir (uma folha por turma), para a portaria dizer a matrícula a
 * quem não lembra. Só aparece na impressão.
 */
export function MatriculaPrint({
  roster,
  impressoEm,
}: {
  roster: RosterEntry[];
  impressoEm: Date;
}) {
  const mounted = useMounted();
  if (!mounted) return null;
  const data = impressoEm.toLocaleDateString('pt-BR');
  return createPortal(
    <div className="print-only qr-light bg-surface text-fg" data-testid="lista-matriculas">
      {rosterByClass(roster).map(({ turma, alunos }) => (
        <section key={turma} className="print-page p-8">
          <h2 className="text-xl font-bold">
            Turma {turma} · impresso em {data}
          </h2>
          <table className="mt-4 w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border-b border-fg py-1 text-left">Aluno</th>
                <th className="border-b border-fg py-1 text-left">Matrícula</th>
              </tr>
            </thead>
            <tbody>
              {alunos.map((a) => (
                <tr key={a.key}>
                  <td className="border-b border-border py-1">{a.aluno}</td>
                  <td className="border-b border-border py-1 tabular-nums">{a.matricula}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-xs font-semibold">{MATRICULA_AVISO}</p>
        </section>
      ))}
    </div>,
    document.body,
  );
}

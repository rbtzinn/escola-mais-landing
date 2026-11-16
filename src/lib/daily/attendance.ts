import type { LateRecord, RosterEntry } from '@/lib/attendance/types';

/** Chamada do 1º horário de uma turma: o professor marca só quem faltou. */
export interface ChamadaTurma {
  turma: string;
  /** Chaves (`studentKey`) dos alunos ausentes. */
  ausentes: string[];
  por: string;
  /** Hora real em que a chamada foi salva (ISO). */
  em: string;
}

export type Chamadas = Record<string, ChamadaTurma>;

export interface ClassPresence {
  turma: string;
  alunos: number;
  ausentes: number;
  presentes: number;
  atrasados: number;
  chamadaFeita: boolean;
}

const byTurma = (a: string, b: string) => a.localeCompare(b, 'pt-BR', { numeric: true });

/**
 * Ausentes de hoje: marcados na chamada, menos quem chegou atrasado depois
 * (o registro de atraso prova que o aluno está na escola).
 */
export function absentKeys(chamadas: Chamadas, records: LateRecord[]): Set<string> {
  const atrasados = new Set(records.map((r) => r.key));
  const out = new Set<string>();
  for (const c of Object.values(chamadas))
    for (const k of c.ausentes) if (!atrasados.has(k)) out.add(k);
  return out;
}

/** Presentes por turma. Sem chamada, a turma aparece como pendente (presentes = alunos). */
export function presenceByClass(
  roster: RosterEntry[],
  chamadas: Chamadas,
  records: LateRecord[],
): ClassPresence[] {
  const ausentes = absentKeys(chamadas, records);
  const atrasados = new Set(records.map((r) => r.key));
  const turmas = new Map<string, RosterEntry[]>();
  for (const r of roster) turmas.set(r.turma, [...(turmas.get(r.turma) ?? []), r]);
  return [...turmas.entries()]
    .sort(([a], [b]) => byTurma(a, b))
    .map(([turma, alunos]) => {
      const aus = alunos.filter((a) => ausentes.has(a.key)).length;
      return {
        turma,
        alunos: alunos.length,
        ausentes: aus,
        presentes: alunos.length - aus,
        atrasados: alunos.filter((a) => atrasados.has(a.key)).length,
        chamadaFeita: Boolean(chamadas[turma]),
      };
    });
}

/** Totais da escola: presentes só contam turmas com chamada feita. */
export function presenceTotal(list: ClassPresence[]) {
  const feitas = list.filter((c) => c.chamadaFeita);
  return {
    presentes: feitas.reduce((s, c) => s + c.presentes, 0),
    alunosComChamada: feitas.reduce((s, c) => s + c.alunos, 0),
    alunos: list.reduce((s, c) => s + c.alunos, 0),
    turmasComChamada: feitas.length,
    turmas: list.length,
  };
}

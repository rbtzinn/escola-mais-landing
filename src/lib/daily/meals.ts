import { toMinutes } from '@/lib/attendance/clock';
import type { LateRecord, RosterEntry } from '@/lib/attendance/types';
import { type Chamadas, absentKeys } from './attendance';

/** Resposta do aluno no celular: true = vou comer, false = não vou. Sem chave = não respondeu. */
export type Meals = Record<string, boolean>;

export const DEFAULT_MEAL_DEADLINE = '09:00';

export interface ClassMeals {
  turma: string;
  /** Alunos considerados na conta: presentes (com chamada) ou todos (sem chamada). */
  base: number;
  vaoComer: number;
  naoVao: number;
  semResposta: number;
  /** Turma sem chamada: a conta usa todos os alunos e é uma estimativa. */
  estimado: boolean;
}

/**
 * Refeições por turma. Quem está presente e não respondeu conta como "vai comer"
 * (o aluno sem celular não fica sem merenda); ausente e "não vou" saem da conta.
 */
export function mealCount(
  roster: RosterEntry[],
  chamadas: Chamadas,
  records: LateRecord[],
  meals: Meals,
): ClassMeals[] {
  const ausentes = absentKeys(chamadas, records);
  const turmas = new Map<string, RosterEntry[]>();
  for (const r of roster) turmas.set(r.turma, [...(turmas.get(r.turma) ?? []), r]);
  return [...turmas.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'pt-BR', { numeric: true }))
    .map(([turma, alunos]) => {
      const presentes = alunos.filter((a) => !ausentes.has(a.key));
      const naoVao = presentes.filter((a) => meals[a.key] === false).length;
      const semResposta = presentes.filter((a) => meals[a.key] === undefined).length;
      return {
        turma,
        base: presentes.length,
        vaoComer: presentes.length - naoVao,
        naoVao,
        semResposta,
        estimado: !chamadas[turma],
      };
    });
}

export const mealTotal = (list: ClassMeals[]) => list.reduce((s, c) => s + c.vaoComer, 0);

/** A resposta pelo celular vale até o prazo (padrão 9h00); depois, a cozinha fecha a conta. */
export function mealWindow(now: Date, ate = DEFAULT_MEAL_DEADLINE): 'aberto' | 'encerrado' {
  const limite = toMinutes(ate) ?? 9 * 60;
  return now.getHours() * 60 + now.getMinutes() <= limite ? 'aberto' : 'encerrado';
}

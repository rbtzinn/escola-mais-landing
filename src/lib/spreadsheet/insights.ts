import { formatNumber } from './numbers';
import type { Analysis, ClassSummary, Student } from './types';

/** Situação em semáforo: verde (ok), amarelo (atenção) e vermelho (crítico). */
export type Level = 'ok' | 'atencao' | 'critico';

/** Até 10% dos alunos em risco: ok. Até 20%: atenção. Acima: crítico. */
export const LEVEL_LIMITS = { ok: 10, atencao: 20 } as const;

export const LEVEL_LABEL: Record<Level, string> = {
  ok: 'Tranquila',
  atencao: 'Atenção',
  critico: 'Crítica',
};

/** Percentual (0 a 100) de alunos em risco. */
export const riskShare = (emRisco: number, alunos: number): number =>
  alunos > 0 ? (100 * emRisco) / alunos : 0;

export function levelFor(pctRisco: number): Level {
  if (pctRisco <= LEVEL_LIMITS.ok) return 'ok';
  if (pctRisco <= LEVEL_LIMITS.atencao) return 'atencao';
  return 'critico';
}

export const schoolLevel = (a: Analysis): Level =>
  levelFor(riskShare(a.kpis.emRisco, a.kpis.alunos));

export const classLevel = (t: ClassSummary): Level => levelFor(riskShare(t.emRisco, t.alunos));

/** Turmas da mais para a menos crítica (% em risco, depois frequência mais baixa). */
export function rankClasses(a: Analysis): ClassSummary[] {
  return [...a.turmas].sort(
    (x, y) =>
      riskShare(y.emRisco, y.alunos) - riskShare(x.emRisco, x.alunos) ||
      (x.frequencia ?? 101) - (y.frequencia ?? 101) ||
      x.turma.localeCompare(y.turma, 'pt-BR', { numeric: true }),
  );
}

const plural = (n: number, um: string, varios: string) =>
  `${n.toLocaleString('pt-BR')} ${n === 1 ? um : varios}`;

/** Detalhe mais forte da turma para a frase: risco, frequência ou média. */
function classDetail(t: ClassSummary, a: Analysis): string {
  const parts = [`${formatNumber(riskShare(t.emRisco, t.alunos), 0)}% em risco`];
  if (t.frequencia !== null && t.frequencia < a.options.freqMin)
    parts.push(`frequência de ${formatNumber(t.frequencia, 0)}%`);
  else if (t.media !== null && t.media < a.options.mediaMin)
    parts.push(`média ${formatNumber(t.media)}`);
  return parts.join(', ');
}

/** Frase-resumo que responde "como está a escola?" em uma leitura. */
export function headline(a: Analysis): { title: string; detail: string } {
  const { emRisco, alunos } = a.kpis;
  if (alunos === 0) return { title: 'Nenhum aluno na planilha.', detail: '' };
  if (emRisco === 0)
    return {
      title: 'Nenhum aluno precisa de atenção agora.',
      detail: `${plural(alunos, 'aluno', 'alunos')} acima dos mínimos de frequência e de média.`,
    };
  const pior = rankClasses(a)[0];
  const title = `${plural(emRisco, 'aluno precisa', 'alunos precisam')} de atenção.`;
  const detail =
    a.turmas.length > 1 && pior.emRisco > 0
      ? `A turma ${pior.turma} é a mais crítica (${classDetail(pior, a)}).`
      : `${formatNumber(riskShare(emRisco, alunos), 0)}% dos alunos estão abaixo dos mínimos.`;
  return { title, detail };
}

export type Action =
  | { kind: 'aluno'; title: string; detail: string; student: Student }
  | { kind: 'turma'; title: string; detail: string; turma: string }
  | { kind: 'atrasos'; title: string; detail: string };

/** Pior disciplina da turma (menor média abaixo do mínimo), se houver. */
function worstSubject(t: ClassSummary, min: number): [string, number] | null {
  const abaixo = Object.entries(t.mediasPorDisciplina)
    .filter((e): e is [string, number] => e[1] !== null && e[1] < min)
    .sort((x, y) => x[1] - y[1]);
  return abaixo[0] ?? null;
}

/** Até 3 ações concretas para hoje, da mais urgente para a menos. */
export function todayActions(a: Analysis): Action[] {
  const actions: Action[] = [];
  const [primeiro, ...outros] = a.risco;

  if (primeiro)
    actions.push({
      kind: 'aluno',
      title: `Falar com a família de ${primeiro.student.aluno}`,
      detail: `${primeiro.student.turma} · ${primeiro.motivos[0]}`,
      student: primeiro.student,
    });

  const pior = rankClasses(a).find((t) => t.emRisco > 0);
  if (pior && a.turmas.length > 1) {
    const materia = worstSubject(pior, a.options.mediaMin);
    actions.push({
      kind: 'turma',
      title: materia
        ? `Rever ${materia[0]} com a turma ${pior.turma}`
        : `Acompanhar a turma ${pior.turma}`,
      detail: materia
        ? `Média ${formatNumber(materia[1])} na disciplina · ${plural(pior.emRisco, 'aluno', 'alunos')} em risco`
        : classDetail(pior, a),
      turma: pior.turma,
    });
  }

  if (a.atrasos.length > 0)
    actions.push({
      kind: 'atrasos',
      title: `Avisar ${plural(a.atrasos.length, 'família', 'famílias')} sobre atrasos`,
      detail: `Alunos com ${a.options.atrasosMin} atrasos ou mais`,
    });

  for (const r of outros) {
    if (actions.length >= 3) break;
    actions.push({
      kind: 'aluno',
      title: `Falar com a família de ${r.student.aluno}`,
      detail: `${r.student.turma} · ${r.motivos[0]}`,
      student: r.student,
    });
  }
  return actions.slice(0, 3);
}

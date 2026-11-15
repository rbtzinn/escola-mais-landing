import { normalizeText } from '@/lib/text';
import type { Analysis } from './types';

/** Diferença atual − anterior (null quando falta um dos lados). */
export type Delta = number | null;

const diff = (a: number | null | undefined, b: number | null | undefined): Delta =>
  a === null || a === undefined || b === null || b === undefined ? null : a - b;

export interface StudentDelta {
  frequencia: Delta;
  media: Delta;
  /** Estava em risco na planilha anterior. */
  estavaEmRisco: boolean;
}

export interface Comparison {
  kpis: {
    frequenciaGeral: Delta;
    mediaGeral: Delta;
    emRisco: Delta;
    comAtrasos: Delta;
  };
  turmas: Record<string, { frequencia: Delta; media: Delta; emRisco: Delta }>;
  /** Chave: `studentKey(aluno, turma)`. Só alunos presentes nas duas planilhas. */
  alunos: Record<string, StudentDelta>;
  /** Alunos em risco agora que não estavam antes. */
  entraram: number;
  /** Alunos que estavam em risco e saíram. */
  sairam: number;
  /** Alunos encontrados nas duas planilhas. */
  emComum: number;
}

/** Casa o aluno pelo nome (sem acento/maiúsculas); a turma desempata nomes repetidos. */
export const studentKey = (aluno: string, turma: string) =>
  `${normalizeText(aluno)}|${normalizeText(turma)}`;

/** Compara a planilha atual com uma anterior (ex.: 2º bimestre × 1º bimestre). */
export function compare(atual: Analysis, anterior: Analysis): Comparison {
  const riscoAntes = new Set(
    anterior.risco.map((r) => studentKey(r.student.aluno, r.student.turma)),
  );
  const riscoAgora = new Set(atual.risco.map((r) => studentKey(r.student.aluno, r.student.turma)));
  const antes = new Map(anterior.students.map((s) => [studentKey(s.aluno, s.turma), s]));

  const alunos: Record<string, StudentDelta> = {};
  let entraram = 0;
  let sairam = 0;
  for (const s of atual.students) {
    const k = studentKey(s.aluno, s.turma);
    const p = antes.get(k);
    if (!p) continue;
    alunos[k] = {
      frequencia: diff(s.frequencia, p.frequencia),
      media: diff(s.media, p.media),
      estavaEmRisco: riscoAntes.has(k),
    };
    if (riscoAgora.has(k) && !riscoAntes.has(k)) entraram++;
    if (!riscoAgora.has(k) && riscoAntes.has(k)) sairam++;
  }

  const turmasAntes = new Map(anterior.turmas.map((t) => [normalizeText(t.turma), t]));
  const turmas: Comparison['turmas'] = {};
  for (const t of atual.turmas) {
    const p = turmasAntes.get(normalizeText(t.turma));
    if (!p) continue;
    turmas[t.turma] = {
      frequencia: diff(t.frequencia, p.frequencia),
      media: diff(t.media, p.media),
      emRisco: t.emRisco - p.emRisco,
    };
  }

  return {
    kpis: {
      frequenciaGeral: diff(atual.kpis.frequenciaGeral, anterior.kpis.frequenciaGeral),
      mediaGeral: diff(atual.kpis.mediaGeral, anterior.kpis.mediaGeral),
      emRisco: atual.kpis.emRisco - anterior.kpis.emRisco,
      comAtrasos: atual.kpis.comAtrasos - anterior.kpis.comAtrasos,
    },
    turmas,
    alunos,
    entraram,
    sairam,
    emComum: Object.keys(alunos).length,
  };
}

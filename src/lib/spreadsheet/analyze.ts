import { formatNumber, parseNumber } from './numbers';
import type {
  Analysis,
  ClassSummary,
  Mapping,
  Options,
  RawTable,
  RiskItem,
  Student,
} from './types';

const mean = (values: number[]): number | null =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;

const present = (values: (number | null)[]): number[] =>
  values.filter((v): v is number => v !== null);

/**
 * Transforma a planilha em indicadores: frequência e média por turma, alunos em risco
 * (frequência ou média abaixo do mínimo) e alunos com atrasos. Tudo calculado no navegador.
 */
export function analyze(table: RawTable, mapping: Mapping, options: Options): Analysis {
  const { aluno: ci, turma: ti } = mapping;
  const disciplinas = mapping.disciplinas.map((i) => table.headers[i]);
  const avisos: string[] = [];
  const students: Student[] = [];
  let ignoradas = 0;
  let notasInvalidas = 0;
  let faltasAcima = 0;

  for (const row of table.rows) {
    const nome = ci === null ? '' : (row[ci] ?? '').trim();
    const turma = ti === null ? '' : (row[ti] ?? '').trim();
    if (!nome || !turma) {
      ignoradas++;
      continue;
    }
    const faltas = mapping.faltas === null ? null : parseNumber(row[mapping.faltas] ?? '');
    const atrasos = mapping.atrasos === null ? null : parseNumber(row[mapping.atrasos] ?? '');
    const telefone =
      mapping.telefone === null ? null : (row[mapping.telefone] ?? '').trim() || null;
    const matricula =
      mapping.matricula === null ? null : (row[mapping.matricula] ?? '').trim() || null;
    const nascimento =
      mapping.nascimento === null ? null : (row[mapping.nascimento] ?? '').trim() || null;

    let frequencia: number | null = null;
    if (faltas !== null && options.diasLetivos > 0) {
      if (faltas > options.diasLetivos) faltasAcima++;
      frequencia = Math.min(100, Math.max(0, 100 * (1 - faltas / options.diasLetivos)));
    }

    const notas: Record<string, number> = {};
    mapping.disciplinas.forEach((col, k) => {
      const n = parseNumber(row[col] ?? '');
      if (n === null) return;
      if (n < 0 || n > 10) notasInvalidas++;
      else notas[disciplinas[k]] = n;
    });
    const media = mean(Object.values(notas));

    students.push({
      aluno: nome,
      turma,
      faltas,
      atrasos,
      frequencia,
      media,
      notas,
      telefone,
      matricula,
      nascimento,
    });
  }

  if (ignoradas) avisos.push(`${ignoradas} linha(s) sem aluno ou turma foram ignoradas.`);
  if (notasInvalidas)
    avisos.push(`${notasInvalidas} nota(s) fora do intervalo de 0 a 10 foram ignoradas.`);
  if (faltasAcima)
    avisos.push(`${faltasAcima} aluno(s) têm mais faltas que os dias letivos informados.`);

  // Risco: frequência ou média abaixo do mínimo.
  const risco: RiskItem[] = [];
  for (const s of students) {
    const motivos: string[] = [];
    let gravidade = 0;
    if (s.frequencia !== null && s.frequencia < options.freqMin) {
      motivos.push(`Frequência ${formatNumber(s.frequencia, 0)}% (mínimo ${options.freqMin}%)`);
      gravidade += (options.freqMin - s.frequencia) / options.freqMin;
    }
    if (s.media !== null && s.media < options.mediaMin) {
      motivos.push(`Média ${formatNumber(s.media)} (mínimo ${formatNumber(options.mediaMin)})`);
      gravidade += (options.mediaMin - s.media) / options.mediaMin;
      const baixas = Object.entries(s.notas)
        .filter(([, n]) => n < options.mediaMin)
        .map(([d, n]) => `${d} (${formatNumber(n)})`);
      if (baixas.length) motivos.push(`Abaixo da média em: ${baixas.join(', ')}`);
    }
    if (motivos.length) risco.push({ student: s, motivos, gravidade });
  }
  risco.sort((a, b) => b.gravidade - a.gravidade || a.student.aluno.localeCompare(b.student.aluno));
  const emRisco = new Set(risco.map((r) => r.student));

  // Resumo por turma (ordem natural: 6º A, 7º A, 10º A...).
  const grupos = new Map<string, Student[]>();
  for (const s of students) grupos.set(s.turma, [...(grupos.get(s.turma) ?? []), s]);
  const turmas: ClassSummary[] = [...grupos.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'pt-BR', { numeric: true }))
    .map(([turma, alunos]) => ({
      turma,
      alunos: alunos.length,
      frequencia: mean(present(alunos.map((s) => s.frequencia))),
      media: mean(present(alunos.map((s) => s.media))),
      mediasPorDisciplina: Object.fromEntries(
        disciplinas.map((d) => [
          d,
          mean(alunos.map((s) => s.notas[d]).filter((n) => n !== undefined)),
        ]),
      ),
      emRisco: alunos.filter((s) => emRisco.has(s)).length,
    }));

  const atrasos = students
    .filter((s) => s.atrasos !== null && s.atrasos >= options.atrasosMin)
    .sort((a, b) => (b.atrasos ?? 0) - (a.atrasos ?? 0) || a.aluno.localeCompare(b.aluno));

  return {
    disciplinas,
    students,
    turmas,
    risco,
    atrasos,
    kpis: {
      alunos: students.length,
      frequenciaGeral: mean(present(students.map((s) => s.frequencia))),
      mediaGeral: mean(present(students.map((s) => s.media))),
      emRisco: risco.length,
      comAtrasos: atrasos.length,
    },
    avisos,
    options,
  };
}

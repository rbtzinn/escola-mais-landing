import { normalizeText } from '@/lib/text';
import { parseNumber } from './numbers';
import type { Mapping, RawTable } from './types';

const findHeader = (headers: string[], words: string[], skip: Set<number>) =>
  headers.findIndex((h, i) => !skip.has(i) && words.some((w) => normalizeText(h).includes(w)));

/** Coluna numérica com notas plausíveis: ao menos 60% das células preenchidas são números de 0 a 10. */
function looksLikeGrades(table: RawTable, col: number): boolean {
  const cells = table.rows.map((r) => r[col]).filter((c) => c !== '');
  if (cells.length === 0) return false;
  const nums = cells.map(parseNumber).filter((n): n is number => n !== null);
  return nums.length / cells.length >= 0.6 && nums.every((n) => n >= 0 && n <= 10);
}

/** Sugere o mapeamento de colunas pelos nomes dos cabeçalhos (sem acento, sem maiúsculas). */
export function guessMapping(table: RawTable): Mapping {
  const used = new Set<number>();
  const pick = (words: string[]) => {
    const i = findHeader(table.headers, words, used);
    if (i >= 0) used.add(i);
    return i >= 0 ? i : null;
  };
  const turma = pick(['turma', 'serie', 'classe']);
  const aluno = pick(['aluno', 'estudante', 'nome']);
  const faltas = pick(['falta']);
  const atrasos = pick(['atraso']);
  const disciplinas = table.headers
    .map((_, i) => i)
    .filter((i) => !used.has(i) && looksLikeGrades(table, i));
  return { aluno, turma, faltas, atrasos, disciplinas };
}

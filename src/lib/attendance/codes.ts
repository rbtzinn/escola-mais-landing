import { studentKey } from '@/lib/spreadsheet/compare';
import type { Student } from '@/lib/spreadsheet/types';
import { normalizeText } from '@/lib/text';
import { parseBirthday } from './birthday';
import type { RosterEntry } from './types';

/** Hash FNV-1a de 32 bits: estável e rápido. */
function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Matrícula de 6 dígitos, estável, para planilhas sem coluna de matrícula (e para a escola de exemplo). */
export function matriculaFor(aluno: string, turma: string, salt = 0): string {
  return String(100000 + (fnv1a(`${studentKey(aluno, turma)}#${salt}`) % 900000));
}

/** Só os dígitos: "20.451-3" e "204513" são a mesma matrícula. */
export const normalizeMatricula = (raw: string) => raw.replace(/\D/g, '');

/** Lista de alunos que podem ser registrados, cada um com uma matrícula única. */
export function buildRoster(students: Student[]): RosterEntry[] {
  const used = new Set<string>();
  return students.map((s) => {
    let matricula = s.matricula ? normalizeMatricula(s.matricula) : '';
    let salt = 0;
    if (!matricula || used.has(matricula)) {
      matricula = matriculaFor(s.aluno, s.turma);
      while (used.has(matricula)) matricula = matriculaFor(s.aluno, s.turma, ++salt);
    }
    used.add(matricula);
    return {
      key: studentKey(s.aluno, s.turma),
      aluno: s.aluno,
      turma: s.turma,
      matricula,
      telefone: s.telefone,
      nascimento: parseBirthday(s.nascimento),
    };
  });
}

/** Acha o aluno pela matrícula, só dentro da turma escolhida (o link é público). */
export function findByMatricula(
  roster: RosterEntry[],
  turma: string,
  raw: string,
): RosterEntry | null {
  const m = normalizeMatricula(raw);
  if (!m) return null;
  const t = normalizeText(turma);
  return roster.find((r) => r.matricula === m && normalizeText(r.turma) === t) ?? null;
}

/** Nome para tela pública (link do aluno): primeiro nome + inicial do último. */
export function publicName(aluno: string): string {
  const parts = aluno.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const last = parts[parts.length - 1].replace(/\.$/, '');
  return `${parts[0]} ${last[0]}.`;
}

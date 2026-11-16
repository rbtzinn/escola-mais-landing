import { studentKey } from '@/lib/spreadsheet/compare';
import type { Student } from '@/lib/spreadsheet/types';
import type { RosterEntry } from './types';

// Base32 sem letras confundíveis (sem 0/O, 1/I/L).
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/** Hash FNV-1a de 32 bits: estável e rápido, suficiente para um código de carteirinha. */
function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Código opaco da carteirinha, ex.: "EM-7K2P9Q". Não contém nome nem turma:
 * se a carteirinha for perdida, quem achar não descobre de quem é.
 */
export function studentCode(aluno: string, turma: string, salt = 0): string {
  let n = fnv1a(`${studentKey(aluno, turma)}#${salt}`);
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += ALPHABET[n % ALPHABET.length];
    n = Math.floor(n / ALPHABET.length);
  }
  return `EM-${out}`;
}

/** Normaliza o que veio do QR ou foi digitado: "em 7k2p9q" → "EM-7K2P9Q". */
export function normalizeCode(raw: string): string {
  const s = raw.toUpperCase().replace(/[^0-9A-Z]/g, '');
  const body = s.startsWith('EM') ? s.slice(2) : s;
  return `EM-${body}`;
}

/** Lista de alunos que podem ser registrados, com um código único para cada um. */
export function buildRoster(students: Student[]): RosterEntry[] {
  const used = new Set<string>();
  return students.map((s) => {
    let salt = 0;
    let code = studentCode(s.aluno, s.turma);
    while (used.has(code)) code = studentCode(s.aluno, s.turma, ++salt);
    used.add(code);
    return {
      key: studentKey(s.aluno, s.turma),
      aluno: s.aluno,
      turma: s.turma,
      code,
      telefone: s.telefone,
    };
  });
}

export function findByCode(roster: RosterEntry[], raw: string): RosterEntry | null {
  const code = normalizeCode(raw);
  return roster.find((r) => r.code === code) ?? null;
}

/** Nome para tela pública (totem): primeiro nome + inicial do último. */
export function publicName(aluno: string): string {
  const parts = aluno.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const last = parts[parts.length - 1].replace(/\.$/, '');
  return `${parts[0]} ${last[0]}.`;
}

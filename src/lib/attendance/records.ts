import { studentKey } from '@/lib/spreadsheet/compare';
import { parseNumber } from '@/lib/spreadsheet/numbers';
import type { Mapping, RawTable } from '@/lib/spreadsheet/types';
import { lateness, sameDay } from './clock';
import type { Channel, ClockSettings, LateRecord, Motivo, RosterEntry } from './types';

export interface RegisterInput {
  entry: Pick<RosterEntry, 'key' | 'aluno' | 'turma'>;
  channel: Channel;
  registradoPor: string;
  at: Date;
  settings: ClockSettings;
  motivo?: Motivo | null;
}

export type RegisterResult =
  | { status: 'novo'; records: LateRecord[]; record: LateRecord }
  | { status: 'duplicado'; records: LateRecord[]; record: LateRecord }
  | { status: 'no-horario'; records: LateRecord[]; minutos: number };

/**
 * Registra a chegada atrasada. Um registro por aluno por dia, venha de onde vier:
 * se outro canal já registrou, devolve o registro existente.
 */
export function register(records: LateRecord[], input: RegisterInput): RegisterResult {
  const existing = records.find(
    (r) => r.key === input.entry.key && sameDay(new Date(r.at), input.at),
  );
  if (existing) return { status: 'duplicado', records, record: existing };

  const { atrasado, minutos } = lateness(input.at, input.settings);
  if (!atrasado) return { status: 'no-horario', records, minutos };

  const record: LateRecord = {
    id: `${input.entry.key}@${input.at.toISOString()}`,
    key: input.entry.key,
    aluno: input.entry.aluno,
    turma: input.entry.turma,
    at: input.at.toISOString(),
    minutos,
    channel: input.channel,
    registradoPor: input.registradoPor.trim() || input.channel,
    motivo: input.motivo ?? null,
    justificado: false,
    liberado: null,
    aviso: 'pendente',
  };
  return { status: 'novo', records: [record, ...records], record };
}

export type RecordPatch = Partial<
  Pick<LateRecord, 'motivo' | 'justificado' | 'liberado' | 'aviso'>
>;

/** Atualiza um registro. Justificar dispensa o aviso pendente; tirar a justificativa o devolve à fila. */
export function updateRecord(records: LateRecord[], id: string, patch: RecordPatch): LateRecord[] {
  return records.map((r) => {
    if (r.id !== id) return r;
    const next = { ...r, ...patch };
    if (patch.justificado === true && r.aviso === 'pendente') next.aviso = 'dispensado';
    if (patch.justificado === false && r.aviso === 'dispensado') next.aviso = 'pendente';
    return next;
  });
}

/** Avisos que a coordenação ainda precisa mandar, do mais antigo para o mais novo. */
export const pendingNotices = (records: LateRecord[]) =>
  records
    .filter((r) => !r.justificado && r.aviso === 'pendente')
    .sort((a, b) => a.at.localeCompare(b.at));

/** Atrasos registrados que contam para o total (os justificados não contam). */
export function countByStudent(records: LateRecord[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const r of records) if (!r.justificado) out.set(r.key, (out.get(r.key) ?? 0) + 1);
  return out;
}

/**
 * Soma os atrasos registrados ao total da planilha, sem mudar a análise.
 * Se a planilha não tem coluna de atrasos, cria "Atrasos (registrados)".
 */
export function applyLateRecords(
  table: RawTable,
  mapping: Mapping,
  records: LateRecord[],
): { table: RawTable; mapping: Mapping } {
  const counts = countByStudent(records);
  if (counts.size === 0 || mapping.aluno === null || mapping.turma === null)
    return { table, mapping };
  const { aluno, turma } = mapping;
  const keyOf = (row: string[]) => studentKey(row[aluno] ?? '', row[turma] ?? '');

  if (mapping.atrasos === null) {
    const col = table.headers.length;
    return {
      table: {
        headers: [...table.headers, 'Atrasos (registrados)'],
        rows: table.rows.map((row) => [...row, String(counts.get(keyOf(row)) ?? 0)]),
      },
      mapping: { ...mapping, atrasos: col },
    };
  }

  const col = mapping.atrasos;
  return {
    table: {
      headers: table.headers,
      rows: table.rows.map((row) => {
        const n = counts.get(keyOf(row));
        if (!n) return row;
        const copy = [...row];
        copy[col] = String((parseNumber(row[col] ?? '') ?? 0) + n);
        return copy;
      }),
    },
    mapping,
  };
}

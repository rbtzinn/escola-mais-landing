import { describe, expect, it } from 'vitest';
import { addMinutes, checkinWindow, formatHora, lateness, nowFor } from '@/lib/attendance/clock';
import { buildRoster, findByMatricula, matriculaFor, publicName } from '@/lib/attendance/codes';
import { lateMessage } from '@/lib/attendance/message';
import {
  applyLateRecords,
  canUndo,
  pendingNotices,
  register,
  removeRecord,
  undoSecondsLeft,
  updateRecord,
} from '@/lib/attendance/records';
import { DEFAULT_CLOCK, type LateRecord } from '@/lib/attendance/types';
import { analyze } from '@/lib/spreadsheet/analyze';
import { guessMapping } from '@/lib/spreadsheet/columns';
import { studentKey } from '@/lib/spreadsheet/compare';
import { parseCsv } from '@/lib/spreadsheet/parseCsv';
import { DEFAULT_OPTIONS } from '@/lib/spreadsheet/types';

const at = (hhmm: string, day = 16) => {
  const [h, m] = hhmm.split(':').map(Number);
  return new Date(2026, 10, day, h, m);
};
const ana = { key: studentKey('Ana Souza', '6A'), aluno: 'Ana Souza', turma: '6A' };
const bia = { key: studentKey('Bia', '6A'), aluno: 'Bia', turma: '6A' };
const base = { settings: DEFAULT_CLOCK, registradoPor: 'Sr. José', channel: 'portaria' as const };

describe('matrícula', () => {
  const roster = (csv: string) => {
    const t = parseCsv(csv);
    return buildRoster(analyze(t, guessMapping(t), DEFAULT_OPTIONS).students);
  };

  it('gera 6 dígitos estáveis quando a planilha não tem matrícula', () => {
    const m = matriculaFor('Ana Souza', '6º A');
    expect(m).toMatch(/^\d{6}$/);
    expect(matriculaFor('ana souza', '6º a')).toBe(m);
    const r = roster('Aluno;Turma\nAna;6A\nBia;6A');
    expect(r.map((x) => x.matricula)).toEqual([
      matriculaFor('Ana', '6A'),
      matriculaFor('Bia', '6A'),
    ]);
  });

  it('usa a coluna de matrícula da planilha (só os dígitos)', () => {
    const r = roster('Matrícula;Aluno;Turma\n20.451-3;Ana;6A\n;Bia;6A');
    expect(r[0].matricula).toBe('204513');
    expect(r[1].matricula).toBe(matriculaFor('Bia', '6A')); // vazia: gerada
  });

  it('só acha o aluno na turma escolhida', () => {
    const r = roster('Matrícula;Aluno;Turma\n111111;Ana;6º A\n222222;Bia;6º B');
    expect(findByMatricula(r, '6º A', ' 111.111 ')?.aluno).toBe('Ana');
    expect(findByMatricula(r, '6º B', '111111')).toBeNull();
    expect(findByMatricula(r, '6º A', '')).toBeNull();
  });

  it('mostra só primeiro nome e inicial na tela pública', () => {
    expect(publicName('Ana Maria Souza')).toBe('Ana S.');
    expect(publicName('Gabriela C.')).toBe('Gabriela C.');
    expect(publicName('Caio')).toBe('Caio');
  });
});

describe('relógio', () => {
  it('usa a hora simulada na data real', () => {
    const d = nowFor(DEFAULT_CLOCK, new Date(2026, 10, 16, 15, 40));
    expect(formatHora(d)).toBe('7h12');
    expect(d.getDate()).toBe(16);
    expect(nowFor({ ...DEFAULT_CLOCK, simulada: null }, at('15:40'))).toEqual(at('15:40'));
  });

  it('só conta atraso depois da tolerância', () => {
    expect(lateness(at('07:10'), DEFAULT_CLOCK)).toEqual({ atrasado: false, minutos: 10 });
    expect(lateness(at('07:11'), DEFAULT_CLOCK)).toEqual({ atrasado: true, minutos: 11 });
    expect(lateness(at('06:50'), DEFAULT_CLOCK)).toEqual({ atrasado: false, minutos: 0 });
  });

  it('o link do aluno só abre perto do horário de entrada', () => {
    expect(checkinWindow(at('06:29'), DEFAULT_CLOCK)).toBe('cedo');
    expect(checkinWindow(at('06:30'), DEFAULT_CLOCK)).toBe('aberto');
    expect(checkinWindow(at('09:00'), DEFAULT_CLOCK)).toBe('aberto');
    expect(checkinWindow(at('09:01'), DEFAULT_CLOCK)).toBe('encerrado');
  });

  it('soma minutos à hora simulada', () => {
    expect(addMinutes('07:58', 5)).toBe('08:03');
    expect(addMinutes('00:02', -5)).toBe('23:57');
  });
});

describe('registros', () => {
  it('registra uma vez por dia, venha de onde vier', () => {
    const r1 = register([], { ...base, entry: ana, at: at('07:25') });
    expect(r1.status).toBe('novo');
    const r2 = register(r1.records, {
      ...base,
      channel: 'professor',
      registradoPor: 'Prof. Rita',
      entry: ana,
      at: at('07:40'),
    });
    expect(r2.status).toBe('duplicado');
    expect(r2.status === 'duplicado' && r2.record.registradoPor).toBe('Sr. José');
    expect(r2.records).toHaveLength(1);
    // Outro dia: novo registro.
    expect(register(r1.records, { ...base, entry: ana, at: at('07:25', 17) }).status).toBe('novo');
  });

  it('não registra chegada dentro da tolerância', () => {
    const r = register([], { ...base, entry: ana, at: at('07:05') });
    expect(r).toEqual({ status: 'no-horario', records: [], minutos: 5 });
  });

  it('justificar tira da fila de avisos e desfazer devolve', () => {
    let records: LateRecord[] = register([], { ...base, entry: ana, at: at('07:25') }).records;
    records = register(records, { ...base, entry: bia, at: at('07:20') }).records;
    expect(pendingNotices(records).map((r) => r.aluno)).toEqual(['Bia', 'Ana Souza']);
    const id = records.find((r) => r.aluno === 'Bia')!.id;
    records = updateRecord(records, id, { justificado: true, motivo: 'saude' });
    expect(pendingNotices(records).map((r) => r.aluno)).toEqual(['Ana Souza']);
    expect(records.find((r) => r.id === id)!.aviso).toBe('dispensado');
    records = updateRecord(records, id, { justificado: false });
    expect(pendingNotices(records)).toHaveLength(2);
  });

  it('soma ao total da planilha, sem contar justificados', () => {
    const table = parseCsv('Aluno;Turma;Atrasos;Nota\nAna Souza;6A;2;7\nBia;6A;;8\nCaio;6B;1;9');
    let records = register([], { ...base, entry: ana, at: at('07:25') }).records;
    records = register(records, { ...base, entry: bia, at: at('07:30') }).records;
    records = updateRecord(records, records[0].id, { justificado: true }); // Bia
    const mapping = guessMapping(table);
    const out = applyLateRecords(table, mapping, records);
    expect(out.table.rows.map((r) => r[2])).toEqual(['3', '', '1']);
    expect(out.mapping).toBe(mapping);
  });

  it('cria a coluna de atrasos quando a planilha não tem', () => {
    const table = parseCsv('Aluno;Turma;Nota\nAna Souza;6A;7\nBia;6A;8');
    const records = register([], { ...base, entry: ana, at: at('07:25') }).records;
    const out = applyLateRecords(table, guessMapping(table), records);
    expect(out.table.headers.at(-1)).toBe('Atrasos (registrados)');
    expect(out.mapping.atrasos).toBe(3);
    expect(out.table.rows.map((r) => r[3])).toEqual(['1', '0']);
  });
});

describe('desfazer e excluir', () => {
  it('quem registrou pode desfazer por 5 minutos (hora real, não a simulada)', () => {
    const criadoEm = new Date(2026, 10, 16, 10, 0, 0);
    const { records } = register([], { ...base, entry: ana, at: at('07:25'), criadoEm });
    const r = records[0];
    expect(undoSecondsLeft(r, new Date(2026, 10, 16, 10, 0, 1))).toBe(299);
    expect(canUndo(r, new Date(2026, 10, 16, 10, 4, 59))).toBe(true);
    expect(canUndo(r, new Date(2026, 10, 16, 10, 5, 0))).toBe(false);
  });

  it('excluir tira o registro e o aviso da fila', () => {
    let records = register([], { ...base, entry: ana, at: at('07:25') }).records;
    records = register(records, { ...base, entry: bia, at: at('07:30') }).records;
    records = removeRecord(records, records[0].id);
    expect(records.map((r) => r.aluno)).toEqual(['Ana Souza']);
    expect(pendingNotices(records)).toHaveLength(1);
  });
});

describe('mensagem para a família', () => {
  it('é mínima: aluno, turma e horário', () => {
    const { records } = register([], {
      ...base,
      entry: ana,
      at: at('07:25'),
      motivo: 'saude',
    });
    const msg = lateMessage(records[0]);
    expect(msg).toContain('Ana Souza (6A) chegou às 7h25 hoje');
    expect(msg).not.toMatch(/saúde|José|portaria/i);
  });
});

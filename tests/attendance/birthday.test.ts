import { describe, expect, it } from 'vitest';
import { parseBirthday, sameBirthday } from '@/lib/attendance/birthday';
import { buildRoster } from '@/lib/attendance/codes';
import { analyze } from '@/lib/spreadsheet/analyze';
import { guessMapping } from '@/lib/spreadsheet/columns';
import { parseCsv } from '@/lib/spreadsheet/parseCsv';
import { sampleTable } from '@/lib/spreadsheet/sample';
import { DEFAULT_OPTIONS } from '@/lib/spreadsheet/types';

const rosterOf = (csv: string) => {
  const t = parseCsv(csv);
  return buildRoster(analyze(t, guessMapping(t), DEFAULT_OPTIONS).students);
};

describe('aniversário', () => {
  it('lê os formatos comuns da planilha', () => {
    for (const raw of [
      '15/03/2012',
      '15-03-2012',
      '15/3',
      '15.03.12',
      '2012-03-15',
      '2012-03-15T00:00:00',
    ])
      expect(parseBirthday(raw)).toEqual({ dia: 15, mes: 3 });
    // Número de série do Excel: 40983 = 15/03/2012.
    expect(parseBirthday('40983')).toEqual({ dia: 15, mes: 3 });
  });

  it('data inválida ou vazia vira null', () => {
    for (const raw of ['31/02/2012', '00/03', '15/13', 'abc', '', null, '2012'])
      expect(parseBirthday(raw)).toBeNull();
    expect(parseBirthday('29/02')).toEqual({ dia: 29, mes: 2 });
  });

  it('a planilha com "Data de nascimento do aluno" não perde a coluna do aluno', () => {
    const t = parseCsv('Aluno;Turma;Data de nascimento do aluno\nAna Souza;6A;15/03/2012');
    const m = guessMapping(t);
    expect(m.aluno).toBe(0);
    expect(m.nascimento).toBe(2);
  });

  it('o roster confere o aniversário; sem a coluna, fica sem confirmação', () => {
    const [ana] = rosterOf('Aluno;Turma;Nascimento\nAna Souza;6A;15/03/2012');
    expect(ana.nascimento).toEqual({ dia: 15, mes: 3 });
    expect(sameBirthday(ana, 15, 3)).toBe(true);
    expect(sameBirthday(ana, 3, 15)).toBe(false);
    const [semData] = rosterOf('Aluno;Turma\nAna Souza;6A');
    expect(semData.nascimento).toBeNull();
    expect(sameBirthday(semData, 15, 3)).toBe(false);
  });

  it('todos os alunos da escola de exemplo têm aniversário válido', () => {
    const t = sampleTable('atual');
    const roster = buildRoster(analyze(t, guessMapping(t), DEFAULT_OPTIONS).students);
    expect(roster).toHaveLength(144);
    expect(roster.every((r) => r.nascimento !== null)).toBe(true);
  });
});

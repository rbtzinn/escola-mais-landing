import { describe, expect, it } from 'vitest';
import { guessMapping } from '@/lib/spreadsheet/columns';
import { parseCsv } from '@/lib/spreadsheet/parseCsv';

describe('guessMapping', () => {
  const table = parseCsv(
    'Nome do Aluno;Série/Turma;Total de Faltas;Atrasos;Português;Matemática;Observação\n' +
      'Ana;6A;3;1;8;7,5;ok\nBia;6A;5;0;6;5;ok\nCaio;6B;0;2;9;10;ok',
  );

  it('reconhece colunas por nome, com acento e maiúsculas', () => {
    const m = guessMapping(table);
    expect(m.aluno).toBe(0);
    expect(m.turma).toBe(1);
    expect(m.faltas).toBe(2);
    expect(m.atrasos).toBe(3);
  });

  it('trata as demais colunas numéricas de 0 a 10 como disciplinas', () => {
    expect(guessMapping(table).disciplinas).toEqual([4, 5]);
  });

  it('não confunde faltas e atrasos com notas', () => {
    expect(guessMapping(table).disciplinas).not.toContain(2);
    expect(guessMapping(table).disciplinas).not.toContain(3);
  });

  it('devolve null quando não encontra', () => {
    const m = guessMapping(parseCsv('X;Y\n1;2'));
    expect(m.aluno).toBeNull();
    expect(m.turma).toBeNull();
  });
});

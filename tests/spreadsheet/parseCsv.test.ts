import { describe, expect, it } from 'vitest';
import { parseCsv } from '@/lib/spreadsheet/parseCsv';

describe('parseCsv', () => {
  it('lê CSV com ponto e vírgula e BOM', () => {
    const t = parseCsv('﻿Aluno;Turma;Nota\r\nAna;6A;7,5\r\nBia;6B;8\r\n');
    expect(t.headers).toEqual(['Aluno', 'Turma', 'Nota']);
    expect(t.rows).toEqual([
      ['Ana', '6A', '7,5'],
      ['Bia', '6B', '8'],
    ]);
  });

  it('lê CSV com vírgula e aspas contendo delimitador e aspas escapadas', () => {
    const t = parseCsv('Aluno,Obs\n"Silva, Ana","disse ""oi"""\n');
    expect(t.rows).toEqual([['Silva, Ana', 'disse "oi"']]);
  });

  it('detecta tabulação e ignora linhas vazias', () => {
    const t = parseCsv('A\tB\n1\t2\n\n3\t4');
    expect(t.rows).toEqual([
      ['1', '2'],
      ['3', '4'],
    ]);
  });

  it('nomeia colunas vazias, desduplica cabeçalhos e completa linhas curtas', () => {
    const t = parseCsv('Nome;;Nome\nAna');
    expect(t.headers).toEqual(['Nome', 'Coluna 2', 'Nome (2)']);
    expect(t.rows).toEqual([['Ana', '', '']]);
  });

  it('retorna tabela vazia para texto vazio', () => {
    expect(parseCsv('')).toEqual({ headers: [], rows: [] });
  });
});

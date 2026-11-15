import { describe, expect, it } from 'vitest';
import { analyze } from '@/lib/spreadsheet/analyze';
import { guessMapping } from '@/lib/spreadsheet/columns';
import { riskToCsv } from '@/lib/spreadsheet/exportCsv';
import { parseCsv } from '@/lib/spreadsheet/parseCsv';
import { DEFAULT_OPTIONS } from '@/lib/spreadsheet/types';

const table = parseCsv(
  [
    'Aluno;Turma;Faltas;Atrasos;Português;Matemática',
    'A1;6A;10;0;8;6',
    'A2;6A;30;4;5;4',
    'A3;6B;0;3;10;10',
    'A4;6B;20;;7;',
  ].join('\n'),
);
const mapping = guessMapping(table);

describe('analyze', () => {
  const a = analyze(table, mapping, DEFAULT_OPTIONS);

  it('calcula frequência e média por aluno', () => {
    const a1 = a.students.find((s) => s.aluno === 'A1')!;
    expect(a1.frequencia).toBe(90);
    expect(a1.media).toBe(7);
    const a4 = a.students.find((s) => s.aluno === 'A4')!;
    expect(a4.frequencia).toBe(80);
    expect(a4.media).toBe(7); // só Português preenchida
  });

  it('resume por turma', () => {
    expect(a.turmas.map((t) => t.turma)).toEqual(['6A', '6B']);
    const t6a = a.turmas[0];
    expect(t6a.alunos).toBe(2);
    expect(t6a.frequencia).toBe(80);
    expect(t6a.media).toBe(5.75);
    expect(t6a.mediasPorDisciplina['Português']).toBe(6.5);
    expect(t6a.emRisco).toBe(1);
    expect(a.turmas[1].mediasPorDisciplina['Matemática']).toBe(10);
  });

  it('lista alunos em risco com os motivos', () => {
    expect(a.risco).toHaveLength(1);
    expect(a.risco[0].student.aluno).toBe('A2');
    expect(a.risco[0].motivos).toEqual([
      'Frequência 70% (mínimo 75%)',
      'Média 4,5 (mínimo 6,0)',
      'Abaixo da média em: Português (5,0), Matemática (4,0)',
    ]);
  });

  it('lista atrasos a partir do limite, do maior para o menor', () => {
    expect(a.atrasos.map((s) => s.aluno)).toEqual(['A2', 'A3']);
  });

  it('calcula os indicadores gerais', () => {
    expect(a.kpis).toEqual({
      alunos: 4,
      frequenciaGeral: 85,
      mediaGeral: 7.125,
      emRisco: 1,
      comAtrasos: 2,
    });
  });

  it('respeita limites alterados', () => {
    const rigido = analyze(table, mapping, { ...DEFAULT_OPTIONS, freqMin: 85, mediaMin: 7.5 });
    expect(rigido.risco.map((r) => r.student.aluno).sort()).toEqual(['A1', 'A2', 'A4']);
    const dias = analyze(table, mapping, { ...DEFAULT_OPTIONS, diasLetivos: 200 });
    expect(dias.students.find((s) => s.aluno === 'A2')!.frequencia).toBe(85);
  });

  it('não quebra com dias letivos zerados', () => {
    const z = analyze(table, mapping, { ...DEFAULT_OPTIONS, diasLetivos: 0 });
    expect(z.students.every((s) => s.frequencia === null)).toBe(true);
    expect(z.kpis.frequenciaGeral).toBeNull();
  });

  it('limita a frequência a 0% e avisa quando faltas passam dos dias letivos', () => {
    const r = analyze(table, mapping, { ...DEFAULT_OPTIONS, diasLetivos: 5 });
    expect(r.students.find((s) => s.aluno === 'A2')!.frequencia).toBe(0);
    expect(r.avisos.join(' ')).toMatch(/mais faltas que os dias letivos/);
  });

  it('ignora linhas sem aluno ou turma e notas fora de 0 a 10, e avisa', () => {
    const t = parseCsv('Aluno;Turma;Nota\nX;;5\n;6A;5\nY;6A;11\nZ;6A;7');
    const r = analyze(
      t,
      { aluno: 0, turma: 1, faltas: null, atrasos: null, telefone: null, disciplinas: [2] },
      DEFAULT_OPTIONS,
    );
    expect(r.students.map((s) => s.aluno)).toEqual(['Y', 'Z']);
    expect(r.students[0].media).toBeNull();
    expect(r.avisos).toHaveLength(2);
  });
});

describe('riskToCsv', () => {
  it('gera CSV com BOM, delimitador ; e vírgula decimal', () => {
    const csv = riskToCsv(analyze(table, mapping, DEFAULT_OPTIONS));
    expect(csv.startsWith('﻿Aluno;Turma;Frequência (%);Média;Motivos')).toBe(true);
    expect(csv).toContain('A2;6A;70;4,5;');
  });
});

import { describe, expect, it } from 'vitest';
import { analyze } from '@/lib/spreadsheet/analyze';
import { guessMapping, isConfident } from '@/lib/spreadsheet/columns';
import { compare, studentKey } from '@/lib/spreadsheet/compare';
import {
  headline,
  levelFor,
  rankClasses,
  schoolLevel,
  todayActions,
} from '@/lib/spreadsheet/insights';
import { parseCsv } from '@/lib/spreadsheet/parseCsv';
import { sampleTable } from '@/lib/spreadsheet/sample';
import { DEFAULT_OPTIONS } from '@/lib/spreadsheet/types';
import { familyMessage, normalizePhone, whatsappUrl } from '@/lib/spreadsheet/whatsapp';

const run = (csv: string) => {
  const t = parseCsv(csv);
  return analyze(t, guessMapping(t), DEFAULT_OPTIONS);
};

const CSV = [
  'Aluno;Turma;Faltas;Atrasos;Telefone do responsável;Português;Matemática',
  'Ana;6A;10;0;(81) 99999-0001;8;6',
  'Bia;6A;30;4;81 98888-0002;5;4',
  'Caio;6B;0;3;;10;10',
  'Davi;6B;20;;;7;',
].join('\n');

describe('semáforo', () => {
  it('usa as faixas de 10% e 20% de alunos em risco', () => {
    expect(levelFor(0)).toBe('ok');
    expect(levelFor(10)).toBe('ok');
    expect(levelFor(10.1)).toBe('atencao');
    expect(levelFor(20)).toBe('atencao');
    expect(levelFor(20.1)).toBe('critico');
  });

  it('classifica a escola pela % em risco', () => {
    expect(schoolLevel(run(CSV))).toBe('critico'); // 1 de 4 = 25%
  });
});

describe('headline e ações', () => {
  const a = run(CSV);

  it('resume em uma frase e aponta a turma mais crítica', () => {
    expect(headline(a)).toEqual({
      title: '1 aluno precisa de atenção.',
      detail: 'A turma 6A é a mais crítica (50% em risco, média 5,8).',
    });
    expect(rankClasses(a)[0].turma).toBe('6A');
  });

  it('diz quando ninguém está em risco', () => {
    const ok = run('Aluno;Turma;Faltas;Nota\nA;6A;0;9\nB;6A;1;8');
    expect(headline(ok).title).toBe('Nenhum aluno precisa de atenção agora.');
    expect(todayActions(ok)).toEqual([]);
  });

  it('sugere até 3 ações: aluno mais grave, turma e atrasos', () => {
    const acts = todayActions(a);
    expect(acts.map((x) => x.kind)).toEqual(['aluno', 'turma', 'atrasos']);
    expect(acts[0].title).toBe('Falar com a família de Bia');
    expect(acts[1].title).toBe('Rever Matemática com a turma 6A');
    expect(acts[2].title).toBe('Avisar 2 famílias sobre atrasos');
  });
});

describe('telefone e WhatsApp', () => {
  it('reconhece a coluna de telefone sem confundir com aluno ou nota', () => {
    const m = guessMapping(parseCsv(CSV));
    expect(m.telefone).toBe(4);
    expect(m.aluno).toBe(0);
    expect(m.disciplinas).toEqual([5, 6]);
    expect(isConfident(m)).toBe(true);
  });

  it('não dispensa a conferência quando falta faltas ou nota', () => {
    expect(isConfident(guessMapping(parseCsv('Aluno;Turma;Nota\nA;6A;7')))).toBe(false);
  });

  it('normaliza telefones brasileiros', () => {
    expect(normalizePhone('(81) 99999-0001')).toBe('5581999990001');
    expect(normalizePhone('+55 81 3333-4444')).toBe('558133334444');
    expect(normalizePhone('081 99999-0001')).toBe('5581999990001');
    expect(normalizePhone('12345')).toBeNull();
    expect(normalizePhone(null)).toBeNull();
  });

  it('monta a mensagem com os motivos e o link', () => {
    const bia = run(CSV).students.find((s) => s.aluno === 'Bia')!;
    const msg = familyMessage(bia, DEFAULT_OPTIONS);
    expect(msg).toContain('sobre Bia (6A)');
    expect(msg).toContain('a frequência está em 70%, a média geral está em 4,5 e já são 4 atrasos');
    expect(whatsappUrl(bia.telefone, 'Oi')).toBe('https://wa.me/5581988880002?text=Oi');
    expect(whatsappUrl(null, 'Oi tudo')).toBe('https://wa.me/?text=Oi%20tudo');
  });
});

describe('comparação', () => {
  it('calcula variações e quem entrou ou saiu do risco', () => {
    const antes = run(
      'Aluno;Turma;Faltas;Português\nAna;6A;30;4\nBia;6A;5;8\nCaio;6B;0;9\nNovo;6B;0;9',
    );
    const agora = run('Aluno;Turma;Faltas;Português\nana;6A;0;8\nBia;6A;30;4\nCaio;6B;10;9');
    const c = compare(agora, antes);
    expect(c.emComum).toBe(3);
    expect(c.entraram).toBe(1); // Bia
    expect(c.sairam).toBe(1); // Ana
    expect(c.alunos[studentKey('Ana', '6A')]).toEqual({
      frequencia: 30,
      media: 4,
      estavaEmRisco: true,
    });
    expect(c.turmas['6B'].frequencia).toBe(-10); // 100% → 90%
    expect(c.kpis.emRisco).toBe(0);
  });
});

describe('escola de exemplo', () => {
  it('é estável e cai no amarelo, com o 7º B como turma crítica', () => {
    const t = sampleTable();
    expect(t).toEqual(sampleTable());
    expect(t.rows).toHaveLength(144);
    const a = analyze(t, guessMapping(t), DEFAULT_OPTIONS);
    expect(isConfident(guessMapping(t))).toBe(true);
    expect(schoolLevel(a)).toBe('atencao');
    expect(rankClasses(a)[0].turma).toBe('7º B');
  });

  it('tem os mesmos alunos no bimestre anterior', () => {
    const atual = sampleTable('atual');
    const anterior = sampleTable('anterior');
    expect(anterior.rows.map((r) => r[0])).toEqual(atual.rows.map((r) => r[0]));
    expect(anterior.rows).not.toEqual(atual.rows);
  });
});

import { describe, expect, it } from 'vitest';
import { buildRoster } from '@/lib/attendance/codes';
import { register } from '@/lib/attendance/records';
import { DEFAULT_CLOCK, type LateRecord } from '@/lib/attendance/types';
import { presenceByClass, presenceTotal, type Chamadas } from '@/lib/daily/attendance';
import { mealCount, mealTotal, mealWindow } from '@/lib/daily/meals';
import {
  type Aula,
  parseTimetable,
  planDay,
  sampleTimetable,
  weekdayFor,
} from '@/lib/daily/timetable';
import { analyze } from '@/lib/spreadsheet/analyze';
import { guessMapping } from '@/lib/spreadsheet/columns';
import { parseCsv } from '@/lib/spreadsheet/parseCsv';
import { DEFAULT_OPTIONS } from '@/lib/spreadsheet/types';

const t = parseCsv('Aluno;Turma\nAna;6A\nBia;6A\nCaio;6A\nDavi;6B\nEva;6B');
const roster = buildRoster(analyze(t, guessMapping(t), DEFAULT_OPTIONS).students);
const key = (nome: string) => roster.find((r) => r.aluno === nome)!.key;
const chamada = (turma: string, ausentes: string[]): Chamadas => ({
  [turma]: { turma, ausentes: ausentes.map(key), por: 'Prof.', em: '2026-11-16T10:00:00Z' },
});
const late = (nome: string): LateRecord[] =>
  register([], {
    entry: roster.find((r) => r.aluno === nome)!,
    channel: 'portaria',
    registradoPor: 'Portaria',
    at: new Date(2026, 10, 16, 7, 30),
    settings: DEFAULT_CLOCK,
  }).records;

describe('presença', () => {
  it('presentes = turma − ausentes; turma sem chamada fica pendente', () => {
    const p = presenceByClass(roster, chamada('6A', ['Bia']), []);
    expect(p).toEqual([
      { turma: '6A', alunos: 3, ausentes: 1, presentes: 2, atrasados: 0, chamadaFeita: true },
      { turma: '6B', alunos: 2, ausentes: 0, presentes: 2, atrasados: 0, chamadaFeita: false },
    ]);
    expect(presenceTotal(p)).toEqual({
      presentes: 2,
      alunosComChamada: 3,
      alunos: 5,
      turmasComChamada: 1,
      turmas: 2,
    });
  });

  it('quem chegou atrasado depois da chamada conta como presente', () => {
    const p = presenceByClass(roster, chamada('6A', ['Bia']), late('Bia'));
    expect(p[0]).toMatchObject({ ausentes: 0, presentes: 3, atrasados: 1 });
  });
});

describe('merenda', () => {
  it('sem resposta conta como vai comer; "não vou" e ausentes saem da conta', () => {
    const m = mealCount(roster, chamada('6A', ['Caio']), [], {
      [key('Ana')]: true,
      [key('Bia')]: false,
      [key('Caio')]: true, // ausente: não conta mesmo tendo dito que ia
    });
    expect(m[0]).toEqual({
      turma: '6A',
      base: 2,
      vaoComer: 1,
      naoVao: 1,
      semResposta: 0,
      estimado: false,
    });
    expect(m[1]).toMatchObject({ base: 2, vaoComer: 2, semResposta: 2, estimado: true });
    expect(mealTotal(m)).toBe(3);
  });

  it('fecha no prazo', () => {
    expect(mealWindow(new Date(2026, 10, 16, 9, 0))).toBe('aberto');
    expect(mealWindow(new Date(2026, 10, 16, 9, 1))).toBe('encerrado');
    expect(mealWindow(new Date(2026, 10, 16, 9, 30), '10:00')).toBe('aberto');
  });
});

const a = (turma: string, aula: number, professor: string, disciplina = 'X'): Aula => ({
  turma,
  dia: 1,
  aula,
  professor,
  disciplina,
});

describe('horário quando professor falta', () => {
  it('adianta a aula de quem está livre e a turma pode sair mais cedo', () => {
    const grade = [
      a('6A', 1, 'Rita'),
      a('6A', 2, 'Paulo'),
      a('6A', 3, 'Marta'),
      a('6A', 4, 'Paulo'),
      a('6A', 5, 'Igor'),
    ];
    const [p] = planDay(grade, 1, ['Rita']);
    expect(p.slots.map((s) => s.tipo)).toEqual([
      'adiantada',
      'adiantada',
      'adiantada',
      'adiantada',
      'vaga',
    ]);
    expect(p.slots[0]).toMatchObject({ de: 2, sugerida: { professor: 'Paulo' } });
    expect(p.saiAs).toBe('10h40');
  });

  it('não adianta quem está dando aula em outra turma naquele horário', () => {
    const grade = [
      a('6A', 1, 'Rita'),
      a('6A', 2, 'Paulo'),
      a('6B', 1, 'Paulo'),
      a('6B', 2, 'Marta'),
    ];
    const plano = planDay(grade, 1, ['Rita']);
    const p6a = plano.find((x) => x.turma === '6A')!;
    expect(p6a.slots[0].tipo).toBe('vaga');
    expect(p6a.slots[1].tipo).toBe('normal');
    // Marta está na escola e livre na 1ª aula.
    expect(p6a.slots[0].livres).toEqual(['Marta']);
    expect(p6a.saiAs).toBeNull(); // vaga no começo, não no fim
  });

  it('com dois professores faltando, as vagas vão para o fim', () => {
    const grade = [
      a('6A', 1, 'Rita'),
      a('6A', 2, 'Davi'),
      a('6A', 3, 'Paulo'),
      a('6A', 4, 'Marta'),
      a('6A', 5, 'Igor'),
    ];
    const [p] = planDay(grade, 1, ['Rita', 'Davi']);
    expect(p.slots.map((s) => s.sugerida?.professor ?? null)).toEqual([
      'Paulo',
      'Marta',
      'Igor',
      null,
      null,
    ]);
    expect(p.saiAs).toBe('9h30');
  });

  it('turma sem falta fica como está', () => {
    const [p] = planDay([a('6A', 1, 'Rita'), a('6A', 2, 'Paulo')], 1, ['Igor']);
    expect(p.afetada).toBe(false);
    expect(p.slots.slice(0, 2).map((s) => s.tipo)).toEqual(['normal', 'normal']);
  });

  it('a grade de exemplo é estável, completa e sem professor em duas turmas ao mesmo tempo', () => {
    const turmas = ['6º A', '6º B', '7º A', '7º B', '8º A', '9º A'];
    const g = sampleTimetable(turmas);
    expect(g).toEqual(sampleTimetable(turmas));
    expect(g).toHaveLength(6 * 25);
    const vistos = new Set<string>();
    for (const x of g) {
      const k = `${x.dia}|${x.aula}|${x.professor}`;
      expect(vistos.has(k)).toBe(false);
      vistos.add(k);
    }
  });

  it('lê a planilha de horário e ignora linhas ruins', () => {
    const tab = parseCsv(
      'Turma;Dia;Aula;Professor;Disciplina\n6A;Segunda;1ª;Rita;Matemática\n6A;2;2;Paulo;Português\n6A;sábado;1;Igor;Artes\n;1;1;X;Y',
    );
    const r = parseTimetable(tab);
    expect(r.aulas).toEqual([
      { turma: '6A', dia: 1, aula: 1, professor: 'Rita', disciplina: 'Matemática' },
      { turma: '6A', dia: 2, aula: 2, professor: 'Paulo', disciplina: 'Português' },
    ]);
    expect(r.avisos[0]).toContain('2 linha(s)');
    expect(parseTimetable(parseCsv('A;B\n1;2')).avisos[0]).toContain('Colunas não encontradas');
  });

  it('fim de semana usa a grade de segunda', () => {
    expect(weekdayFor(new Date(2026, 10, 15))).toBe(1); // domingo
    expect(weekdayFor(new Date(2026, 10, 18))).toBe(3); // quarta
  });
});

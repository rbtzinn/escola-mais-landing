import { describe, expect, it } from 'vitest';
import { CONFIG } from '@/config';
import {
  ficha,
  filterRecords,
  normalizeDate,
  parseAprovados,
  stats,
  toCsv,
  toRecords,
} from './adminData';
import { loadSession, saveSession } from './adminApi';
import { buildSteps } from './schema';

const header = [
  'Enviado em',
  'Protocolo',
  'Status',
  'Observação',
  'Alterado por',
  'Alterado em',
  'CPF do aluno',
  'Ano de ingresso',
  'Modalidade',
  'Curso',
  'Seu nome completo',
  'Seu CPF',
];
const rows = [
  [
    '20/11/2026 10:00',
    'MAT-2026-0001',
    'Matriculado',
    '',
    '',
    '',
    '52998224725',
    '2026',
    'Integrado',
    'Farmácia',
    'Ana Souza',
    '529.982.247-25',
  ],
  [
    '20/11/2026 11:00',
    'MAT-2026-0002',
    'Pendente',
    'falta comprovante',
    'Maria',
    '21/11/2026 08:00',
    '11144477735',
    '2026',
    'Integrado',
    'Farmácia',
    'João Ávila',
    '111.444.777-35',
  ],
  [
    '21/11/2026 09:00',
    'MAT-2026-0003',
    'Cancelado',
    'Substituída por MAT-2026-0004',
    '',
    '',
    '39053344705',
    '2026',
    'Subsequente',
    'Enfermagem',
    'Caio Lima',
    '',
  ],
  [
    '22/11/2026 09:00',
    'MAT-2026-0004',
    '',
    '',
    '',
    '',
    '39053344705',
    '2026',
    'Subsequente',
    'Enfermagem',
    'Caio Lima',
    '',
  ],
  ['', '', '', '', '', '', '', '', '', '', '', ''],
];

describe('painel: dados da planilha', () => {
  const recs = toRecords(header, rows);
  it('lê as matrículas (linha vazia some; status vazio é Matriculado)', () => {
    expect(recs).toHaveLength(4);
    expect(recs[1]).toMatchObject({
      protocolo: 'MAT-2026-0002',
      status: 'Pendente',
      observacao: 'falta comprovante',
      nome: 'João Ávila',
    });
    expect(recs[3].status).toBe('Matriculado');
  });
  it('busca por nome sem acento, CPF ou protocolo; filtra curso e status', () => {
    expect(
      filterRecords(recs, { busca: 'joao avila', curso: '', status: '' }).map((r) => r.protocolo),
    ).toEqual(['MAT-2026-0002']);
    expect(filterRecords(recs, { busca: '111.444', curso: '', status: '' })).toHaveLength(1);
    expect(filterRecords(recs, { busca: '0003', curso: '', status: '' })).toHaveLength(1);
    expect(
      filterRecords(recs, { busca: '', curso: 'Subsequente · Enfermagem', status: 'Matriculado' }),
    ).toHaveLength(1);
  });
  it('números: ativos, por curso e por dia', () => {
    const s = stats(recs);
    expect(s).toMatchObject({ ativos: 3, matriculados: 2, pendentes: 1, cancelados: 1 });
    expect(s.porCurso).toEqual([
      { curso: 'Integrado · Farmácia', ativos: 2, pendentes: 1 },
      { curso: 'Subsequente · Enfermagem', ativos: 1, pendentes: 0 },
    ]);
    expect(s.porDia).toEqual([
      { dia: '20/11', n: 2 },
      { dia: '21/11', n: 1 },
      { dia: '22/11', n: 1 },
    ]);
  });
  it('ficha agrupa pelas etapas do formulário e esconde o vazio', () => {
    const f = ficha(buildSteps(CONFIG), header, rows[0]);
    expect(f[0].title).toBe('Matrícula');
    expect(f.find((s) => s.title === 'Seu curso')?.items).toEqual([
      { label: 'Modalidade', value: 'Integrado' },
      { label: 'Curso', value: 'Farmácia' },
    ]);
    expect(f.flatMap((s) => s.items).some((i) => i.label === 'Status')).toBe(false);
  });
  it('CSV para o Excel', () => {
    expect(toCsv(['a', 'b'], [['1', 'x"y']])).toBe('﻿"a";"b"\r\n"1";"x""y"\r\n');
  });
});

describe('painel: lista de aprovados colada', () => {
  it('sem cabeçalho: CPF, nascimento, nome…', () => {
    const r = parseAprovados(
      '529.982.247-25\t5/3/2010\tAna\tIntegrado\tFarmácia\n123\t01/01/2010\n11144477735\t31/02/2010\n52998224725\t05/03/2010',
    );
    expect(r.ok).toEqual([
      {
        cpf: '52998224725',
        nasc: '05/03/2010',
        nome: 'Ana',
        modalidade: 'Integrado',
        curso: 'Farmácia',
      },
    ]);
    expect(r.bad.map((b) => b.motivo)).toEqual([
      'CPF inválido',
      'Data de nascimento inválida',
      'CPF repetido na lista',
    ]);
  });
  it('com cabeçalho em outra ordem e zeros perdidos', () => {
    const r = parseAprovados('Nome;Data de Nascimento;CPF\nBia;2009-12-01;1234567890');
    expect(r.ok).toEqual([
      { cpf: '01234567890', nasc: '01/12/2009', nome: 'Bia', modalidade: '', curso: '' },
    ]);
  });
  it('normaliza datas', () => {
    expect(normalizeDate('1-2-2010')).toBe('01/02/2010');
    expect(normalizeDate('30/02/2010')).toBe('');
  });
});

describe('painel: sessão', () => {
  it('guarda e expira', () => {
    saveSession({ sessao: 'x', nome: 'Ana', papel: 'direcao', exp: 2000 });
    expect(loadSession(1000)?.nome).toBe('Ana');
    expect(loadSession(3000)).toBeNull();
  });
});

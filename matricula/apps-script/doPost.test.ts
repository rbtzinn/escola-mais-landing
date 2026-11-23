import { describe, expect, it } from 'vitest';
import { loadScript, type Env } from './fakeSheets';

const CPF = '529.982.247-25';
const FIXED = [
  'Enviado em',
  'Protocolo',
  'Status',
  'Observação',
  'Alterado por',
  'Alterado em',
  'CPF do aluno',
];
const EXTRA = Array.from({ length: 100 }, (_, i) => `Pergunta ${i + 1}`);
const HEADER = [
  ...FIXED,
  'Modalidade',
  'Curso',
  'Seu nome completo',
  'Data de nascimento',
  ...EXTRA,
];

/** Matrículas já existentes (muitas colunas, como a planilha de verdade). */
function existing(n: number) {
  const status = ['Matriculado', 'Pendente', 'Cancelado'];
  return [
    HEADER,
    ...Array.from({ length: n }, (_, i) => {
      const cpf = `1${String(i).padStart(10, '0')}`;
      return [
        `20/11/2026 10:00`,
        `MAT-2026-${String(i + 1).padStart(4, '0')}`,
        status[i % 3],
        '',
        '',
        '',
        cpf,
        'Integrado',
        'Farmácia',
        `Aluno ${i}`,
        '01/01/2010',
        ...EXTRA.map(() => 'x'),
      ];
    }),
  ];
}

const APROVADOS = [
  ['CPF', 'Data de nascimento', 'Nome', 'Modalidade', 'Curso'],
  ['52998224725', '15/03/2010', 'Ana Souza', '', ''],
];

const envelope = (extra: object = {}) => ({
  token: 't',
  cpf: CPF,
  columns: ['Modalidade', 'Curso', 'Seu nome completo', 'Data de nascimento'],
  row: ['Integrado', 'Farmácia', 'Ana Souza', '15/03/2010'],
  ...extra,
});

const login = (env: Env, user = 'admin', senha = 'senha-forte-1') =>
  env.doPost({ action: 'login', login: user, senha }).sessao as string;

describe('Apps Script de ponta a ponta (planilha falsa)', () => {
  it('ping só acorda o script: não lê planilha nem entra na fila', () => {
    const env = loadScript({ matriculas: existing(30) });
    expect(env.doPost({ action: 'ping' })).toEqual({ status: 'ok' });
    expect(env.stats).toEqual({ locks: 0, getSheets: 0 });
    expect(env.sheet('Matrículas').stats.calls).toBe(0);
  });

  it('conferência do CPF não entra na fila e lê só as colunas que precisa', () => {
    const env = loadScript({ matriculas: existing(30), aprovados: APROVADOS });
    const r = env.doPost({ action: 'check', token: 't', cpf: CPF, nascimento: '15/03/2010' });
    expect(r).toMatchObject({ status: 'ok' });
    expect(env.stats.locks).toBe(0);
    expect(env.stats.getSheets).toBe(1); // as abas vêm numa chamada só
    // Cabeçalho (1 linha) + 2 colunas × 30 alunos, e não as 111 colunas × 31 linhas.
    expect(env.sheet('Matrículas').stats.cellsRead).toBeLessThan(HEADER.length + 2 * 30 + 1);
  });

  it('conferência recusa quem não está na lista, com resposta genérica', () => {
    const env = loadScript({ matriculas: existing(3), aprovados: APROVADOS });
    expect(env.doPost({ action: 'check', token: 't', cpf: CPF, nascimento: '16/03/2010' })).toEqual(
      { status: 'nao_encontrado' },
    );
    expect(
      env.doPost({ action: 'check', token: 'errado', cpf: CPF, nascimento: '15/03/2010' }),
    ).toMatchObject({ status: 'erro' });
  });

  it('envio entra na fila, grava como Matriculado e atualiza o resumo sem refazer a formatação', () => {
    const env = loadScript({ matriculas: existing(3), aprovados: APROVADOS });
    const r = env.doPost(envelope());
    expect(r).toMatchObject({ status: 'ok', protocolo: 'MAT-2026-0004' });
    expect(env.stats.locks).toBe(1);
    const sheet = env.sheet('Matrículas');
    expect(sheet.grid[4].slice(0, 7)).toMatchObject({
      1: 'MAT-2026-0004',
      2: 'Matriculado',
      6: '52998224725',
    });
    const resumo = env.sheet('Resumo por curso');
    expect(resumo.stats.clear).toBe(0);
    expect(resumo.stats.clearContents).toBeGreaterThan(0);
    // 3 já existentes: Matriculado, Pendente, Cancelado; mais a nova (Matriculado) = 3 ativas, 1 pendente.
    expect(resumo.grid[1].slice(0, 4)).toEqual(['Integrado', 'Farmácia', 3, 1]);
    expect(resumo.grid[1].slice(5)).toEqual([3, 1]); // Total e Pendentes
    // CPF repetido é barrado.
    expect(env.doPost(envelope())).toEqual({ status: 'cpf_duplicado' });
  });

  it('ação do painel devolve o painel já atualizado (uma viagem só)', () => {
    const env = loadScript({ matriculas: existing(3), aprovados: APROVADOS });
    const sessao = login(env);
    const r = env.doPost({
      action: 'status',
      sessao,
      protocolo: 'MAT-2026-0001',
      status: 'Pendente',
      observacao: 'falta RG',
    }) as {
      status: string;
      painel: { cabecalho: string[]; linhas: string[][]; aprovados: unknown[] };
    };
    expect(r.status).toBe('ok');
    const row = r.painel.linhas.find((l) => l[1] === 'MAT-2026-0001')!;
    expect(row.slice(2, 5)).toEqual(['Pendente', 'falta RG', 'Direção']);
    expect(r.painel.aprovados).toHaveLength(1);
    expect(r.painel.aprovados[0]).toMatchObject({ cpf: '52998224725', nome: 'Ana Souza' });
    // Erro não devolve painel.
    const bad = env.doPost({
      action: 'status',
      sessao,
      protocolo: 'MAT-2026-0001',
      status: 'Pendente',
      observacao: '',
    });
    expect(bad).toMatchObject({ status: 'erro' });
    expect(bad.painel).toBeUndefined();
  });

  it('coordenação recebe o painel sem aprovados, exceções e usuários, e não mexe no período', () => {
    const env = loadScript({ matriculas: existing(3), aprovados: APROVADOS });
    const dir = login(env);
    expect(
      env.doPost({
        action: 'usuario_add',
        sessao: dir,
        nome: 'Maria',
        login: 'maria',
        papel: 'coordenacao',
        senha: 'senha1234',
      }),
    ).toMatchObject({ status: 'ok' });
    const coord = login(env, 'maria', 'senha1234');
    expect(coord).toBeTruthy();
    const r = env.doPost({
      action: 'status',
      sessao: coord,
      protocolo: 'MAT-2026-0002',
      status: 'Cancelado',
      observacao: '',
    }) as { status: string; painel: Record<string, unknown> };
    expect(r.status).toBe('ok');
    expect(r.painel.aprovados).toBeUndefined();
    expect(r.painel.usuarios).toBeUndefined();
    expect(env.doPost({ action: 'periodo', sessao: coord, inicio: '', fim: '' })).toEqual({
      status: 'sem_permissao',
    });
  });

  it('ações da direção: período, aprovados e exceção, cada uma devolvendo o painel', () => {
    const env = loadScript({ matriculas: existing(2), aprovados: APROVADOS });
    const sessao = login(env);
    const p = env.doPost({
      action: 'periodo',
      sessao,
      inicio: '01/11/2026',
      fim: '30/11/2026',
    }) as { painel: { periodo: object } };
    expect(p.painel.periodo).toEqual({ inicio: '01/11/2026', fim: '30/11/2026' });
    const a = env.doPost({
      action: 'aprovados_add',
      sessao,
      linhas: [
        { cpf: '111.444.777-35', nasc: '02/04/2009', nome: 'João' },
        { cpf: '123', nasc: '01/01/2010' },
      ],
    }) as {
      adicionados: number;
      recusadas: unknown[];
      painel: { aprovados: unknown[] };
    };
    expect(a.adicionados).toBe(1);
    expect(a.recusadas).toHaveLength(1);
    expect(a.painel.aprovados).toHaveLength(2);
    const e = env.doPost({
      action: 'excecao_add',
      sessao,
      cpf: '390.533.447-05',
      nascimento: '01/01/2010',
      validade: '31/12/2099',
      periodo: true,
      lista: false,
      reenvio: false,
      nome: 'Caio',
    }) as {
      painel: { excecoes: { cpf: string }[] };
    };
    expect(e.painel.excecoes.map((x) => x.cpf)).toEqual(['39053344705']);
  });

  it('sessão inválida ou vencida é recusada', () => {
    const env = loadScript({ matriculas: existing(1) });
    expect(env.doPost({ action: 'painel', sessao: 'lixo' })).toEqual({ status: 'sessao_expirada' });
    expect(env.doPost({ action: 'login', login: 'admin', senha: 'errada' })).toEqual({
      status: 'login_invalido',
    });
  });
});

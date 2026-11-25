import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// O Apps Script roda o arquivo como script solto; aqui ele roda igual, com um `module` falso.
const fakeModule = { exports: {} as unknown };
new Function('module', readFileSync(resolve(__dirname, 'Code.js'), 'utf8'))(fakeModule);
const gs = fakeModule.exports as {
  isValidCpf: (s: string) => boolean;
  validatePayload: (d: unknown) => string | null;
  safeCell: (s: string) => string;
  mergeHeader: (current: string[], columns: string[]) => string[];
  buildRow: (h: string[], d: { cpf: string; columns: string[]; row: string[] }, p: string, at: string, lista?: string) => string[];
  findCpfRow: (col: string[], cpf: string) => number;
  makeProtocol: (y: number, n: number) => string;
  extractSheetId: (s: string | null) => string;
  countByCourse: (h: string[], rows: string[][]) => [string, string, number, number][];
  normText: (s: string) => string;
  normCpf: (s: string | number) => string;
  dateKey: (s: string) => string;
  formatKey: (k: string) => string;
  periodStatus: (today: string, start: string, end: string) => string;
  readApproved: (h: string[], rows: unknown[][]) => Approved[];
  findApproved: (list: Approved[], cpf: string, nasc: string) => Approved | null;
  columnValue: (d: { columns: string[]; row: string[] }, name: string) => string;
  courseMatches: (a: Approved, modalidade: string, curso: string) => boolean;
  approvalCheck: (list: Approved[], cpf: string, nasc: string, modalidade: string, curso: string) => string;
  tooManyRequests: (cache: FakeCache, now: number) => boolean;
  readExceptions: (h: string[], rows: unknown[][]) => Exc[];
  findException: (list: Exc[], cpf: string, nasc: string, today: string) => Exc | null;
  validLogin: (s: string) => boolean;
  hashPassword: (senha: string, salt: string, digest: (s: string) => string) => string;
  sameText: (a: string, b: string) => boolean;
  signToken: (login: string, papel: string, exp: number, secret: string, hmac: Hmac) => string;
  verifyToken: (token: string, secret: string, hmac: Hmac, now: number) => { login: string; papel: string; exp: number } | null;
  canDo: (papel: string, action: string) => boolean;
  statusError: (status: string, obs: string) => string | null;
  checkApprovedLines: (l: unknown[]) => { ok: { cpf: string; nasc: string }[]; bad: { linha: number; motivo: string }[] };
  FIXED_COLUMNS: string[];
  STATUS: string[];
};
type Exc = { linha: number; cpf: string; nasc: string; periodo: boolean; validade: string; usadaEm: string };
type Hmac = (msg: string, secret: string) => string;
// Assinatura falsa, só para o teste: depende da mensagem e do segredo.
const fakeHmac: Hmac = (msg, secret) => `${secret}:${[...msg].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 1_000_003, 7)}`;
type Approved = { cpf: string; nasc: string; modalidade: string; curso: string };
type FakeCache = { get: (k: string) => string | null; put: (k: string, v: string, s: number) => void };
const fakeCache = (): FakeCache => {
  const m = new Map<string, string>();
  return { get: (k) => m.get(k) ?? null, put: (k, v) => void m.set(k, v) };
};

const data = { token: 't', cpf: '529.982.247-25', columns: ['Curso', 'Seu nome completo'], row: ['Nutrição', 'Ana Souza'] };

describe('Apps Script (funções puras)', () => {
  it('valida o envio no servidor', () => {
    expect(gs.validatePayload(data)).toBeNull();
    expect(gs.validatePayload({ ...data, cpf: '111.111.111-11' })).toBe('CPF inválido.');
    expect(gs.validatePayload({ ...data, row: ['só uma'] })).toBe('Formato inválido.');
    expect(gs.validatePayload({ ...data, row: ['x'.repeat(1001), 'a'] })).toBe('Resposta grande demais.');
    expect(gs.validatePayload(null)).toBe('Envio vazio.');
  });
  it('não deixa resposta virar fórmula', () => {
    expect(gs.safeCell('=IMPORTXML("http://x")')).toBe('\'=IMPORTXML("http://x")');
    expect(gs.safeCell('-1')).toBe("'-1");
    expect(gs.safeCell('Ana')).toBe('Ana');
  });
  it('monta o cabeçalho e a linha na ordem da planilha', () => {
    const header = gs.mergeHeader([], data.columns);
    expect(header).toEqual([...gs.FIXED_COLUMNS, 'Curso', 'Seu nome completo']);
    // Planilha com colunas em outra ordem e uma coluna nova no formulário.
    const h2 = gs.mergeHeader([...gs.FIXED_COLUMNS, 'Seu nome completo', 'Curso'], [...data.columns, 'Nova']);
    expect(h2.slice(-3)).toEqual(['Seu nome completo', 'Curso', 'Nova']);
    const row = gs.buildRow(h2, data, 'MAT-2026-0001', '23/11/2026 10:00', 'Sim');
    expect(row).toEqual(['23/11/2026 10:00', 'MAT-2026-0001', 'Matriculado', '', '', '', '52998224725', 'Sim', 'Ana Souza', 'Nutrição', '']);
    // Planilha antiga, sem as colunas novas: elas entram no fim.
    expect(gs.mergeHeader(['Enviado em', 'Protocolo', 'CPF do aluno', 'Curso'], ['Curso']).slice(4)).toEqual([
      'Status',
      'Observação',
      'Alterado por',
      'Alterado em',
      'Lista de aprovados',
    ]);
  });
  it('acha CPF repetido e numera o protocolo', () => {
    expect(gs.findCpfRow(['11144477735', '529.982.247-25'], '52998224725')).toBe(1);
    expect(gs.findCpfRow([], '52998224725')).toBe(-1);
    expect(gs.makeProtocol(2026, 7)).toBe('MAT-2026-0007');
  });
  it('conta por modalidade e curso (sem fórmula)', () => {
    const header = ['Status', 'Modalidade', 'Curso'];
    const rows = [
      ['Pendente', 'Integrado', 'Farmácia'],
      ['Matriculado', 'Subsequente', 'Farmácia'],
      ['Matriculado', 'Integrado', 'Farmácia'],
      ['Cancelado', 'Integrado', 'Farmácia'],
      ['Matriculado', 'Integrado', ''],
    ];
    expect(gs.countByCourse(header, rows)).toEqual([
      ['Integrado', 'Farmácia', 2, 1],
      ['Subsequente', 'Farmácia', 1, 0],
    ]);
    expect(gs.countByCourse(['Enviado em'], rows)).toEqual([]);
  });
  it('aceita o link inteiro da planilha ou só o ID', () => {
    expect(gs.extractSheetId('https://docs.google.com/spreadsheets/d/1AbC-_x9/edit#gid=0')).toBe('1AbC-_x9');
    expect(gs.extractSheetId(' 1AbC-_x9 ')).toBe('1AbC-_x9');
    expect(gs.extractSheetId(null)).toBe('');
  });

  it('lê a lista de aprovados como a escola colar (ordem, zeros, datas e acentos)', () => {
    const list = gs.readApproved(
      ['Nome', 'cpf', 'Data de Nascimento', 'Curso'],
      [
        ['Ana', '529.982.247-25', '15/03/2010', 'Farmácia '],
        ['Bia', 1234567890, '5/3/2009', ''],
        ['sem cpf', '', '01/01/2010', ''],
      ],
    );
    expect(list).toHaveLength(2);
    expect(list[1].cpf).toBe('01234567890');
    expect(list[1].nasc).toBe('20090305');
    expect(gs.findApproved(list, '52998224725', '15/03/2010')?.curso).toBe('Farmácia');
    expect(gs.findApproved(list, '52998224725', '16/03/2010')).toBeNull();
    expect(gs.findApproved(list, '11144477735', '15/03/2010')).toBeNull();
    expect(gs.readApproved(['Nome'], [['Ana']])).toEqual([]);
  });
  it('confere o curso só quando a lista diz qual é', () => {
    const a = { cpf: '', nasc: '', modalidade: 'Integrado', curso: 'Farmácia' };
    expect(gs.courseMatches(a, 'integrado', 'FARMACIA')).toBe(true);
    expect(gs.courseMatches(a, 'Integrado', 'Nutrição e Dietética')).toBe(false);
    expect(gs.courseMatches({ ...a, modalidade: '', curso: '' }, 'Subsequente', 'Enfermagem')).toBe(true);
    expect(gs.columnValue({ columns: ['Curso'], row: [' Farmácia '] }, 'Curso')).toBe('Farmácia');
    expect(gs.columnValue({ columns: [], row: [] }, 'Curso')).toBe('');
  });
  it('checklist da lista de aprovados: não bloqueia, só marca', () => {
    const list = [{ cpf: '52998224725', nasc: '20100315', nome: '', modalidade: 'Integrado', curso: 'Farmácia' }];
    expect(gs.approvalCheck([], '52998224725', '15/03/2010', 'Integrado', 'Farmácia')).toBe('Sem lista');
    expect(gs.approvalCheck(list, '529.982.247-25', '15/03/2010', 'integrado', 'farmacia')).toBe('Sim');
    expect(gs.approvalCheck(list, '52998224725', '15/03/2010', 'Integrado', 'Nutrição e Dietética')).toBe(
      'Sim, curso diferente',
    );
    expect(gs.approvalCheck(list, '52998224725', '16/03/2010', 'Integrado', 'Farmácia')).toBe('Não');
  });
  it('datas e período da matrícula', () => {
    expect(gs.dateKey('31/02/2010')).toBe('');
    expect(gs.dateKey('2010-03-15')).toBe('20100315');
    expect(gs.formatKey('20270201')).toBe('01/02/2027');
    expect(gs.periodStatus('20270115', '20270201', '20270210')).toBe('antes');
    expect(gs.periodStatus('20270201', '20270201', '20270210')).toBe('aberto');
    expect(gs.periodStatus('20270210', '20270201', '20270210')).toBe('aberto');
    expect(gs.periodStatus('20270211', '20270201', '20270210')).toBe('depois');
    expect(gs.periodStatus('20270211', '', '')).toBe('aberto');
  });
  it('limita rajadas', () => {
    const cache = fakeCache();
    const now = 1_800_000_000_000;
    let blocked = 0;
    for (let i = 0; i < 61; i++) if (gs.tooManyRequests(cache, now)) blocked++;
    expect(blocked).toBe(1);
    expect(gs.tooManyRequests(cache, now + 60_000)).toBe(false);
  });

  it('exceção: vale uma vez, no prazo, para o CPF e o nascimento certos', () => {
    const header = ['CPF', 'Data de nascimento', 'Nome', 'Fora do período', 'Fora da lista', 'Reenvio', 'Válida até', 'Criada por', 'Criada em', 'Usada em'];
    const list = gs.readExceptions(header, [
      ['52998224725', '15/03/2010', 'Ana', 'Sim', '', 'sim', '25/11/2026', 'Direção', 'x', ''],
      ['11144477735', '01/01/2010', 'Bia', '', 'Sim', '', '20/11/2026', 'Direção', 'x', ''],
      ['39053344705', '01/01/2010', 'Caio', '', 'Sim', '', '30/11/2026', 'Direção', 'x', '23/11/2026 · MAT-2026-0003'],
    ]);
    expect(list[0]).toMatchObject({ linha: 2, periodo: true, validade: '20261125' });
    expect(gs.findException(list, '529.982.247-25', '15/03/2010', '20261123')?.nasc).toBe('20100315');
    expect(gs.findException(list, '529.982.247-25', '15/03/2010', '20261125')).not.toBeNull();
    expect(gs.findException(list, '529.982.247-25', '15/03/2010', '20261126')).toBeNull();
    expect(gs.findException(list, '529.982.247-25', '16/03/2010', '20261123')).toBeNull();
    expect(gs.findException(list, '11144477735', '01/01/2010', '20261123')).toBeNull(); // vencida
    expect(gs.findException(list, '39053344705', '01/01/2010', '20261123')).toBeNull(); // já usada
  });
  it('senha embaralhada e sessão assinada', () => {
    const digest = (s: string) => String([...s].reduce((h, c) => (h * 33 + c.charCodeAt(0)) % 999_983, 5));
    const h = gs.hashPassword('segredo123', 'sal', digest);
    expect(h).toBe(gs.hashPassword('segredo123', 'sal', digest));
    expect(h).not.toBe(gs.hashPassword('segredo124', 'sal', digest));
    expect(h).not.toBe(gs.hashPassword('segredo123', 'outro', digest));
    expect(gs.sameText('abc', 'abc')).toBe(true);
    expect(gs.sameText('abc', 'abd')).toBe(false);

    const now = 1_800_000_000_000;
    const token = gs.signToken('maria', 'coordenacao', now + 1000, 's3', fakeHmac);
    expect(gs.verifyToken(token, 's3', fakeHmac, now)).toEqual({ login: 'maria', papel: 'coordenacao', exp: now + 1000 });
    expect(gs.verifyToken(token, 's3', fakeHmac, now + 2000)).toBeNull(); // venceu
    expect(gs.verifyToken(token, 'outro', fakeHmac, now)).toBeNull();
    expect(gs.verifyToken(token.replace('coordenacao', 'direcao'), 's3', fakeHmac, now)).toBeNull(); // adulterado
    expect(gs.verifyToken('lixo', 's3', fakeHmac, now)).toBeNull();
  });
  it('papéis, login, status e aprovados colados', () => {
    expect(gs.canDo('coordenacao', 'status')).toBe(true);
    expect(gs.canDo('coordenacao', 'periodo')).toBe(false);
    expect(gs.canDo('coordenacao', 'usuario_add')).toBe(false);
    expect(gs.canDo('direcao', 'excecao_add')).toBe(true);
    expect(gs.canDo('aluno', 'painel')).toBe(false);
    expect(gs.validLogin('maria.silva')).toBe(true);
    expect(gs.validLogin('Maria Silva')).toBe(false);
    expect(gs.statusError('Pendente', '')).toMatch(/motivo/);
    expect(gs.statusError('Pendente', 'falta comprovante')).toBeNull();
    expect(gs.statusError('Confirmada', '')).toBe('Status inválido.');
    expect(gs.STATUS).toEqual(['Matriculado', 'Pendente', 'Cancelado']);
    const r = gs.checkApprovedLines([
      { cpf: '529.982.247-25', nasc: '15/03/2010', nome: 'Ana' },
      { cpf: '123', nasc: '15/03/2010' },
      { cpf: '11144477735', nasc: '31/02/2010' },
    ]);
    expect(r.ok).toEqual([{ cpf: '52998224725', nasc: '15/03/2010', nome: 'Ana', modalidade: '', curso: '' }]);
    expect(r.bad).toEqual([
      { linha: 2, motivo: 'CPF inválido' },
      { linha: 3, motivo: 'Data de nascimento inválida' },
    ]);
  });
});

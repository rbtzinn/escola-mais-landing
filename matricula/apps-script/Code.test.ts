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
  buildRow: (h: string[], d: { cpf: string; columns: string[]; row: string[] }, p: string, at: string) => string[];
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
  tooManyRequests: (cache: FakeCache, now: number) => boolean;
  tooManyFails: (cache: FakeCache, cpf: string) => boolean;
  registerFail: (cache: FakeCache, cpf: string) => void;
  FIXED_COLUMNS: string[];
};
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
    const row = gs.buildRow(h2, data, 'MAT-2026-0001', '23/11/2026 10:00');
    expect(row).toEqual(['23/11/2026 10:00', 'MAT-2026-0001', 'Pendente', '52998224725', 'Ana Souza', 'Nutrição', '']);
    // Planilha antiga, sem a coluna Status: ela entra no fim.
    expect(gs.mergeHeader(['Enviado em', 'Protocolo', 'CPF do aluno', 'Curso'], ['Curso'])).toEqual([
      'Enviado em',
      'Protocolo',
      'CPF do aluno',
      'Curso',
      'Status',
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
      ['Confirmada', 'Integrado', 'Farmácia'],
      ['Pendente', 'Subsequente', 'Farmácia'],
      ['Pendente', 'Integrado', 'Farmácia'],
      ['Cancelada', 'Integrado', 'Farmácia'],
      ['Pendente', 'Integrado', ''],
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
  it('limita rajadas e tentativas erradas', () => {
    const cache = fakeCache();
    const now = 1_800_000_000_000;
    let blocked = 0;
    for (let i = 0; i < 61; i++) if (gs.tooManyRequests(cache, now)) blocked++;
    expect(blocked).toBe(1);
    expect(gs.tooManyRequests(cache, now + 60_000)).toBe(false);
    for (let i = 0; i < 4; i++) gs.registerFail(cache, '529.982.247-25');
    expect(gs.tooManyFails(cache, '52998224725')).toBe(false);
    gs.registerFail(cache, '52998224725');
    expect(gs.tooManyFails(cache, '52998224725')).toBe(true);
  });
});

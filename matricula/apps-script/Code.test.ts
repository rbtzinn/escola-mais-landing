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
  FIXED_COLUMNS: string[];
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
    expect(row).toEqual(['23/11/2026 10:00', 'MAT-2026-0001', '52998224725', 'Ana Souza', 'Nutrição', '']);
  });
  it('acha CPF repetido e numera o protocolo', () => {
    expect(gs.findCpfRow(['11144477735', '529.982.247-25'], '52998224725')).toBe(1);
    expect(gs.findCpfRow([], '52998224725')).toBe(-1);
    expect(gs.makeProtocol(2026, 7)).toBe('MAT-2026-0007');
  });
  it('aceita o link inteiro da planilha ou só o ID', () => {
    expect(gs.extractSheetId('https://docs.google.com/spreadsheets/d/1AbC-_x9/edit#gid=0')).toBe('1AbC-_x9');
    expect(gs.extractSheetId(' 1AbC-_x9 ')).toBe('1AbC-_x9');
    expect(gs.extractSheetId(null)).toBe('');
  });
});

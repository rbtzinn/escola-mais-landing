import { describe, expect, it } from 'vitest';
import { EMPTY_DEMO_FORM, validateDemoForm } from '@/lib/validateDemoForm';

const valid = {
  nome: 'Maria da Silva',
  email: 'maria@educacao.gov.br',
  cargo: 'diretor',
  municipio: 'Recife',
  uf: 'PE',
  tamanho: '201-500',
};

describe('validateDemoForm', () => {
  it('aceita um formulário completo', () => {
    expect(validateDemoForm(valid)).toEqual({});
  });

  it('exige todos os campos', () => {
    expect(Object.keys(validateDemoForm(EMPTY_DEMO_FORM)).sort()).toEqual([
      'cargo',
      'email',
      'municipio',
      'nome',
      'tamanho',
      'uf',
    ]);
  });

  it('rejeita e-mail inválido', () => {
    expect(validateDemoForm({ ...valid, email: 'maria@' }).email).toMatch(/e-mail válido/);
  });

  it('ignora espaços em branco', () => {
    expect(validateDemoForm({ ...valid, municipio: '   ' }).municipio).toBeDefined();
  });
});

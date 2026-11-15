export interface DemoFormValues {
  nome: string;
  email: string;
  cargo: string;
  municipio: string;
  uf: string;
  tamanho: string;
}

export type DemoFormErrors = Partial<Record<keyof DemoFormValues, string>>;

export const EMPTY_DEMO_FORM: DemoFormValues = {
  nome: '',
  email: '',
  cargo: '',
  municipio: '',
  uf: '',
  tamanho: '',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Valida o formulário de demonstração. Retorna só os campos com erro (mensagens em pt-BR). */
export function validateDemoForm(v: DemoFormValues): DemoFormErrors {
  const errors: DemoFormErrors = {};
  if (v.nome.trim().length < 3) errors.nome = 'Informe seu nome completo.';
  if (!v.email.trim()) errors.email = 'Informe seu e-mail institucional.';
  else if (!EMAIL_RE.test(v.email.trim()))
    errors.email = 'Informe um e-mail válido, como nome@escola.edu.br.';
  if (!v.cargo) errors.cargo = 'Selecione seu cargo.';
  if (!v.municipio.trim()) errors.municipio = 'Informe o município.';
  if (!v.uf) errors.uf = 'Selecione a UF.';
  if (!v.tamanho) errors.tamanho = 'Selecione o tamanho da escola.';
  return errors;
}

/** Ordem dos campos na tela, usada para focar o primeiro com erro. */
export const FIELD_ORDER: (keyof DemoFormValues)[] = [
  'nome',
  'email',
  'cargo',
  'municipio',
  'uf',
  'tamanho',
];

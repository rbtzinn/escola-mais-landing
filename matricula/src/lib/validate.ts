import { isValidCpf, onlyDigits } from './cpf';
import { emailError } from './email';
import { ageAt, dateError, parseDate, phoneError } from './masks';
import { nameError } from './names';
import { type Field, OUTRO, type Step, type Values, isRequired, isStepVisible, isVisible, optionsOf, subsequente } from './schema';

export type Errors = Record<string, string>;

const text = (v: Values, id: string) => (typeof v[id] === 'string' ? (v[id] as string).trim() : '');
const list = (v: Values, id: string) => (Array.isArray(v[id]) ? (v[id] as string[]) : []);

/** Erro de um campo visível, ou null. `today` entra para os testes. */
export function fieldError(f: Field, v: Values, today = new Date()): string | null {
  const required = isRequired(f, v);
  const value = text(v, f.id);

  if (f.kind === 'multi') {
    const sel = list(v, f.id);
    if (required && sel.length === 0) return 'Marque pelo menos uma opção.';
    if (sel.includes(OUTRO) && !text(v, `${f.id}_outro`)) return 'Escreva qual em "Outro".';
    return null;
  }
  if (f.kind === 'grid') {
    const missing = (f.rows ?? []).filter((r) => !text(v, `${f.id}:${r}`));
    return required && missing.length ? `Falta responder: ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? '…' : ''}.` : null;
  }
  if (f.kind === 'consent') return value === 'sim' ? null : 'Marque para continuar.';

  if (!value) return required ? requiredMessage(f) : null;

  switch (f.kind) {
    case 'name':
      return nameError(value);
    case 'cpf': {
      if (!isValidCpf(value)) return onlyDigits(value).length < 11 ? 'O CPF tem 11 números.' : 'Esse CPF não existe. Confira os números.';
      const same = (f.differentFrom ?? []).find((id) => onlyDigits(text(v, id)) === onlyDigits(value));
      return same ? 'Esse CPF já foi usado para outra pessoa neste formulário.' : null;
    }
    case 'rg':
      return value.length < 5 ? 'Confira o número do RG.' : null;
    case 'date': {
      const err = dateError(value, today);
      if (err) return err;
      const date = parseDate(value)!;
      if (f.id === 'aluno_nascimento') {
        const age = ageAt(date, today);
        // Antes de escolher a modalidade (a data vem logo no começo), aceita as duas faixas.
        const [min, max] = subsequente(v) ? [15, 70] : text(v, 'modalidade') ? [12, 30] : [12, 70];
        if (age < min || age > max) return `Confira o ano: por essa data, você teria ${age} anos.`;
      }
      if (f.afterField) {
        const before = parseDate(text(v, f.afterField));
        if (before && date < before) return 'Essa data é antes do seu nascimento. Confira.';
      }
      return null;
    }
    case 'cellphone':
      return phoneError(value, 'celular');
    case 'phone':
      return phoneError(value);
    case 'email':
      return emailError(value);
    case 'cep':
      return onlyDigits(value).length === 8 ? null : 'O CEP tem 8 números.';
    case 'choice':
    case 'select':
      if (f.optionsFrom && !optionsOf(f, v).includes(value)) return 'Escolha uma opção.';
      if (f.other && value === OUTRO && !text(v, `${f.id}_outro`)) return 'Escreva qual em "Outro".';
      return null;
    default:
      return value.length > 500 ? 'Texto muito longo.' : null;
  }
}

function requiredMessage(f: Field): string {
  if (['choice', 'select', 'uf', 'city'].includes(f.kind)) return 'Escolha uma opção.';
  if (f.kind === 'date') return 'Digite a data: dia/mês/ano.';
  return 'Preencha este campo.';
}

/** Erros dos campos visíveis de uma etapa. */
export function validateStep(step: Step, v: Values, today = new Date()): Errors {
  const errors: Errors = {};
  for (const f of step.fields) {
    if (!isVisible(f, v)) continue;
    const e = fieldError(f, v, today);
    if (e) errors[f.id] = e;
  }
  return errors;
}

/** Primeira etapa com erro (para o envio final), ou -1. */
export function firstInvalidStep(steps: Step[], v: Values, today = new Date()): number {
  return steps.findIndex((s) => isStepVisible(s, v) && Object.keys(validateStep(s, v, today)).length > 0);
}

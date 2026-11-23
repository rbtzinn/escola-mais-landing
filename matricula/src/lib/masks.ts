import { onlyDigits } from './cpf';

/** DDDs em uso no Brasil (Anatel). */
export const DDDS = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34, 35, 37, 38, 41, 42, 43,
  44, 45, 46, 47, 48, 49, 51, 53, 54, 55, 61, 62, 63, 64, 65, 66, 67, 68, 69, 71, 73, 74, 75, 77,
  79, 81, 82, 83, 84, 85, 86, 87, 88, 89, 91, 92, 93, 94, 95, 96, 97, 98, 99,
]);

/** Celular (81) 9 9999-9999 ou fixo (81) 3333-3333, conforme a quantidade de dígitos. */
export function maskPhone(raw: string): string {
  const d = onlyDigits(raw).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  const ddd = d.slice(0, 2);
  const rest = d.slice(2);
  if (d.length <= 10) {
    // Fixo (ou celular ainda sendo digitado).
    return rest.length > 4 ? `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}` : `(${ddd}) ${rest}`;
  }
  return `(${ddd}) ${rest[0]} ${rest.slice(1, 5)}-${rest.slice(5)}`;
}

export type PhoneKind = 'celular' | 'fixo' | 'qualquer';

/** Mensagem de erro do telefone, ou null se está certo. */
export function phoneError(raw: string, kind: PhoneKind = 'qualquer'): string | null {
  const d = onlyDigits(raw);
  if (d.length < 10) return 'Digite o DDD e o número completo.';
  if (!DDDS.has(Number(d.slice(0, 2)))) return 'Esse DDD não existe. Confira os dois primeiros números.';
  const celular = d.length === 11 && d[2] === '9';
  const fixo = d.length === 10 && /[2-5]/.test(d[2]);
  if (kind === 'celular' && !celular) return 'Celular tem 9 dígitos depois do DDD e começa com 9.';
  if (kind === 'fixo' && !fixo) return 'Telefone fixo tem 8 dígitos depois do DDD.';
  if (!celular && !fixo) return 'Número incompleto ou inválido.';
  return null;
}

/** CEP: 00000-000. */
export function maskCep(raw: string): string {
  const d = onlyDigits(raw).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

/** Data: dd/mm/aaaa enquanto digita. */
export function maskDate(raw: string): string {
  const d = onlyDigits(raw).slice(0, 8);
  if (d.length > 4) return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
  if (d.length > 2) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return d;
}

/** Converte dd/mm/aaaa em Date (meia-noite local), ou null se a data não existe. */
export function parseDate(s: string): Date | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
  if (!m) return null;
  const [dd, mm, yyyy] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(yyyy, mm - 1, dd);
  if (date.getFullYear() !== yyyy || date.getMonth() !== mm - 1 || date.getDate() !== dd) return null;
  return date;
}

/** Erro da data (formato, existência, futuro, ano mínimo), ou null. */
export function dateError(s: string, today = new Date(), minYear = 1900): string | null {
  if (s.length < 10) return 'Digite a data completa: dia/mês/ano.';
  const date = parseDate(s);
  if (!date) return 'Essa data não existe. Confira o dia e o mês.';
  if (date.getFullYear() < minYear) return 'Confira o ano.';
  if (date > today) return 'A data não pode ser no futuro.';
  return null;
}

/** Idade completa em anos numa data de referência. */
export function ageAt(birth: Date, ref = new Date()): number {
  let age = ref.getFullYear() - birth.getFullYear();
  const m = ref.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) age--;
  return age;
}

/** RG: dígitos e X (alguns estados usam X no fim). Sem pontos nem traços. */
export const maskRg = (raw: string) => raw.toUpperCase().replace(/[^0-9X]/g, '').slice(0, 14);

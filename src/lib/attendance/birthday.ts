import type { Birthday, RosterEntry } from './types';

const DIAS_NO_MES = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const valid = (dia: number, mes: number): Birthday | null =>
  Number.isInteger(dia) &&
  Number.isInteger(mes) &&
  mes >= 1 &&
  mes <= 12 &&
  dia >= 1 &&
  dia <= DIAS_NO_MES[mes - 1]
    ? { dia, mes }
    : null;

/**
 * Dia e mês do aniversário a partir do texto da planilha: "15/03/2012", "15-03-2012", "15/3",
 * "2012-03-15", ISO com hora ou o número de série de data do Excel. Inválido vira null.
 */
export function parseBirthday(raw: string | null): Birthday | null {
  const s = (raw ?? '').trim();
  if (!s) return null;
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  if (m) return valid(Number(m[3]), Number(m[2]));
  m = /^(\d{1,2})[/.-](\d{1,2})(?:[/.-]\d{2,4})?$/.exec(s);
  if (m) return valid(Number(m[1]), Number(m[2]));
  // Número de série do Excel (dias desde 30/12/1899), quando a célula de data vem como número.
  if (/^\d{5}$/.test(s)) {
    const d = new Date(Date.UTC(1899, 11, 30) + Number(s) * 86_400_000);
    return valid(d.getUTCDate(), d.getUTCMonth() + 1);
  }
  return null;
}

/** Confere o dia e o mês digitados pelo aluno. */
export const sameBirthday = (entry: RosterEntry, dia: number, mes: number) =>
  entry.nascimento !== null && entry.nascimento.dia === dia && entry.nascimento.mes === mes;

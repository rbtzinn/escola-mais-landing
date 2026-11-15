/**
 * Converte texto de planilha em número. Aceita "7,5", "7.5", "92,4%", "1.234,5".
 * Retorna null para vazio ou texto que não é número.
 */
export function parseNumber(raw: string): number | null {
  let s = raw.trim().replace('%', '').replace(/\s/g, '');
  if (!s) return null;
  if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.');
  else if (s.includes(',')) s = s.replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  return Number(s);
}

/** Formata com vírgula decimal (padrão brasileiro). */
export function formatNumber(n: number, decimals = 1): string {
  return n.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

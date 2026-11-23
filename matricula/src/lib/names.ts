const LOWER = new Set(['da', 'das', 'de', 'do', 'dos', 'e']);

/** Tira espaços sobrando e põe maiúscula no início de cada nome ("maria  DA silva" → "Maria da Silva"). */
export function cleanName(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('pt-BR')
    .split(' ')
    .map((w, i) =>
      i > 0 && LOWER.has(w)
        ? w
        : w
            .split(/([-'])/)
            .map((p) => (p.length ? p[0].toLocaleUpperCase('pt-BR') + p.slice(1) : p))
            .join(''),
    )
    .join(' ');
}

/** Nome completo: pelo menos duas palavras, só letras (com acento), espaço, hífen e apóstrofo. */
export function nameError(raw: string): string | null {
  const s = raw.trim().replace(/\s+/g, ' ');
  if (!s) return 'Escreva o nome completo.';
  if (!/^[\p{L}' -]+$/u.test(s)) return 'Use só letras, sem números ou símbolos.';
  if (s.split(' ').filter((w) => w.length > 1).length < 2) return 'Escreva nome e sobrenome.';
  return null;
}

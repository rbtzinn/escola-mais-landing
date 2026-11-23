/** Só os dígitos de um texto ("123.456.789-09" → "12345678909"). */
export const onlyDigits = (s: string) => s.replace(/\D/g, '');

/** Formata um CPF enquanto a pessoa digita: 000.000.000-00. */
export function maskCpf(raw: string): string {
  const d = onlyDigits(raw).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
}

/**
 * Confere os dois dígitos verificadores do CPF. Não diz se o CPF existe nem de quem é
 * (isso só a Receita sabe), mas barra quase todo erro de digitação.
 */
export function isValidCpf(raw: string): boolean {
  const d = onlyDigits(raw);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const digit = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(d[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return digit(9) === Number(d[9]) && digit(10) === Number(d[10]);
}

/** CPF para mostrar em tela pública ou protocolo: ***.456.789-** . */
export const hideCpf = (raw: string) => {
  const m = maskCpf(raw);
  return m.length === 14 ? `***.${m.slice(4, 11)}-**` : m;
};

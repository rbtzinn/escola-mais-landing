const COMMON = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com.br', 'yahoo.com', 'icloud.com', 'live.com', 'bol.com.br', 'uol.com.br'];

export function emailError(raw: string): string | null {
  const s = raw.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)) return 'E-mail incompleto. Exemplo: nome@gmail.com';
  return null;
}

/** Distância de edição (Levenshtein), para achar domínio digitado errado. */
function distance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

/** Sugere o e-mail corrigido quando o domínio parece um comum digitado errado ("gmial.com"). */
export function emailSuggestion(raw: string): string | null {
  const s = raw.trim().toLowerCase();
  const at = s.lastIndexOf('@');
  if (at < 1) return null;
  const domain = s.slice(at + 1);
  if (!domain || COMMON.includes(domain)) return null;
  const best = COMMON.map((c) => [c, distance(domain, c)] as const).sort((a, b) => a[1] - b[1])[0];
  return best && best[1] > 0 && best[1] <= 2 ? `${s.slice(0, at)}@${best[0]}` : null;
}

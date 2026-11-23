/**
 * Configuração da escola. A cada ano, a secretaria troca o ano, os cursos e o salário mínimo
 * aqui, sem mexer no resto do código.
 */
export const CONFIG = {
  escola: 'ETE Chico Science',
  ano: 2026,
  cursos: ['Nutrição'],
  /** Salário mínimo do ano, usado nas faixas de renda. */
  salarioMinimo: 1518,
  /** URL do app da web do Apps Script (variável de ambiente na Vercel). */
  appsScriptUrl: (import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined) ?? '',
  /** Código simples contra envios de fora do formulário (não é senha; fica visível no site). */
  token: (import.meta.env.VITE_FORM_TOKEN as string | undefined) ?? '',
};

export type Config = typeof CONFIG;

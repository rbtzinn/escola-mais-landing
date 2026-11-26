/**
 * Configuração da escola. A cada ano, a secretaria troca o ano, os cursos e o salário mínimo
 * aqui, sem mexer no resto do código.
 */
export const CONFIG = {
  escola: 'ETE Chico Science',
  /** Logo da escola (arquivo em public/). */
  logo: '/logo-ete.webp',
  ano: 2026,
  /** Cabeçalho do comprovante de matrícula (o mesmo do diploma). */
  cabecalho: [
    'ESCOLA TÉCNICA ESTADUAL CHICO SCIENCE',
    'Avenida Brasil, s/n, Loteamento Rio Doce I/II Etapa, Lote C-2 – Rio Doce – Olinda/PE – CEP 53.150-470',
    'CNPJ 10.572.071/0616-85 · INEP 26.190.737 · Cadastro Escolar E-108102',
  ],
  /** Cursos por modalidade. O aluno escolhe a modalidade e depois o curso. */
  cursos: {
    Integrado: ['Nutrição e Dietética', 'Farmácia'],
    Subsequente: ['Farmácia', 'Enfermagem'],
  } as Record<string, string[]>,
  /** Salário mínimo do ano, usado nas faixas de renda. */
  salarioMinimo: 1518,
  /** URL do app da web do Apps Script (variável de ambiente na Vercel). */
  appsScriptUrl: (import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined) ?? '',
  /** Código simples contra envios de fora do formulário (não é senha; fica visível no site). */
  token: (import.meta.env.VITE_FORM_TOKEN as string | undefined) ?? '',
};

export type Config = typeof CONFIG;

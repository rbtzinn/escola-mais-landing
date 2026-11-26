import { onlyDigits } from './cpf';

/** Recusas da planilha que valem tanto na conferência do começo quanto no envio. */
export type Blocked =
  | { status: 'fora_do_periodo'; inicio: string; fim: string }
  | { status: 'muitas_tentativas' }
  | { status: 'ocupado' }
  | { status: 'sem_configuracao' }
  | { status: 'erro'; message: string };

export type SubmitResult = { status: 'ok'; protocolo: string } | Blocked;

/** A matrícula está aberta para esse aluno (no período ou com exceção). */
export type CheckResult = { status: 'ok' } | Blocked;

export interface Payload {
  token: string;
  cpf: string;
  columns: string[];
  row: string[];
}

export type Reply = {
  status?: string;
  protocolo?: string;
  message?: string;
  inicio?: string;
  fim?: string;
};

/**
 * POST para o app da web do Apps Script. Usa text/plain de propósito: assim o navegador não faz
 * a checagem prévia de CORS, que o Apps Script não responde.
 */
export async function post<T = Reply>(
  url: string,
  body: object,
  fetcher: typeof fetch = fetch,
): Promise<T | null> {
  try {
    const res = await fetcher(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
    });
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function blocked(data: Reply | null): Blocked {
  if (!data) return { status: 'erro', message: 'Sem conexão com a planilha.' };
  switch (data.status) {
    case 'muitas_tentativas':
    case 'ocupado':
      return { status: data.status };
    case 'fora_do_periodo':
      return { status: 'fora_do_periodo', inicio: data.inicio ?? '', fim: data.fim ?? '' };
    default:
      return { status: 'erro', message: data.message ?? 'Resposta inesperada da planilha.' };
  }
}

/**
 * Acorda o script da planilha: o Apps Script "dorme" quando ninguém o usa e o primeiro pedido
 * paga a espera. Chamado ao abrir a página, para o pedido de verdade já encontrar o script pronto.
 * Não envia dado nenhum, não espera e ignora falhas.
 */
export function warmUp(url: string, fetcher: typeof fetch = fetch): void {
  if (!url) return;
  void post(url, { action: 'ping' }, fetcher);
}

/**
 * Confere, antes do aluno preencher o resto, se a matrícula está aberta para esse CPF e
 * nascimento (período ou exceção). A lista de aprovados não bloqueia: vira checklist na planilha.
 */
export async function checkInicio(
  url: string,
  input: { token: string; cpf: string; nascimento: string },
  fetcher: typeof fetch = fetch,
): Promise<CheckResult> {
  if (!url) return { status: 'sem_configuracao' };
  const data = await post(url, { ...input, action: 'check', cpf: onlyDigits(input.cpf) }, fetcher);
  if (data?.status === 'ok') return { status: 'ok' };
  return blocked(data);
}

export interface RetryOptions {
  /** Total de tentativas, contando a primeira. */
  tries?: number;
  /** Espera antes de cada nova tentativa (ms): a 2ª espera o 1º valor, a 3ª o 2º... */
  delays?: number[];
  /** Avisa a tela antes de cada nova tentativa (2 de 3, 3 de 3). */
  onRetry?: (attempt: number, total: number) => void;
  /** Troca a espera de verdade (nos testes). */
  wait?: (ms: number) => Promise<void>;
}

export const SUBMIT_TRIES = 3;
const SUBMIT_DELAYS = [2000, 5000];
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Envia a matrícula. A planilha confere tudo de novo antes de gravar.
 * Se a fila da planilha estiver cheia ("ocupado") ou a internet cair, tenta de novo sozinho.
 * Reenviar é seguro: o mesmo CPF de novo vale o último envio e o anterior vira Cancelado.
 */
export async function submitMatricula(
  url: string,
  payload: Payload,
  fetcher: typeof fetch = fetch,
  opts: RetryOptions = {},
): Promise<SubmitResult> {
  if (!url) return { status: 'sem_configuracao' };
  const tries = Math.max(1, opts.tries ?? SUBMIT_TRIES);
  const delays = opts.delays ?? SUBMIT_DELAYS;
  const wait = opts.wait ?? sleep;
  const body = { ...payload, cpf: onlyDigits(payload.cpf) };
  let data: Reply | null = null;
  for (let attempt = 1; attempt <= tries; attempt++) {
    if (attempt > 1) {
      opts.onRetry?.(attempt, tries);
      await wait(delays[Math.min(attempt - 2, delays.length - 1)] ?? 0);
    }
    data = await post(url, body, fetcher);
    if (data?.status === 'ok' && data.protocolo) return { status: 'ok', protocolo: data.protocolo };
    if (data && data.status !== 'ocupado') break;
  }
  return blocked(data);
}

/** Mensagem para o aluno. */
export function blockedMessage(r: Blocked): string {
  switch (r.status) {
    case 'fora_do_periodo':
      return r.inicio && r.fim
        ? `As matrículas estão fechadas. O período é de ${r.inicio} a ${r.fim}.`
        : r.inicio
          ? `As matrículas abrem em ${r.inicio}.`
          : 'As matrículas estão encerradas. Procure a secretaria.';
    case 'muitas_tentativas':
      return 'Muitas tentativas agora. Espere alguns minutos e tente de novo.';
    case 'ocupado':
      return 'Muita gente enviando a matrícula agora. Espere um minuto e tente de novo.';
    case 'sem_configuracao':
      return 'Demonstração: a planilha da escola ainda não foi ligada a este formulário.';
    case 'erro':
      return `Não foi possível conferir agora (${r.message}). Tente de novo em instantes.`;
  }
}

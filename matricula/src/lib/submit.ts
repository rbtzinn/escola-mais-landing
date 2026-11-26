import { onlyDigits } from './cpf';

/** Recusas da planilha que valem tanto na conferência do começo quanto no envio. */
export type Blocked =
  | { status: 'fora_do_periodo'; inicio: string; fim: string }
  | { status: 'muitas_tentativas' }
  | { status: 'sem_configuracao' }
  | { status: 'erro'; message: string };

/** Envio gravado: protocolo, data e hora e os próximos passos (para o comprovante). */
export type SubmitResult =
  | { status: 'ok'; protocolo: string; enviadoEm: string; proximos: string }
  | Blocked;

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
  enviadoEm?: string;
  proximos?: string;
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

/** Envia a matrícula. A planilha confere tudo de novo antes de gravar. */
export async function submitMatricula(
  url: string,
  payload: Payload,
  fetcher: typeof fetch = fetch,
): Promise<SubmitResult> {
  if (!url) return { status: 'sem_configuracao' };
  const data = await post(url, { ...payload, cpf: onlyDigits(payload.cpf) }, fetcher);
  if (data?.status === 'ok' && data.protocolo)
    return {
      status: 'ok',
      protocolo: data.protocolo,
      enviadoEm: data.enviadoEm ?? '',
      proximos: data.proximos ?? '',
    };
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
    case 'sem_configuracao':
      return 'Demonstração: a planilha da escola ainda não foi ligada a este formulário.';
    case 'erro':
      return `Não foi possível conferir agora (${r.message}). Tente de novo em instantes.`;
  }
}

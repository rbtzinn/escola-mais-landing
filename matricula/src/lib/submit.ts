import { onlyDigits } from './cpf';

export type SubmitResult =
  | { status: 'ok'; protocolo: string }
  | { status: 'cpf_duplicado' }
  | { status: 'sem_configuracao' }
  | { status: 'erro'; message: string };

export interface Payload {
  token: string;
  cpf: string;
  columns: string[];
  row: string[];
}

/**
 * Envia para o app da web do Apps Script. Usa text/plain de propósito: assim o navegador não faz
 * a checagem prévia de CORS, que o Apps Script não responde.
 */
export async function submitMatricula(
  url: string,
  payload: Payload,
  fetcher: typeof fetch = fetch,
): Promise<SubmitResult> {
  if (!url) return { status: 'sem_configuracao' };
  try {
    const res = await fetcher(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ ...payload, cpf: onlyDigits(payload.cpf) }),
    });
    const data = (await res.json()) as { status?: string; protocolo?: string; message?: string };
    if (data.status === 'ok' && data.protocolo) return { status: 'ok', protocolo: data.protocolo };
    if (data.status === 'cpf_duplicado') return { status: 'cpf_duplicado' };
    return { status: 'erro', message: data.message ?? 'Resposta inesperada da planilha.' };
  } catch {
    return { status: 'erro', message: 'Sem conexão com a planilha.' };
  }
}

import { onlyDigits } from './cpf';

/** Recusas da planilha que valem tanto na conferência do começo quanto no envio. */
export type Blocked =
  | { status: 'cpf_duplicado' }
  | { status: 'nao_encontrado' }
  | { status: 'fora_do_periodo'; inicio: string; fim: string }
  | { status: 'muitas_tentativas' }
  | { status: 'sem_configuracao' }
  | { status: 'erro'; message: string };

export type SubmitResult = { status: 'ok'; protocolo: string } | { status: 'curso_diferente' } | Blocked;

/** Aprovado na lista: a planilha devolve a modalidade e o curso dele (vazios se a lista não diz). */
export type CheckResult = { status: 'ok'; modalidade: string; curso: string } | Blocked;

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
  modalidade?: string;
  curso?: string;
  inicio?: string;
  fim?: string;
};

/**
 * POST para o app da web do Apps Script. Usa text/plain de propósito: assim o navegador não faz
 * a checagem prévia de CORS, que o Apps Script não responde.
 */
export async function post<T = Reply>(url: string, body: object, fetcher: typeof fetch = fetch): Promise<T | null> {
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
    case 'cpf_duplicado':
    case 'nao_encontrado':
    case 'muitas_tentativas':
      return { status: data.status };
    case 'fora_do_periodo':
      return { status: 'fora_do_periodo', inicio: data.inicio ?? '', fim: data.fim ?? '' };
    default:
      return { status: 'erro', message: data.message ?? 'Resposta inesperada da planilha.' };
  }
}

/** Confere CPF e nascimento na lista de aprovados, antes do aluno preencher o resto. */
export async function checkAprovado(
  url: string,
  input: { token: string; cpf: string; nascimento: string },
  fetcher: typeof fetch = fetch,
): Promise<CheckResult> {
  if (!url) return { status: 'sem_configuracao' };
  const data = await post(url, { ...input, action: 'check', cpf: onlyDigits(input.cpf) }, fetcher);
  if (data?.status === 'ok') return { status: 'ok', modalidade: data.modalidade ?? '', curso: data.curso ?? '' };
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
  if (data?.status === 'ok' && data.protocolo) return { status: 'ok', protocolo: data.protocolo };
  if (data?.status === 'curso_diferente') return { status: 'curso_diferente' };
  return blocked(data);
}

/** Mensagem para o aluno. Não diz se o CPF existe na lista (quem quer adivinhar não aprende nada). */
export function blockedMessage(r: Blocked | { status: 'curso_diferente' }): string {
  switch (r.status) {
    case 'cpf_duplicado':
      return 'Esse CPF já foi matriculado. Procure a secretaria da escola.';
    case 'nao_encontrado':
      return 'Não encontramos seus dados na lista de aprovados. Confira o CPF e a data de nascimento ou procure a secretaria.';
    case 'fora_do_periodo':
      return r.inicio && r.fim
        ? `As matrículas estão fechadas. O período é de ${r.inicio} a ${r.fim}.`
        : r.inicio
          ? `As matrículas abrem em ${r.inicio}.`
          : 'As matrículas estão encerradas. Procure a secretaria.';
    case 'muitas_tentativas':
      return 'Muitas tentativas agora. Espere alguns minutos e tente de novo.';
    case 'curso_diferente':
      return 'O curso escolhido não é o da sua aprovação. Volte na etapa do curso ou procure a secretaria.';
    case 'sem_configuracao':
      return 'Demonstração: a planilha da escola ainda não foi ligada a este formulário.';
    case 'erro':
      return `Não foi possível conferir agora (${r.message}). Tente de novo em instantes.`;
  }
}

import { CONFIG } from '@/config';
import { post } from './submit';

export type Role = 'direcao' | 'coordenacao';

export interface Session {
  sessao: string;
  nome: string;
  papel: Role;
  exp: number;
}

const KEY = 'admin:sessao';

export function loadSession(now = Date.now()): Session | null {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Session | null;
    return s && s.exp > now && s.sessao ? s : null;
  } catch {
    return null;
  }
}

export function saveSession(s: Session) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* sem armazenamento: a sessão vale só nesta aba */
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nada a fazer */
  }
}

export type ApiReply = { status: string; message?: string } & Record<string, unknown>;

/** Chama o Apps Script. Sem planilha configurada ou sem rede, devolve um erro legível. */
export async function api(
  action: string,
  body: object = {},
  sessao?: string,
  fetcher: typeof fetch = fetch,
): Promise<ApiReply> {
  if (!CONFIG.appsScriptUrl)
    return { status: 'erro', message: 'A planilha ainda não foi ligada a este site.' };
  const r = await post<ApiReply>(CONFIG.appsScriptUrl, { action, sessao, ...body }, fetcher);
  return r ?? { status: 'erro', message: 'Sem conexão com a planilha.' };
}

/** Mensagem para os erros comuns do painel. */
export function replyMessage(r: ApiReply): string {
  switch (r.status) {
    case 'login_invalido':
      return 'Login ou senha errados.';
    case 'muitas_tentativas':
      return 'Muitas tentativas. Espere 15 minutos e tente de novo.';
    case 'ocupado':
      return 'A planilha está ocupada com outros envios. Tente de novo em instantes.';
    case 'sem_permissao':
      return 'Seu usuário não pode fazer isso.';
    case 'sessao_expirada':
      return 'Sua sessão acabou. Entre de novo.';
    default:
      return r.message ?? 'Algo deu errado. Tente de novo.';
  }
}

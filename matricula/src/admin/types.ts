import type { ApiReply, Role } from '@/lib/adminApi';

export interface Exception {
  linha: number;
  cpf: string;
  nasc: string;
  nome: string;
  periodo: boolean;
  lista: boolean;
  reenvio: boolean;
  validade: string;
  criadaPor: string;
  criadaEm: string;
  usadaEm: string;
}

export interface PanelData {
  usuario: { nome: string; papel: Role };
  hoje: string;
  cabecalho: string[];
  linhas: string[][];
  periodo: { inicio: string; fim: string };
  aprovados?: { cpf: string; nasc: string; nome: string; modalidade: string; curso: string }[];
  excecoes?: Exception[];
  usuarios?: { nome: string; login: string; papel: Role; ativo: boolean }[];
}

/** Executa uma ação no Apps Script; com sucesso, o painel recarrega os dados. */
export type Run = (action: string, body: object) => Promise<ApiReply>;

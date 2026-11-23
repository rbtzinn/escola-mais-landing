import { isValidCpf, onlyDigits } from './cpf';
import { parseDate } from './masks';
import { toRow } from './row';
import type { Step } from './schema';
import { normalizeText } from './text';

export const STATUS = ['Matriculado', 'Pendente', 'Cancelado'] as const;
export type Status = (typeof STATUS)[number];

/** Uma matrícula da planilha, com os campos que o painel usa e a linha inteira. */
export interface Rec {
  protocolo: string;
  status: string;
  observacao: string;
  alteradoPor: string;
  alteradoEm: string;
  enviadoEm: string;
  cpf: string;
  nome: string;
  modalidade: string;
  curso: string;
  row: string[];
}

export function toRecords(header: string[], rows: string[][]): Rec[] {
  const at = (r: string[], name: string) => {
    const i = header.indexOf(name);
    return i >= 0 ? String(r[i] ?? '').trim() : '';
  };
  return rows
    .filter((r) => at(r, 'Protocolo'))
    .map((r) => ({
      protocolo: at(r, 'Protocolo'),
      status: at(r, 'Status') || 'Matriculado',
      observacao: at(r, 'Observação'),
      alteradoPor: at(r, 'Alterado por'),
      alteradoEm: at(r, 'Alterado em'),
      enviadoEm: at(r, 'Enviado em'),
      cpf: onlyDigits(at(r, 'CPF do aluno')),
      nome: at(r, 'Seu nome completo'),
      modalidade: at(r, 'Modalidade'),
      curso: at(r, 'Curso'),
      row: r,
    }));
}

export interface Filters {
  busca: string;
  curso: string;
  status: string;
}

/** Busca por nome, CPF ou protocolo (sem acento); curso no formato "Modalidade · Curso". */
export function filterRecords(recs: Rec[], f: Filters): Rec[] {
  const q = normalizeText(f.busca.trim());
  const digits = onlyDigits(f.busca);
  return recs.filter((r) => {
    if (f.status && r.status !== f.status) return false;
    if (f.curso && courseKey(r) !== f.curso) return false;
    if (!q) return true;
    return (
      normalizeText(r.nome).includes(q) ||
      normalizeText(r.protocolo).includes(q) ||
      (digits.length >= 3 && r.cpf.includes(digits))
    );
  });
}

export const courseKey = (r: { modalidade: string; curso: string }) =>
  [r.modalidade, r.curso].filter(Boolean).join(' · ') || 'Sem curso';

export interface Stats {
  ativos: number;
  matriculados: number;
  pendentes: number;
  cancelados: number;
  porCurso: { curso: string; ativos: number; pendentes: number }[];
  /** Envios por dia (todos, inclusive os cancelados depois), em ordem. */
  porDia: { dia: string; n: number }[];
}

export function stats(recs: Rec[]): Stats {
  const by = new Map<string, { ativos: number; pendentes: number }>();
  const days = new Map<string, number>();
  let matriculados = 0;
  let pendentes = 0;
  let cancelados = 0;
  for (const r of recs) {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(r.enviadoEm);
    if (m) {
      const key = `${m[3]}${m[2]}${m[1]}`;
      days.set(key, (days.get(key) ?? 0) + 1);
    }
    if (r.status === 'Cancelado') {
      cancelados++;
      continue;
    }
    if (r.status === 'Pendente') pendentes++;
    else matriculados++;
    const c = by.get(courseKey(r)) ?? { ativos: 0, pendentes: 0 };
    c.ativos++;
    if (r.status === 'Pendente') c.pendentes++;
    by.set(courseKey(r), c);
  }
  return {
    ativos: matriculados + pendentes,
    matriculados,
    pendentes,
    cancelados,
    porCurso: [...by.entries()]
      .map(([curso, v]) => ({ curso, ...v }))
      .sort((a, b) => a.curso.localeCompare(b.curso)),
    porDia: [...days.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, n]) => ({ dia: `${k.slice(6, 8)}/${k.slice(4, 6)}`, n })),
  };
}

export interface ApprovedLine {
  cpf: string;
  nasc: string;
  nome: string;
  modalidade: string;
  curso: string;
}

/**
 * Lista colada da planilha (ou de um texto): uma pessoa por linha, separada por tab, ";" ou ",".
 * Se a primeira linha tiver "CPF", ela é o cabeçalho e diz a ordem das colunas; senão, a ordem é
 * CPF, nascimento, nome, modalidade, curso. Devolve as linhas boas e as recusadas (com o motivo).
 */
export function parseAprovados(text: string): {
  ok: ApprovedLine[];
  bad: { linha: number; texto: string; motivo: string }[];
} {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return { ok: [], bad: [] };
  const sep = lines.some((l) => l.includes('\t'))
    ? '\t'
    : lines.some((l) => l.includes(';'))
      ? ';'
      : ',';
  const split = (l: string) => l.split(sep).map((c) => c.trim());
  let order = { cpf: 0, nasc: 1, nome: 2, modalidade: 3, curso: 4 };
  let start = 0;
  const first = split(lines[0]).map(normalizeText);
  if (first.includes('cpf')) {
    const find = (...names: string[]) => first.findIndex((c) => names.some((n) => c.includes(n)));
    order = {
      cpf: first.indexOf('cpf'),
      nasc: find('nasc'),
      nome: find('nome'),
      modalidade: find('modalidade'),
      curso: find('curso'),
    };
    start = 1;
  }
  const ok: ApprovedLine[] = [];
  const bad: { linha: number; texto: string; motivo: string }[] = [];
  const seen = new Set<string>();
  lines.slice(start).forEach((l, i) => {
    const c = split(l);
    const get = (k: keyof typeof order) => (order[k] >= 0 ? (c[order[k]] ?? '') : '');
    let cpf = onlyDigits(get('cpf'));
    if (cpf.length >= 9 && cpf.length < 11) cpf = cpf.padStart(11, '0');
    const nasc = normalizeDate(get('nasc'));
    const linha = i + start + 1;
    if (!isValidCpf(cpf)) bad.push({ linha, texto: l, motivo: 'CPF inválido' });
    else if (!nasc) bad.push({ linha, texto: l, motivo: 'Data de nascimento inválida' });
    else if (seen.has(cpf)) bad.push({ linha, texto: l, motivo: 'CPF repetido na lista' });
    else {
      seen.add(cpf);
      ok.push({ cpf, nasc, nome: get('nome'), modalidade: get('modalidade'), curso: get('curso') });
    }
  });
  return { ok, bad };
}

/** "5/3/2010", "05-03-2010" ou "2010-03-05" → "05/03/2010"; inválida → "". */
export function normalizeDate(s: string): string {
  const t = s.trim();
  let m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(t);
  let d: string, mo: string, y: string;
  if (m) [, d, mo, y] = m;
  else if ((m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t))) [, y, mo, d] = m;
  else return '';
  const out = `${d.padStart(2, '0')}/${mo.padStart(2, '0')}/${y}`;
  return parseDate(out) ? out : '';
}

/** CSV para o Excel brasileiro: BOM (acentos) e ponto e vírgula. */
export function toCsv(header: string[], rows: string[][]): string {
  const esc = (s: string) => `"${String(s ?? '').replace(/"/g, '""')}"`;
  return `\uFEFF${[header, ...rows].map((r) => r.map(esc).join(';')).join('\r\n')}\r\n`;
}

export interface FichaSection {
  title: string;
  items: { label: string; value: string }[];
}

/** Ficha do aluno: colunas agrupadas pelas etapas do formulário; vazias não aparecem. */
export function ficha(steps: Step[], header: string[], row: string[]): FichaSection[] {
  const { columns, stepIds } = toRow(steps, {});
  const stepOf = new Map(columns.map((c, i) => [c, stepIds[i]]));
  const titles = new Map(steps.map((s) => [s.id, s.title]));
  const sections = new Map<string, FichaSection>();
  const add = (title: string, label: string, value: string) => {
    if (!sections.has(title)) sections.set(title, { title, items: [] });
    sections.get(title)!.items.push({ label, value });
  };
  const SKIP = new Set(['Status', 'Observação', 'Alterado por', 'Alterado em']);
  header.forEach((col, i) => {
    const value = String(row[i] ?? '').trim();
    if (!col || !value || SKIP.has(col)) return;
    const id = stepOf.get(col);
    add(id ? (titles.get(id) ?? 'Outras') : id === '' ? 'Matrícula' : 'Matrícula', col, value);
  });
  // Ordem: Matrícula, depois as etapas na ordem do formulário.
  const order = ['Matrícula', ...steps.map((s) => s.title)];
  return [...sections.values()].sort((a, b) => order.indexOf(a.title) - order.indexOf(b.title));
}

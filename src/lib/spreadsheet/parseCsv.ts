import type { RawTable } from './types';

/** Escolhe o delimitador mais frequente na primeira linha (fora de aspas). */
function detectDelimiter(text: string): string {
  const counts: Record<string, number> = { ';': 0, ',': 0, '\t': 0 };
  let quoted = false;
  for (const ch of text) {
    if (ch === '"') quoted = !quoted;
    else if (!quoted && (ch === '\n' || ch === '\r')) break;
    else if (!quoted && ch in counts) counts[ch]++;
  }
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : ',';
}

/** Divide o texto CSV em matriz de células (aspas duplas, "" escapado, \r\n, delimitador automático). */
export function parseCsvMatrix(input: string): string[][] {
  const text = input.replace(/^﻿/, '');
  const delimiter = detectDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  const endCell = () => {
    row.push(cell.trim());
    cell = '';
  };
  const endRow = () => {
    endCell();
    if (row.some((c) => c !== '')) rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delimiter) endCell();
    else if (ch === '\n') endRow();
    else if (ch === '\r') {
      if (text[i + 1] === '\n') i++;
      endRow();
    } else cell += ch;
  }
  if (cell !== '' || row.length > 0) endRow();
  return rows;
}

/**
 * Transforma uma matriz (primeira linha = cabeçalho) em tabela: nomeia colunas vazias
 * ("Coluna N"), desduplica nomes e completa linhas curtas.
 */
export function matrixToTable(matrix: string[][]): RawTable {
  if (matrix.length === 0) return { headers: [], rows: [] };
  const width = Math.max(...matrix.map((r) => r.length));
  const seen = new Map<string, number>();
  const headers = Array.from({ length: width }, (_, i) => {
    const base = (matrix[0][i] ?? '').trim() || `Coluna ${i + 1}`;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return n === 1 ? base : `${base} (${n})`;
  });
  const rows = matrix.slice(1).map((r) => Array.from({ length: width }, (_, i) => r[i] ?? ''));
  return { headers, rows };
}

/** Lê texto CSV (delimitador `;`, `,` ou tab) como tabela. */
export function parseCsv(text: string): RawTable {
  return matrixToTable(parseCsvMatrix(text));
}

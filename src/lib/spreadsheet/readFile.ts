import { matrixToTable, parseCsvMatrix } from './parseCsv';
import type { RawTable } from './types';

export const MAX_BYTES = 5 * 1024 * 1024;
export const MAX_ROWS = 5000;

function readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === 'function') return file.arrayBuffer();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.readAsArrayBuffer(file);
  });
}

/** UTF-8 e, se o arquivo não for UTF-8 válido (Excel antigo), Windows-1252. */
function decodeText(buffer: ArrayBuffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder('windows-1252').decode(buffer);
  }
}

function cellToText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toLocaleDateString('pt-BR');
  return String(value);
}

/**
 * Lê um arquivo .csv ou .xlsx (primeira aba) como tabela, no navegador.
 * Lança Error com mensagem em português para tamanho, formato ou conteúdo inválidos.
 */
export async function readSpreadsheet(file: File): Promise<RawTable> {
  const name = file.name.toLowerCase();
  if (file.size > MAX_BYTES) throw new Error('O arquivo passa de 5 MB. Envie uma planilha menor.');
  if (name.endsWith('.xls')) {
    throw new Error(
      'Arquivos .xls antigos não são aceitos. Salve como .xlsx ou .csv e envie de novo.',
    );
  }

  let matrix: string[][];
  if (name.endsWith('.csv')) {
    matrix = parseCsvMatrix(decodeText(await readAsArrayBuffer(file)));
  } else if (name.endsWith('.xlsx')) {
    try {
      const { readSheet } = await import('read-excel-file/browser');
      const rows = await readSheet(file);
      matrix = rows
        .map((r) => r.map(cellToText).map((c) => c.trim()))
        .filter((r) => r.some((c) => c !== ''));
    } catch {
      throw new Error('Não foi possível ler o arquivo Excel. Confira se ele não está corrompido.');
    }
  } else {
    throw new Error('Formato não aceito. Envie um arquivo .csv ou .xlsx.');
  }

  const table = matrixToTable(matrix);
  if (table.headers.length === 0 || table.rows.length === 0) {
    throw new Error('A planilha está vazia ou não tem linhas de dados abaixo do cabeçalho.');
  }
  if (table.rows.length > MAX_ROWS) {
    throw new Error(
      `A planilha tem mais de ${MAX_ROWS.toLocaleString('pt-BR')} linhas. Envie uma parte menor.`,
    );
  }
  return table;
}

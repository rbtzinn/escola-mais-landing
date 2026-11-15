import { formatNumber } from './numbers';
import type { Analysis } from './types';

const cell = (v: string) => (/[;"\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** Lista de alunos em risco em CSV (delimitador `;` e BOM UTF-8, abre direto no Excel). */
export function riskToCsv(analysis: Analysis): string {
  const lines = [['Aluno', 'Turma', 'Frequência (%)', 'Média', 'Motivos']];
  for (const { student: s, motivos } of analysis.risco) {
    lines.push([
      s.aluno,
      s.turma,
      s.frequencia === null ? '' : formatNumber(s.frequencia, 0),
      s.media === null ? '' : formatNumber(s.media),
      motivos.join(' | '),
    ]);
  }
  return '﻿' + lines.map((l) => l.map(cell).join(';')).join('\r\n');
}

/** Baixa um texto como arquivo, sem enviar nada à rede. */
export function downloadText(filename: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

import { formatHora } from './clock';
import type { LateRecord } from './types';

/**
 * Aviso de atraso para a família. Mínimo por desenho (LGPD): só quem, turma e horário.
 * Motivo, notas e quem registrou não entram na mensagem.
 */
export function lateMessage(r: Pick<LateRecord, 'aluno' | 'turma' | 'at'>): string {
  return (
    `Olá! Aqui é da coordenação da escola. Informamos que ${r.aluno} (${r.turma}) ` +
    `chegou às ${formatHora(new Date(r.at))} hoje. Qualquer dúvida, estamos à disposição.`
  );
}

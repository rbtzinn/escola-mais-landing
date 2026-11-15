import { formatNumber } from './numbers';
import type { Options, Student } from './types';

/**
 * Normaliza um telefone brasileiro para o formato do wa.me (só dígitos, com 55).
 * Aceita "(81) 99999-0000", "81999990000" e "+55 81 99999-0000". Retorna null se não parecer telefone.
 */
export function normalizePhone(raw: string | null): string | null {
  if (!raw) return null;
  const d = raw.replace(/\D/g, '').replace(/^0+/, '');
  if (d.length === 10 || d.length === 11) return `55${d}`;
  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) return d;
  return null;
}

/** Motivos em linguagem de família: "a frequência está em 68%" etc. */
function reasons(s: Student, o: Options): string[] {
  const out: string[] = [];
  if (s.frequencia !== null && s.frequencia < o.freqMin)
    out.push(`a frequência está em ${formatNumber(s.frequencia, 0)}%`);
  if (s.media !== null && s.media < o.mediaMin)
    out.push(`a média geral está em ${formatNumber(s.media)}`);
  if (s.atrasos !== null && s.atrasos >= o.atrasosMin) out.push(`já são ${s.atrasos} atrasos`);
  return out;
}

const join = (xs: string[]) =>
  xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} e ${xs[xs.length - 1]}`;

/** Mensagem pronta para a família, revisável antes de enviar. */
export function familyMessage(s: Student, o: Options): string {
  const r = reasons(s, o);
  const motivo = r.length
    ? ` Notamos que ${join(r)}.`
    : ' Gostaríamos de conversar sobre o acompanhamento escolar.';
  return (
    `Olá! Aqui é da coordenação da escola, sobre ${s.aluno} (${s.turma}).${motivo}` +
    ' Podemos marcar uma conversa? Obrigado!'
  );
}

/** Link do WhatsApp com o texto pronto. Sem telefone válido, o WhatsApp pede para escolher o contato. */
export function whatsappUrl(phone: string | null, text: string): string {
  const n = normalizePhone(phone);
  return `https://wa.me/${n ?? ''}?text=${encodeURIComponent(text)}`;
}

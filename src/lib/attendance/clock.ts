import type { ClockSettings } from './types';

const HHMM = /^([01]?\d|2[0-3]):([0-5]\d)$/;

export const isValidTime = (s: string) => HHMM.test(s.trim());

/** "07:25" → minutos desde a meia-noite (null se inválido). */
export function toMinutes(s: string): number | null {
  const m = HHMM.exec(s.trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/** Hora usada pela demo: a simulada (na data de hoje) ou a real. */
export function nowFor(settings: ClockSettings, real: Date): Date {
  const sim = settings.simulada === null ? null : toMinutes(settings.simulada);
  if (sim === null) return real;
  const d = new Date(real);
  d.setHours(Math.floor(sim / 60), sim % 60, 0, 0);
  return d;
}

/** Atraso em minutos depois da entrada; só conta como atraso acima da tolerância. */
export function lateness(
  at: Date,
  settings: ClockSettings,
): { atrasado: boolean; minutos: number } {
  const entrada = toMinutes(settings.entrada) ?? 7 * 60;
  const minutos = at.getHours() * 60 + at.getMinutes() - entrada;
  return { atrasado: minutos > settings.tolerancia, minutos: Math.max(0, minutos) };
}

/** 7h05, 13h40. */
export function formatHora(d: Date): string {
  return `${d.getHours()}h${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Soma minutos a um "HH:MM" (para o botão +5 min da hora simulada). */
export function addMinutes(s: string, delta: number): string {
  const m = ((toMinutes(s) ?? 0) + delta + 24 * 60) % (24 * 60);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** Mesmo dia no fuso local (um registro por aluno por dia). */
export const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

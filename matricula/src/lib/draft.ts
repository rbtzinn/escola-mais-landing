import type { Values } from './schema';

const KEY = 'matricula:rascunho';

export interface Draft {
  values: Values;
  step: number;
}

/** Rascunho salvo neste aparelho. Sem armazenamento (modo privado), simplesmente não salva. */
export function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Draft;
    return d && typeof d === 'object' && d.values ? d : null;
  } catch {
    return null;
  }
}

export function saveDraft(d: Draft) {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    // Sem espaço ou sem permissão: segue sem rascunho.
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // nada a fazer
  }
}

/** Remove acentos e põe em minúsculas, para buscas como "sao" encontrar "São Paulo". */
export function normalizeText(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/** Decide se uma lista suspensa deve abrir para cima por falta de espaço abaixo. */
export function shouldOpenUp(el: HTMLElement, listHeight = 280): boolean {
  const rect = el.getBoundingClientRect();
  const below = window.innerHeight - rect.bottom;
  return below < listHeight && rect.top > below;
}

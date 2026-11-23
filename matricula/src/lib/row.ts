import { OUTRO, type Step, type Values, isStepVisible, isVisible } from './schema';

/**
 * Cabeçalho e valores da linha da planilha, na ordem das etapas. Campo escondido vai vazio.
 * `fixed` são colunas que o aluno não responde (ex.: ano de ingresso), postas no começo.
 */
export function toRow(
  steps: Step[],
  v: Values,
  fixed: Record<string, string> = {},
): { columns: string[]; row: string[]; stepIds: string[] } {
  const columns: string[] = Object.keys(fixed);
  const row: string[] = Object.values(fixed);
  const stepIds: string[] = columns.map(() => '');
  let stepId = '';
  const push = (col: string, val: string) => {
    columns.push(col);
    row.push(val);
    stepIds.push(stepId);
  };
  const text = (id: string) => (typeof v[id] === 'string' ? (v[id] as string).trim() : '');
  // Rótulos repetidos em etapas diferentes ("Estado", "Cidade", "Qual?") ganham o nome da etapa.
  const count = new Map<string, number>();
  for (const s of steps) for (const f of s.fields) count.set(f.label, (count.get(f.label) ?? 0) + 1);

  for (const step of steps) {
    stepId = step.id;
    for (const f of step.fields) {
      const visible = isStepVisible(step, v) && isVisible(f, v);
      if (f.kind === 'consent') {
        push('Consentimento LGPD', text(f.id) === 'sim' ? 'Sim' : '');
        continue;
      }
      if (f.kind === 'grid') {
        for (const r of f.rows ?? []) push(`${shortLabel(f.label)}: ${r}`, visible ? text(`${f.id}:${r}`) : '');
        continue;
      }
      let val = '';
      if (visible) {
        if (f.kind === 'multi') {
          const sel = Array.isArray(v[f.id]) ? (v[f.id] as string[]) : [];
          val = sel.map((s) => (s === OUTRO ? `Outro: ${text(`${f.id}_outro`)}` : s)).join('; ');
        } else {
          val = text(f.id);
          if (f.other && val === OUTRO) val = `Outro: ${text(`${f.id}_outro`)}`;
        }
      }
      push((count.get(f.label) ?? 0) > 1 ? `${f.label} (${step.short})` : f.label, val);
    }
  }
  return { columns, row, stepIds };
}

const shortLabel = (label: string) => (label.length > 30 ? 'Interesse' : label);

import { Icon, type IconName } from '@/components/icons';
import { type Action, todayActions } from '@/lib/spreadsheet/insights';
import type { Analysis } from '@/lib/spreadsheet/types';

const ICON: Record<Action['kind'], IconName> = {
  aluno: 'message',
  turma: 'school',
  atrasos: 'calendar',
};

/** "O que fazer hoje": até 3 cartões que levam direto ao detalhe. */
export function TodayActions({
  analysis,
  onAction,
}: {
  analysis: Analysis;
  onAction: (a: Action) => void;
}) {
  const actions = todayActions(analysis);
  if (actions.length === 0) return null;
  return (
    <section aria-labelledby="acoes-titulo">
      <h3 id="acoes-titulo" className="mb-2 font-display text-lg font-semibold">
        O que fazer hoje
      </h3>
      <ol className="space-y-2">
        {actions.map((a, i) => (
          <li key={`${a.kind}-${a.title}`}>
            <button
              type="button"
              onClick={() => onAction(a)}
              className="flex w-full min-w-0 items-center gap-3 rounded-2xl border border-border bg-surface p-3 text-left transition-colors hover:border-primary"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-sm border border-primary/40 text-primary">
                <Icon name={ICON[a.kind]} size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">
                  <span className="sr-only">{i + 1}. </span>
                  {a.title}
                </span>
                <span className="block truncate text-sm text-fg-muted">{a.detail}</span>
              </span>
              <Icon name="arrow" size={18} className="shrink-0 text-fg-muted" />
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

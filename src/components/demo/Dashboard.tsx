import { Icon } from '@/components/icons';
import type { Analysis } from '@/lib/spreadsheet/types';
import { ClassFrequencyChart } from './ClassFrequencyChart';
import { GradesTable } from './GradesTable';
import { KpiCards } from './KpiCards';
import { LateList } from './LateList';
import { RiskList } from './RiskList';

export function Dashboard({
  analysis,
  hasLateColumn,
}: {
  analysis: Analysis;
  hasLateColumn: boolean;
}) {
  return (
    <div className="min-w-0 space-y-4">
      {analysis.avisos.length > 0 && (
        <div role="status" className="rounded-xl border border-accent bg-accent/20 p-4 text-sm">
          <p className="mb-1 flex items-center gap-2 font-semibold">
            <Icon name="info" size={18} /> Avisos sobre a planilha
          </p>
          <ul className="list-disc pl-5">
            {analysis.avisos.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      )}
      <KpiCards analysis={analysis} />
      <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        <ClassFrequencyChart analysis={analysis} />
        <GradesTable analysis={analysis} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        <RiskList analysis={analysis} />
        <LateList analysis={analysis} hasColumn={hasLateColumn} />
      </div>
      <p className="text-sm text-fg-muted">
        Como calculamos: frequência = 1 − faltas ÷ dias letivos. Faltas seguidas dependem do
        registro diário e não aparecem em uma planilha com uma linha por aluno.
      </p>
    </div>
  );
}

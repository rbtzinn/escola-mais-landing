'use client';

import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { Icon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useToast } from '@/components/ui/Toast';
import { type Comparison, studentKey } from '@/lib/spreadsheet/compare';
import { downloadText, riskToCsv } from '@/lib/spreadsheet/exportCsv';
import { formatNumber } from '@/lib/spreadsheet/numbers';
import type { Analysis, Student } from '@/lib/spreadsheet/types';
import { normalizeText } from '@/lib/text';
import { DeltaTag } from './levels';

export type StudentFilter = 'risco' | 'atrasos' | 'todos';

const LIMIT = 30;

/** Busca por nome e filtros rápidos. Cada aluno abre a ficha com a mensagem para a família. */
export function StudentsTab({
  analysis,
  comparison,
  filter,
  onFilter,
  onOpen,
  hasLateColumn,
}: {
  analysis: Analysis;
  comparison: Comparison | null;
  filter: StudentFilter;
  onFilter: (f: StudentFilter) => void;
  onOpen: (s: Student) => void;
  hasLateColumn: boolean;
}) {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [all, setAll] = useState(false);

  const motivos = useMemo(
    () => new Map(analysis.risco.map((r) => [r.student, r.motivos])),
    [analysis.risco],
  );

  const filters: { id: StudentFilter; label: string; count: number }[] = [
    { id: 'risco', label: 'Em risco', count: analysis.risco.length },
    ...(hasLateColumn
      ? [{ id: 'atrasos' as const, label: 'Atrasos', count: analysis.atrasos.length }]
      : []),
    { id: 'todos', label: 'Todos', count: analysis.students.length },
  ];

  const base =
    filter === 'risco'
      ? analysis.risco.map((r) => r.student)
      : filter === 'atrasos'
        ? analysis.atrasos
        : [...analysis.students].sort((a, b) => a.aluno.localeCompare(b.aluno, 'pt-BR'));
  const q = normalizeText(query);
  const list = q ? base.filter((s) => normalizeText(s.aluno).includes(q)) : base;
  const shown = all ? list : list.slice(0, LIMIT);

  const download = () => {
    downloadText('alunos-em-risco.csv', riskToCsv(analysis));
    toast.show({
      title: 'Lista baixada',
      description: 'Arquivo alunos-em-risco.csv, aberto direto no Excel.',
    });
  };

  const detail = (s: Student) => {
    if (filter === 'atrasos') return `${s.atrasos} atrasos`;
    const m = motivos.get(s);
    if (m) return m[0];
    return [
      s.frequencia !== null && `Freq. ${formatNumber(s.frequencia, 0)}%`,
      s.media !== null && `Média ${formatNumber(s.media)}`,
    ]
      .filter(Boolean)
      .join(' · ');
  };

  return (
    <section aria-labelledby="alunos-titulo" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="alunos-titulo" className="font-display text-lg font-semibold">
          Alunos
        </h3>
        {analysis.risco.length > 0 && (
          <Button variant="secondary" onClick={download} className="!min-h-10 !px-4 text-sm">
            <Icon name="file" size={18} />
            Baixar risco em CSV
          </Button>
        )}
      </div>

      <TextField
        id="busca-aluno"
        label="Buscar aluno pelo nome"
        type="search"
        value={query}
        onChange={setQuery}
        autoComplete="off"
      />

      <div role="group" aria-label="Filtrar alunos" className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => {
              onFilter(f.id);
              setAll(false);
            }}
            className={clsx(
              'inline-flex min-h-10 items-center rounded-md border px-4 text-sm font-semibold transition-colors',
              filter === f.id
                ? 'border-primary bg-primary text-on-primary'
                : 'border-border bg-surface hover:border-primary',
            )}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="text-fg-muted">
          {q
            ? 'Nenhum aluno com esse nome nesta lista.'
            : filter === 'risco'
              ? 'Nenhum aluno abaixo dos mínimos de frequência e de média.'
              : `Ninguém com ${analysis.options.atrasosMin} atrasos ou mais.`}
        </p>
      ) : (
        <ul aria-label="Lista de alunos" className="space-y-2">
          {shown.map((s) => {
            const d = comparison?.alunos[studentKey(s.aluno, s.turma)];
            return (
              <li key={`${s.turma}-${s.aluno}`}>
                <button
                  type="button"
                  onClick={() => onOpen(s)}
                  className="flex w-full min-w-0 items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5 text-left hover:border-primary"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2">
                      <span className="font-semibold">{s.aluno}</span>
                      <span className="text-sm text-fg-muted">{s.turma}</span>
                      {d && (
                        <DeltaTag value={d.frequencia} higherIsBetter unit=" p.p." decimals={0} />
                      )}
                    </span>
                    <span
                      className={clsx(
                        'block truncate text-sm',
                        filter === 'todos' ? 'text-fg-muted' : 'text-danger',
                      )}
                    >
                      {detail(s)}
                    </span>
                  </span>
                  <Icon name="arrow" size={18} className="shrink-0 text-fg-muted" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {list.length > LIMIT && (
        <Button variant="ghost" onClick={() => setAll(!all)}>
          {all ? 'Mostrar menos' : `Mostrar todos (${list.length})`}
        </Button>
      )}
    </section>
  );
}

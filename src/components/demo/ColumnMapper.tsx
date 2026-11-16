'use client';

import clsx from 'clsx';
import { Icon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Listbox, type Option } from '@/components/ui/Listbox';
import type { Mapping, RawTable } from '@/lib/spreadsheet/types';

const NONE = 'none';

interface Props {
  table: RawTable;
  mapping: Mapping;
  onChange: (m: Mapping) => void;
  onSubmit: () => void;
  onBack: () => void;
}

type Single = 'aluno' | 'turma' | 'faltas' | 'atrasos' | 'telefone' | 'matricula';

/** Passo 2: indicar qual coluna é aluno, turma, faltas, atrasos e quais são notas. */
export function ColumnMapper({ table, mapping, onChange, onSubmit, onBack }: Props) {
  const columns: Option[] = table.headers.map((h, i) => ({ value: String(i), label: h }));
  const optional: Option[] = [{ value: NONE, label: 'Não tenho esta coluna' }, ...columns];

  const field = (key: Single, label: string, required: boolean) => {
    const current = mapping[key];
    return (
      <Listbox
        id={`map-${key}`}
        name={`map-${key}`}
        label={required ? `${label} (obrigatório)` : label}
        options={required ? columns : optional}
        value={current === null ? (required ? '' : NONE) : String(current)}
        onChange={(v) => onChange({ ...mapping, [key]: v === NONE ? null : Number(v) })}
      />
    );
  };

  const taken = new Set([
    mapping.aluno,
    mapping.turma,
    mapping.faltas,
    mapping.atrasos,
    mapping.telefone,
    mapping.matricula,
  ]);
  const gradeColumns = columns.filter((c) => !taken.has(Number(c.value)));
  const ready = mapping.aluno !== null && mapping.turma !== null;

  const toggle = (i: number) =>
    onChange({
      ...mapping,
      disciplinas: mapping.disciplinas.includes(i)
        ? mapping.disciplinas.filter((d) => d !== i)
        : [...mapping.disciplinas, i].sort((a, b) => a - b),
    });

  return (
    <div>
      <p className="text-fg-muted">
        Conferimos os nomes das colunas e sugerimos o mapeamento abaixo. Ajuste se algo estiver
        errado.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {field('aluno', 'Coluna do aluno', true)}
        {field('turma', 'Coluna da turma', true)}
        {field('faltas', 'Coluna de faltas', false)}
        {field('atrasos', 'Coluna de atrasos', false)}
        {field('telefone', 'Telefone do responsável (para o WhatsApp)', false)}
        {field('matricula', 'Matrícula (para o registro de atrasos)', false)}
      </div>

      <fieldset className="mt-7">
        <legend className="mb-1 text-sm font-semibold">
          Colunas de notas (uma por disciplina)
        </legend>
        <p className="mb-3 text-sm text-fg-muted">Notas de 0 a 10. Marque todas as disciplinas.</p>
        <div className="flex flex-wrap gap-2">
          {gradeColumns.length === 0 && (
            <p className="text-sm text-fg-muted">Não há outras colunas na planilha.</p>
          )}
          {gradeColumns.map((c) => {
            const on = mapping.disciplinas.includes(Number(c.value));
            return (
              <button
                key={c.value}
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => toggle(Number(c.value))}
                className={clsx(
                  'inline-flex min-h-11 items-center gap-2 rounded-md border px-4 text-sm font-semibold transition-colors',
                  on
                    ? 'border-primary bg-primary text-on-primary'
                    : 'border-border bg-surface hover:border-primary',
                )}
              >
                {on && <Icon name="check" size={16} />}
                {c.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-8">
        <h3 className="mb-2 font-display text-lg font-semibold">Prévia da planilha</h3>
        <div
          role="region"
          aria-label="Prévia das primeiras linhas da planilha"
          tabIndex={0}
          className="overflow-x-auto rounded-xl border border-border"
        >
          <table className="w-full min-w-max text-left text-sm">
            <thead className="bg-muted">
              <tr>
                {table.headers.map((h, i) => (
                  <th key={i} scope="col" className="px-3 py-2 font-semibold whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.slice(0, 5).map((r, i) => (
                <tr key={i} className="border-t border-border">
                  {r.map((c, j) => (
                    <td key={j} className="px-3 py-2 whitespace-nowrap text-fg-muted">
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-sm text-fg-muted">
          {table.rows.length.toLocaleString('pt-BR')} linha(s) de dados.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button onClick={onSubmit} disabled={!ready}>
          Gerar painel
          <Icon name="arrow" size={20} />
        </Button>
        <Button variant="secondary" onClick={onBack}>
          Trocar planilha
        </Button>
      </div>
      {!ready && (
        <p className="mt-3 text-sm text-fg-muted">
          Escolha as colunas de aluno e de turma para continuar.
        </p>
      )}
    </div>
  );
}

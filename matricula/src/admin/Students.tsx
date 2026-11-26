import { useMemo, useState } from 'react';
import { Icon } from '@/components/icons';
import { Listbox } from '@/components/ui/Listbox';
import { TextField } from '@/components/ui/TextField';
import { hideCpf } from '@/lib/cpf';
import { courseKey, filterRecords, STATUS, toCsv, type Rec } from '@/lib/adminData';
import { Button, StatusBadge } from './ui';

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function Students({
  recs,
  header,
  onOpen,
  onDiploma,
}: {
  recs: Rec[];
  header: string[];
  onOpen: (r: Rec) => void;
  /** Baixa o diploma (ou abre a ficha, se faltar algo). */
  onDiploma?: (r: Rec) => Promise<void>;
}) {
  const [gerando, setGerando] = useState('');
  const [busca, setBusca] = useState('');
  const [curso, setCurso] = useState('');
  const [status, setStatus] = useState('');
  const cursos = useMemo(() => [...new Set(recs.map(courseKey))].sort(), [recs]);
  const list = filterRecords(recs, { busca, curso, status });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_minmax(0,1fr)]">
        <TextField
          id="busca"
          label="Buscar"
          value={busca}
          onChange={setBusca}
          placeholder="Nome, CPF ou protocolo"
          type="search"
        />
        <Listbox
          id="filtro-curso"
          name="filtro-curso"
          label="Curso"
          value={curso}
          onChange={setCurso}
          options={[
            { value: '', label: 'Todos os cursos' },
            ...cursos.map((c) => ({ value: c, label: c })),
          ]}
        />
        <Listbox
          id="filtro-status"
          name="filtro-status"
          label="Status"
          value={status}
          onChange={setStatus}
          options={[{ value: '', label: 'Todos' }, ...STATUS.map((s) => ({ value: s, label: s }))]}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold" role="status">
          {list.length} de {recs.length} matrícula{recs.length === 1 ? '' : 's'}
        </p>
        <Button
          variant="ghost"
          icon="download"
          disabled={list.length === 0}
          onClick={() =>
            download(
              'matriculas.csv',
              toCsv(
                header,
                list.map((r) => r.row),
              ),
            )
          }
        >
          Baixar planilha (CSV)
        </Button>
      </div>

      {list.length === 0 ? (
        <p className="rounded-2xl border-2 border-dashed border-fg/20 p-6 text-center text-fg-muted">
          Nenhuma matrícula com esses filtros.
        </p>
      ) : (
        <ul className="overflow-hidden rounded-2xl border-2 border-fg/15 bg-surface">
          <li
            aria-hidden="true"
            className="hidden grid-cols-[minmax(0,2.2fr)_minmax(0,1.6fr)_8rem_7rem_9rem] gap-3 border-b-2 border-fg/10 px-4 py-2 text-xs lg:pr-[4.5rem] font-bold text-fg-muted uppercase lg:grid"
          >
            <span>Aluno</span>
            <span>Curso</span>
            <span>CPF</span>
            <span>Status</span>
            <span>Enviado em</span>
          </li>
          {list.map((r) => (
            <li key={r.protocolo} className="flex items-stretch border-b border-fg/10 last:border-0">
              <button
                type="button"
                onClick={() => onOpen(r)}
                className="grid min-w-0 flex-1 gap-1 px-4 py-3 text-left hover:bg-muted lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.6fr)_8rem_7rem_9rem] lg:items-center lg:gap-3"
              >
                <span className="flex min-w-0 items-center justify-between gap-2">
                  <span className="truncate font-semibold">{r.nome || '(sem nome)'}</span>
                  <span className="lg:hidden">
                    <StatusBadge status={r.status} />
                  </span>
                </span>
                <span className="truncate text-sm text-fg-muted lg:text-base lg:text-fg">
                  {courseKey(r)}
                </span>
                <span className="font-mono text-sm text-fg-muted">{hideCpf(r.cpf)}</span>
                <span className="hidden lg:block">
                  <StatusBadge status={r.status} />
                </span>
                <span className="flex items-center justify-between text-sm text-fg-muted">
                  {r.enviadoEm}
                  <Icon name="arrow" size={16} className="lg:hidden" />
                </span>
              </button>
              {onDiploma && r.status !== 'Cancelado' && (
                <button
                  type="button"
                  aria-label={`Diploma de ${r.nome || r.protocolo}`}
                  title="Baixar diploma"
                  disabled={gerando === r.protocolo}
                  onClick={async () => {
                    setGerando(r.protocolo);
                    await onDiploma(r);
                    setGerando('');
                  }}
                  className="flex min-h-11 w-14 shrink-0 flex-col items-center justify-center gap-0.5 border-l border-fg/10 text-xs font-semibold text-primary hover:bg-muted disabled:opacity-60"
                >
                  <Icon
                    name={gerando === r.protocolo ? 'refresh' : 'school'}
                    size={18}
                    className={gerando === r.protocolo ? 'motion-safe:animate-spin' : undefined}
                  />
                  Diploma
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

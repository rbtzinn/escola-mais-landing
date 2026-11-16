'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Icon, type IconName } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { pendingNotices } from '@/lib/attendance/records';
import type { LateRecord } from '@/lib/attendance/types';
import type { Comparison } from '@/lib/spreadsheet/compare';
import type { Action } from '@/lib/spreadsheet/insights';
import type { Analysis, Student } from '@/lib/spreadsheet/types';
import { ClassFrequencyChart } from './ClassFrequencyChart';
import { ClassGrid } from './ClassGrid';
import { ClassSheet } from './ClassSheet';
import { ComparePanel } from './ComparePanel';
import { GradesTable } from './GradesTable';
import { KpiCards } from './KpiCards';
import { shareSummary } from './shareImage';
import { StudentSheet } from './StudentSheet';
import { type StudentFilter, StudentsTab } from './StudentsTab';
import { TodayActions } from './TodayActions';
import { Verdict } from './Verdict';

type Tab = 'resumo' | 'turmas' | 'alunos';

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'resumo', label: 'Resumo', icon: 'home' },
  { id: 'turmas', label: 'Turmas', icon: 'grid' },
  { id: 'alunos', label: 'Alunos', icon: 'users' },
];

export interface CompareProps {
  previousName: string | null;
  loading: boolean;
  onFile: (file: File) => void;
  onSample?: () => void;
  onRemove: () => void;
}

interface Props {
  analysis: Analysis;
  comparison: Comparison | null;
  hasLateColumn: boolean;
  compareProps: CompareProps;
  /** Atrasos registrados hoje em /demo/dia. */
  records?: LateRecord[];
  /** Botões (Critérios, Registrar atrasos...) na mesma linha das abas, à direita. */
  actions?: React.ReactNode;
}

/** Painel em 3 abas. No celular, as abas ficam fixas embaixo, como em um app. */
export function Dashboard({
  analysis,
  comparison,
  hasLateColumn,
  compareProps,
  records = [],
  actions,
}: Props) {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('resumo');
  const [student, setStudent] = useState<Student | null>(null);
  const [turma, setTurma] = useState<string | null>(null);
  const [filter, setFilter] = useState<StudentFilter>('risco');
  const [sharing, setSharing] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({
    resumo: null,
    turmas: null,
    alunos: null,
  });

  // No celular, o aviso (toast) sobe para não cobrir a barra de abas.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--toast-bottom', '5.5rem');
    return () => {
      root.style.removeProperty('--toast-bottom');
    };
  }, []);

  const go = (t: Tab) => {
    setTab(t);
    const top = topRef.current;
    if (top && top.getBoundingClientRect().top < 0) top.scrollIntoView({ block: 'start' });
  };

  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const i = TABS.findIndex((t) => t.id === tab);
    const next =
      e.key === 'ArrowRight'
        ? (i + 1) % TABS.length
        : e.key === 'ArrowLeft'
          ? (i - 1 + TABS.length) % TABS.length
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? TABS.length - 1
              : -1;
    if (next < 0) return;
    e.preventDefault();
    go(TABS[next].id);
    tabRefs.current[TABS[next].id]?.focus();
  };

  const onAction = (a: Action) => {
    if (a.kind === 'aluno') setStudent(a.student);
    else if (a.kind === 'turma') setTurma(a.turma);
    else {
      setFilter('atrasos');
      go('alunos');
    }
  };

  const share = async () => {
    setSharing(true);
    try {
      const r = await shareSummary(analysis);
      if (r === 'downloaded')
        toast.show({
          title: 'Imagem baixada',
          description: 'resumo-escola.png, pronta para mandar no grupo. Sem nomes de alunos.',
        });
    } catch {
      toast.show({ title: 'Não foi possível gerar a imagem', description: 'Tente de novo.' });
    } finally {
      setSharing(false);
    }
  };

  return (
    <div ref={topRef} className="min-w-0 scroll-mt-20 pb-24 sm:pb-0">
      {/* Cabeçalho: no computador, abas sublinhadas + ações na mesma linha; no celular, as abas
          ficam fixas embaixo e aqui sobram só as ações. */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 sm:mb-6 sm:border-b sm:border-border">
        <div
          role="tablist"
          aria-label="Seções do painel"
          className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-border bg-surface/95 px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] backdrop-blur sm:static sm:flex sm:gap-1 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none"
        >
          {TABS.map((t) => {
            const on = tab === t.id;
            return (
              <button
                key={t.id}
                ref={(el) => {
                  tabRefs.current[t.id] = el;
                }}
                type="button"
                role="tab"
                id={`aba-${t.id}`}
                aria-selected={on}
                aria-controls={`painel-${t.id}`}
                tabIndex={on ? 0 : -1}
                onClick={() => go(t.id)}
                onKeyDown={onKey}
                className={clsx(
                  'group flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-semibold transition-colors',
                  'sm:-mb-px sm:min-h-12 sm:flex-row sm:gap-2 sm:border-b-2 sm:px-4 sm:text-[0.95rem]',
                  on
                    ? 'text-primary sm:border-primary'
                    : 'text-fg-muted hover:text-fg sm:border-transparent sm:hover:border-border',
                )}
              >
                <span
                  className={clsx(
                    'flex h-8 w-14 items-center justify-center rounded-full transition-colors sm:h-auto sm:w-auto',
                    on
                      ? 'bg-primary/15 sm:bg-transparent'
                      : 'group-hover:bg-muted sm:group-hover:bg-transparent',
                  )}
                >
                  <Icon name={t.icon} size={22} />
                </span>
                {t.label}
              </button>
            );
          })}
        </div>
        {actions && (
          <div className="-mx-3 flex w-[calc(100%+1.5rem)] [scrollbar-width:none] items-center gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:w-auto sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-2">
            {actions}
          </div>
        )}
      </div>

      {analysis.avisos.length > 0 && (
        <details className="mb-4 rounded-xl border border-accent bg-accent/20 p-3 text-sm">
          <summary className="flex cursor-pointer items-center gap-2 font-semibold">
            <Icon name="info" size={18} /> {analysis.avisos.length} aviso(s) sobre a planilha
          </summary>
          <ul className="mt-2 list-disc pl-5">
            {analysis.avisos.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </details>
      )}

      <div
        role="tabpanel"
        id={`painel-${tab}`}
        aria-labelledby={`aba-${tab}`}
        tabIndex={0}
        className="space-y-4 rounded-xl focus-visible:outline-offset-4"
      >
        {tab === 'resumo' && (
          <>
            <Verdict analysis={analysis} comparison={comparison} />
            {records.length > 0 && <TodayLate records={records} />}
            <KpiCards analysis={analysis} comparison={comparison} />
            <TodayActions analysis={analysis} onAction={onAction} />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={share} disabled={sharing} className="!min-h-11">
                <Icon name="share" size={20} />
                {sharing ? 'Gerando imagem…' : 'Compartilhar resumo'}
              </Button>
              <Button variant="secondary" onClick={() => go('turmas')} className="!min-h-11">
                Ver todas as turmas
              </Button>
            </div>
            <ComparePanel {...compareProps} emComum={comparison?.emComum ?? 0} />
          </>
        )}

        {tab === 'turmas' && (
          <>
            <ClassGrid analysis={analysis} comparison={comparison} onOpen={setTurma} />
            <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
              <ClassFrequencyChart analysis={analysis} />
              <GradesTable analysis={analysis} />
            </div>
          </>
        )}

        {tab === 'alunos' && (
          <StudentsTab
            analysis={analysis}
            comparison={comparison}
            filter={filter}
            onFilter={setFilter}
            onOpen={setStudent}
            hasLateColumn={hasLateColumn}
          />
        )}

        <p className="text-sm text-fg-muted">
          Como calculamos: frequência = 1 − faltas ÷ dias letivos. Faltas seguidas dependem do
          registro diário e não aparecem em uma planilha com uma linha por aluno.
        </p>
      </div>

      <ClassSheet
        analysis={analysis}
        comparison={comparison}
        turma={turma}
        onClose={() => setTurma(null)}
        onStudent={(s) => {
          setTurma(null);
          setStudent(s);
        }}
      />
      <StudentSheet
        analysis={analysis}
        comparison={comparison}
        student={student}
        onClose={() => setStudent(null)}
      />
    </div>
  );
}

/** Atrasos registrados hoje (aluno pelo QR, portaria, professor, coordenação) e avisos que faltam mandar. */
function TodayLate({ records }: { records: LateRecord[] }) {
  const pendentes = pendingNotices(records).length;
  return (
    <Link
      href="/demo/dia?canal=coordenacao"
      className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 transition-colors hover:border-primary"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon name="calendar" size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">
          Hoje: {records.length}{' '}
          {records.length === 1 ? 'atraso registrado' : 'atrasos registrados'}
        </span>
        <span className={clsx('block text-sm', pendentes ? 'text-danger' : 'text-fg-muted')}>
          {pendentes
            ? `${pendentes} ${pendentes === 1 ? 'aviso pendente' : 'avisos pendentes'} para as famílias`
            : 'Todos os avisos foram enviados ou dispensados'}
        </span>
      </span>
      <Icon name="arrow" size={18} className="shrink-0 text-fg-muted" />
    </Link>
  );
}

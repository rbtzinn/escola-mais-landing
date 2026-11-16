'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { type KeyboardEvent, useMemo, useRef, useState } from 'react';
import { Icon, type IconName } from '@/components/icons';
import { buttonClasses } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { nowFor } from '@/lib/attendance/clock';
import { buildRoster } from '@/lib/attendance/codes';
import { register, updateRecord } from '@/lib/attendance/records';
import { DEFAULT_CLOCK, type LateRecord, type RosterEntry } from '@/lib/attendance/types';
import type { Chamadas } from '@/lib/daily/attendance';
import type { Meals } from '@/lib/daily/meals';
import { sampleTimetable } from '@/lib/daily/timetable';
import { analyze } from '@/lib/spreadsheet/analyze';
import { guessMapping } from '@/lib/spreadsheet/columns';
import { rankClasses } from '@/lib/spreadsheet/insights';
import { sampleTable } from '@/lib/spreadsheet/sample';
import { DEFAULT_OPTIONS } from '@/lib/spreadsheet/types';
import { EntradaPanel, KitchenPanel, PainelPanel, RoutinePanel } from './DemoSamplePanels';

type TabId = 'painel' | 'entrada' | 'rotina' | 'cozinha';

const TABS: { id: TabId; icon: IconName; label: string; hint: string }[] = [
  { id: 'painel', icon: 'chart', label: 'Painel da planilha', hint: 'A planilha vira semáforo' },
  { id: 'entrada', icon: 'qr', label: 'QR da entrada', hint: 'O aluno registra o atraso' },
  { id: 'rotina', icon: 'calendar', label: 'Chamada e horário', hint: 'Faltou alguém? Remaneja' },
  { id: 'cozinha', icon: 'utensils', label: 'Merenda e avisos', hint: 'Cozinha e coordenação' },
];

const NO_RECORDS: LateRecord[] = [];
const NO_KEYS: string[] = [];
const NO_MEALS: Meals = {};

/**
 * Amostra da demo dentro da landing: as mesmas regras de /demo e /demo/dia (funções de `lib/`),
 * com a escola de exemplo e um estado próprio, só desta seção. Não mexe no estado da demo,
 * para a /demo continuar começando pelo envio da planilha.
 */
export function DemoSample() {
  const [tab, setTab] = useState<TabId>('painel');
  const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({
    painel: null,
    entrada: null,
    rotina: null,
    cozinha: null,
  });

  const analysis = useMemo(() => {
    const table = sampleTable('atual');
    return analyze(table, guessMapping(table), DEFAULT_OPTIONS);
  }, []);
  const roster = useMemo(() => buildRoster(analysis.students), [analysis]);
  // A turma mais crítica da escola é a usada na chamada, no horário e no celular do aluno.
  const turma = useMemo(() => rankClasses(analysis)[0].turma, [analysis]);
  const classRoster = useMemo(() => roster.filter((r) => r.turma === turma), [roster, turma]);
  // Três alunos da turma para o celular: os que mais se atrasam, como na vida real.
  const sampleStudents = useMemo<RosterEntry[]>(() => {
    const atrasos = new Map(roster.map((r, i) => [r.key, analysis.students[i].atrasos ?? 0]));
    return [...classRoster]
      .sort((a, b) => (atrasos.get(b.key) ?? 0) - (atrasos.get(a.key) ?? 0))
      .slice(0, 3);
  }, [roster, classRoster, analysis]);
  const grade = useMemo(() => sampleTimetable([...new Set(roster.map((r) => r.turma))]), [roster]);

  const [records, setRecords] = useState<LateRecord[]>(NO_RECORDS);
  const [ausentes, setAusentes] = useState<string[]>(NO_KEYS);
  const [meals, setMeals] = useState<Meals>(NO_MEALS);
  const [faltaram, setFaltaram] = useState<string[]>(NO_KEYS);
  // Muda a cada "Recomeçar": refaz os painéis e zera o que eles guardam (aluno escolhido etc.).
  const [round, setRound] = useState(0);

  const chamadas = useMemo<Chamadas>(
    () => ({ [turma]: { turma, ausentes, por: 'Professor(a)', em: '' } }),
    [turma, ausentes],
  );

  const registerLate = (entry: RosterEntry, channel: 'aluno' | 'portaria') => {
    const result = register(records, {
      entry,
      channel,
      registradoPor: channel,
      at: nowFor(DEFAULT_CLOCK, new Date()),
      settings: DEFAULT_CLOCK,
    });
    if (result.status === 'novo') setRecords(result.records);
    return result;
  };
  const toggle = (list: string[], key: string) =>
    list.includes(key) ? list.filter((k) => k !== key) : [...list, key];

  const touched =
    records.length > 0 ||
    ausentes.length > 0 ||
    faltaram.length > 0 ||
    Object.keys(meals).length > 0;
  const restart = () => {
    setRecords(NO_RECORDS);
    setAusentes(NO_KEYS);
    setMeals(NO_MEALS);
    setFaltaram(NO_KEYS);
    setRound((r) => r + 1);
  };

  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const i = TABS.findIndex((t) => t.id === tab);
    let next: number | null = null;
    if (e.key === 'ArrowRight') next = (i + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') next = (i - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = TABS.length - 1;
    if (next === null) return;
    e.preventDefault();
    setTab(TABS[next].id);
    tabRefs.current[TABS[next].id]?.focus();
  };

  return (
    <section
      id="amostra"
      aria-labelledby="amostra-titulo"
      className="border-t border-fg py-20 sm:py-28"
    >
      <Container>
        <Reveal>
          <SectionHeading
            id="amostra-titulo"
            index="04"
            eyebrow="Amostra"
            title="Mexa aqui mesmo: é a demo de verdade, em miniatura"
            description="Uma escola de exemplo já está carregada. O que você marca numa aba aparece nas outras, como acontece entre a portaria, a sala, a cozinha e a coordenação."
          />
        </Reveal>

        <Reveal delay={80} className="mt-12">
          <div className="border border-fg/60 bg-surface shadow-card">
            <div
              role="tablist"
              aria-label="Partes da demo"
              className="grid grid-cols-2 border-b border-fg/60 lg:grid-cols-4"
            >
              {TABS.map((t, i) => {
                const on = tab === t.id;
                return (
                  <button
                    key={t.id}
                    ref={(el) => {
                      tabRefs.current[t.id] = el;
                    }}
                    type="button"
                    role="tab"
                    id={`amostra-aba-${t.id}`}
                    aria-selected={on}
                    aria-controls="amostra-painel"
                    tabIndex={on ? 0 : -1}
                    onClick={() => setTab(t.id)}
                    onKeyDown={onKey}
                    className={clsx(
                      'relative flex min-h-16 items-start gap-3 border-border px-4 py-3.5 text-left transition-colors sm:px-5',
                      'max-lg:odd:border-r lg:border-r lg:last:border-r-0 max-lg:[&:nth-child(-n+2)]:border-b',
                      on ? 'bg-bg' : 'hover:bg-muted',
                    )}
                  >
                    {on && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-0 top-0 h-[3px] bg-primary"
                      />
                    )}
                    <span aria-hidden="true" className="eyebrow pt-0.5 text-fg-muted">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={clsx(
                          'flex items-center gap-2 leading-tight font-semibold',
                          on && 'text-primary',
                        )}
                      >
                        {t.label}
                      </span>
                      <span className="mt-0.5 block text-sm text-fg-muted max-sm:hidden">
                        {t.hint}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              key={round}
              role="tabpanel"
              id="amostra-painel"
              aria-labelledby={`amostra-aba-${tab}`}
              tabIndex={0}
              className="p-4 focus-visible:outline-offset-[-3px] sm:p-7"
            >
              {tab === 'painel' && <PainelPanel analysis={analysis} initialTurma={turma} />}
              {tab === 'entrada' && (
                <EntradaPanel
                  students={sampleStudents}
                  roster={roster}
                  records={records}
                  chamadas={chamadas}
                  meals={meals}
                  onRegister={(entry) => registerLate(entry, 'aluno')}
                  onMeal={(key, vai) => setMeals((m) => ({ ...m, [key]: vai }))}
                />
              )}
              {tab === 'rotina' && (
                <RoutinePanel
                  turma={turma}
                  students={classRoster}
                  ausentes={ausentes}
                  records={records}
                  onToggleAbsent={(key) => setAusentes((a) => toggle(a, key))}
                  grade={grade}
                  faltaram={faltaram}
                  onToggleTeacher={(p) => setFaltaram((f) => toggle(f, p))}
                />
              )}
              {tab === 'cozinha' && (
                <KitchenPanel
                  roster={roster}
                  chamadas={chamadas}
                  records={records}
                  meals={meals}
                  onSampleLate={() => registerLate(sampleStudents[0], 'portaria')}
                  onNotify={(id) => setRecords((r) => updateRecord(r, id, { aviso: 'enviado' }))}
                />
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-fg/60 bg-bg px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <p className="flex items-start gap-2 text-sm text-fg-muted">
                <Icon name="shield" size={18} className="mt-0.5 shrink-0 text-primary" />
                Escola e alunos de exemplo. Tudo fica nesta aba do navegador e some ao recarregar.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {touched && (
                  <button
                    type="button"
                    onClick={restart}
                    className={buttonClasses('ghost', undefined, 'sm')}
                  >
                    Recomeçar
                  </button>
                )}
                <Link href="/demo/dia" className={buttonClasses('secondary', undefined, 'sm')}>
                  Ver o dia a dia completo
                </Link>
                <Link href="/demo" className={buttonClasses('primary', undefined, 'sm')}>
                  Testar com a sua planilha
                  <Icon name="arrow" size={18} />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

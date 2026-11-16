'use client';

import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { Icon } from '@/components/icons';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import {
  AULAS,
  DIAS,
  type Slot,
  parseTimetable,
  planDay,
  sampleTimetable,
  teachersOf,
  weekdayFor,
} from '@/lib/daily/timetable';
import { demoStore } from '@/lib/demoStore';
import { readSpreadsheet } from '@/lib/spreadsheet/readFile';
import { RegistroShell } from './RegistroShell';
import { useRegistro } from './useRegistro';

const nomeCurto = (p: string) => p.replace(/ \(.+\)$/, '');

function SlotRow({ s }: { s: Slot }) {
  const { inicio, fim } = AULAS[s.aula - 1];
  return (
    <li
      className={clsx(
        'grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3 px-3 py-2 text-sm',
        s.tipo === 'vaga' && 'bg-danger/5',
        s.tipo === 'adiantada' && 'bg-primary/5',
      )}
    >
      <span className="text-fg-muted">
        <span className="block font-semibold text-fg">{s.aula}ª aula</span>
        {inicio}–{fim}
      </span>
      <span className="min-w-0">
        {s.tipo === 'sem-aula' && <span className="text-fg-muted">Sem aula</span>}
        {s.tipo === 'normal' && s.sugerida && (
          <>
            <span className="font-semibold">{s.sugerida.disciplina}</span>{' '}
            <span className="text-fg-muted">· {nomeCurto(s.sugerida.professor)}</span>
          </>
        )}
        {s.tipo === 'adiantada' && s.sugerida && (
          <>
            <span className="font-semibold">{s.sugerida.disciplina}</span>{' '}
            <span className="text-fg-muted">· {nomeCurto(s.sugerida.professor)}</span>{' '}
            <Badge className="!px-2 !py-0.5">adiantada da {s.de}ª aula</Badge>
          </>
        )}
        {s.tipo === 'vaga' && (
          <>
            <span className="font-semibold text-danger">Aula vaga</span>
            {s.livres && s.livres.length > 0 ? (
              <span className="block text-fg-muted">
                Livres para cobrir: {s.livres.map(nomeCurto).join(', ')}
              </span>
            ) : (
              <span className="block text-fg-muted">Ninguém livre neste horário.</span>
            )}
          </>
        )}
        {s.original && s.tipo !== 'normal' && s.original.professor !== s.sugerida?.professor && (
          <span className="block text-xs text-fg-muted line-through">
            Previsto: {s.original.disciplina} · {nomeCurto(s.original.professor)}
          </span>
        )}
      </span>
    </li>
  );
}

/** Horário do dia: marca quem faltou e a ferramenta adianta aulas e mostra quem pode cobrir. */
export function HorarioView() {
  const toast = useToast();
  const { timetable, faltaram, turmas, now, school } = useRegistro();
  const [dia, setDia] = useState(() => weekdayFor(now()));
  const [todas, setTodas] = useState(false);
  const [lendo, setLendo] = useState(false);

  const aulas = useMemo(() => timetable?.aulas ?? [], [timetable]);
  const professoresDoDia = useMemo(
    () => teachersOf(aulas.filter((a) => a.dia === dia)),
    [aulas, dia],
  );
  const plano = useMemo(() => planDay(aulas, dia, faltaram), [aulas, dia, faltaram]);
  const afetadas = plano.filter((p) => p.afetada);
  const mostradas = todas ? plano : afetadas;

  const onFile = async (file: File) => {
    setLendo(true);
    try {
      const { aulas: novas, avisos } = parseTimetable(await readSpreadsheet(file));
      if (!novas.length) throw new Error(avisos[0] ?? 'Nenhuma aula encontrada na planilha.');
      demoStore.setTimetable({ aulas: novas, nome: file.name });
      toast.show({
        title: 'Grade carregada',
        description: [`${novas.length} aulas de ${file.name}.`, ...avisos].join(' '),
      });
    } catch (e) {
      toast.show({
        title: 'Não foi possível ler a grade',
        description: e instanceof Error ? e.message : 'Confira a planilha.',
      });
    } finally {
      setLendo(false);
    }
  };

  const upload = (
    <>
      <input
        id="grade-arquivo"
        type="file"
        accept=".csv,.xlsx"
        className="peer sr-only"
        disabled={lendo}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) onFile(f);
        }}
      />
      <label
        htmlFor="grade-arquivo"
        className={clsx(
          'peer-focus-visible:outline-ring inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-semibold peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 hover:border-primary hover:text-primary',
          lendo && 'pointer-events-none opacity-60',
        )}
      >
        <Icon name="sheet" size={18} />
        {lendo ? 'Lendo…' : 'Enviar planilha de horário'}
      </label>
    </>
  );

  return (
    <RegistroShell
      title="Horário do dia"
      subtitle="Marque quem faltou: as aulas seguintes são adiantadas para não deixar buraco, e as vagas mostram quem está livre."
    >
      {!timetable ? (
        <section className="space-y-3 rounded-3xl border border-border bg-surface p-4 sm:p-6">
          <h2 className="font-display text-lg font-bold">Falta a grade de horário</h2>
          <p className="text-fg-muted">
            Envie uma planilha com as colunas <strong className="text-fg">Turma</strong>,{' '}
            <strong className="text-fg">Dia</strong> (segunda a sexta ou 1 a 5),{' '}
            <strong className="text-fg">Aula</strong> (1 a 5),{' '}
            <strong className="text-fg">Professor</strong> e{' '}
            <strong className="text-fg">Disciplina</strong>, uma linha por aula. Ou gere uma grade
            de exemplo para as turmas da sua planilha.
          </p>
          <div className="flex flex-wrap gap-2">
            {upload}
            {school && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  demoStore.setTimetable({
                    aulas: sampleTimetable(turmas),
                    nome: 'Grade de exemplo',
                  })
                }
              >
                Gerar grade de exemplo
              </Button>
            )}
          </div>
        </section>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-start">
          <section
            aria-labelledby="horario-faltas"
            className="space-y-4 rounded-3xl border border-border bg-surface p-4 shadow-card sm:p-6"
          >
            <div role="group" aria-label="Dia da semana" className="flex flex-wrap gap-1.5">
              {DIAS.map((d, i) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={dia === i + 1}
                  onClick={() => setDia(i + 1)}
                  className={clsx(
                    'min-h-10 rounded-full border px-3 text-sm font-semibold transition-colors',
                    dia === i + 1
                      ? 'border-primary bg-primary text-on-primary'
                      : 'border-border bg-surface hover:border-primary',
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
            <div>
              <h2 id="horario-faltas" className="font-display text-lg font-bold">
                Quem faltou hoje?
              </h2>
              <p className="text-sm text-fg-muted">Toque no nome de quem não veio.</p>
            </div>
            <ul aria-label="Professores do dia" className="flex flex-wrap gap-1.5">
              {professoresDoDia.map((p) => {
                const on = faltaram.includes(p);
                return (
                  <li key={p}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => demoStore.toggleFaltou(p)}
                      className={clsx(
                        'min-h-10 rounded-full border px-3 text-sm font-semibold transition-colors',
                        on
                          ? 'border-danger bg-danger/10 text-danger'
                          : 'border-border bg-surface hover:border-primary',
                      )}
                    >
                      {on && <span className="sr-only">Faltou: </span>}
                      {p}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4 text-sm text-fg-muted">
              <span>Grade: {timetable.nome}</span>
              {upload}
            </div>
          </section>

          <section aria-labelledby="horario-plano" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="horario-plano" className="font-display text-lg font-bold">
                {faltaram.length === 0
                  ? `${DIAS[dia - 1]}: horário normal`
                  : `${DIAS[dia - 1]}: ${afetadas.length} ${afetadas.length === 1 ? 'turma afetada' : 'turmas afetadas'}`}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setTodas(!todas)}>
                {todas ? 'Só as afetadas' : 'Ver todas as turmas'}
              </Button>
            </div>
            {mostradas.length === 0 && (
              <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-fg-muted">
                Nenhum professor marcado como ausente. Marque ao lado quem faltou para ver o horário
                remanejado.
              </p>
            )}
            <ul className="grid gap-3 xl:grid-cols-2">
              {mostradas.map((p) => (
                <li
                  key={p.turma}
                  className="overflow-hidden rounded-2xl border border-border bg-surface"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
                    <h3 className="font-display font-bold">{p.turma}</h3>
                    {p.saiAs && (
                      <span className="text-sm font-semibold text-primary">
                        Pode sair às {p.saiAs}
                      </span>
                    )}
                  </div>
                  <ol aria-label={`Horário da turma ${p.turma}`} className="divide-y divide-border">
                    {p.slots.map((s) => (
                      <SlotRow key={s.aula} s={s} />
                    ))}
                  </ol>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </RegistroShell>
  );
}

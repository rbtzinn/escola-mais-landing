'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Listbox } from '@/components/ui/Listbox';
import { formatHora } from '@/lib/attendance/clock';
import { CHANNEL_LABEL, type LateRecord, type RosterEntry } from '@/lib/attendance/types';
import { demoStore } from '@/lib/demoStore';
import { type Feedback, FeedbackBox, OperatorField, describe } from './shared';

/** Professor do 1º horário: marca quem entrou atrasado na sala, na lista da turma. */
export function ProfessorView({
  roster,
  records,
  now,
}: {
  roster: RosterEntry[];
  records: LateRecord[];
  now: () => Date;
}) {
  const turmas = [...new Set(roster.map((r) => r.turma))].sort((a, b) =>
    a.localeCompare(b, 'pt-BR', { numeric: true }),
  );
  const [turma, setTurma] = useState(turmas[0] ?? '');
  const [operator, setOperator] = useState('Professor(a)');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const registered = new Map(records.map((r) => [r.key, r]));
  const alunos = roster
    .filter((r) => r.turma === turma)
    .sort((a, b) => a.aluno.localeCompare(b.aluno, 'pt-BR'));

  return (
    <section aria-labelledby="professor-titulo" className="space-y-4">
      <h2 id="professor-titulo" className="font-display text-xl font-bold">
        Professor(a) na chamada
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <OperatorField
          id="professor-nome"
          label="Seu nome"
          value={operator}
          onChange={setOperator}
        />
        <Listbox
          id="professor-turma"
          name="professor-turma"
          label="Turma"
          options={turmas.map((t) => ({ value: t, label: t }))}
          value={turma}
          onChange={setTurma}
        />
      </div>
      <FeedbackBox feedback={feedback} />
      <ul aria-label={`Alunos da turma ${turma}`} className="space-y-1.5">
        {alunos.map((a) => {
          const reg = registered.get(a.key);
          return (
            <li
              key={a.code}
              className="flex min-h-12 items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 py-1.5"
            >
              <span className="min-w-0 truncate font-semibold">{a.aluno}</span>
              {reg ? (
                <span className="shrink-0 text-right text-xs font-semibold text-fg-muted">
                  Atrasado · {formatHora(new Date(reg.at))}
                  <br />
                  por {CHANNEL_LABEL[reg.channel]}
                </span>
              ) : (
                <Button
                  variant="secondary"
                  className="!min-h-9 shrink-0 !px-3 text-sm"
                  aria-label={`Marcar atraso de ${a.aluno}`}
                  onClick={() => {
                    const result = demoStore.register({
                      entry: a,
                      channel: 'professor',
                      registradoPor: operator,
                      at: now(),
                    });
                    setFeedback(describe(result, a.aluno));
                  }}
                >
                  Atrasado
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

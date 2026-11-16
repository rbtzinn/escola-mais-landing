'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Listbox } from '@/components/ui/Listbox';
import { formatHora } from '@/lib/attendance/clock';
import { UNDO_MINUTES, undoSecondsLeft } from '@/lib/attendance/records';
import { CHANNEL_LABEL } from '@/lib/attendance/types';
import { demoStore } from '@/lib/demoStore';
import { RegistroShell } from './RegistroShell';
import { type Feedback, FeedbackBox, OperatorField, describe } from './shared';
import { useRegistro } from './useRegistro';

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/** Professor(a) do 1º horário: marca quem entrou atrasado e pode desfazer por 5 minutos. */
export function ProfessorView() {
  const { roster, records, turmas, now } = useRegistro();
  const [turma, setTurma] = useState('');
  const [operator, setOperator] = useState('Professor(a)');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  // Relógio real (não o simulado) para a contagem do "desfazer".
  const [agora, setAgora] = useState(() => new Date());

  const turmaAtual = turma || turmas[0] || '';
  const registered = new Map(records.map((r) => [r.key, r]));
  const meus = records.filter(
    (r) => r.channel === 'professor' && undoSecondsLeft(r, agora) > 0,
  ).length;

  // Só faz tique-taque enquanto houver algo que ainda dá para desfazer.
  useEffect(() => {
    if (meus === 0) return;
    const t = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(t);
  }, [meus]);

  const alunos = roster
    .filter((r) => r.turma === turmaAtual)
    .sort((a, b) => a.aluno.localeCompare(b.aluno, 'pt-BR'));

  return (
    <RegistroShell
      title="Professor(a)"
      subtitle={`Marque quem entrou atrasado. Errou? Dá para desfazer por ${UNDO_MINUTES} minutos.`}
    >
      <section
        aria-labelledby="professor-titulo"
        className="space-y-4 rounded-3xl border border-border bg-surface p-4 shadow-card sm:p-6"
      >
        <h2 id="professor-titulo" className="sr-only">
          Chamada
        </h2>
        <div className="grid max-w-2xl gap-3 sm:grid-cols-2">
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
            value={turmaAtual}
            onChange={setTurma}
          />
        </div>
        <FeedbackBox feedback={feedback} />
        <ul aria-label={`Alunos da turma ${turmaAtual}`} className="grid gap-2 lg:grid-cols-2">
          {alunos.map((a) => {
            const reg = registered.get(a.key);
            const left = reg && reg.channel === 'professor' ? undoSecondsLeft(reg, agora) : 0;
            return (
              <li
                key={a.key}
                className="flex min-h-14 items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 py-2"
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{a.aluno}</span>
                  {reg && (
                    <span className="block text-xs text-fg-muted">
                      Atrasado · {formatHora(new Date(reg.at))} · por {CHANNEL_LABEL[reg.channel]}
                      {reg.channel === 'professor' &&
                        left === 0 &&
                        ' · para corrigir, fale com a coordenação'}
                    </span>
                  )}
                </span>
                {!reg ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="shrink-0"
                    aria-label={`Marcar atraso de ${a.aluno}`}
                    onClick={() => {
                      const result = demoStore.register({
                        entry: a,
                        channel: 'professor',
                        registradoPor: operator,
                        at: now(),
                      });
                      setAgora(new Date());
                      setFeedback(describe(result, a.aluno));
                    }}
                  >
                    Atrasado
                  </Button>
                ) : left > 0 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-danger"
                    aria-label={`Desfazer atraso de ${a.aluno} (${mmss(left)})`}
                    onClick={() => {
                      demoStore.remove(reg.id);
                      setFeedback({
                        tone: 'info',
                        title: `Atraso de ${a.aluno} desfeito`,
                        detail: 'O aviso também saiu da fila da coordenação.',
                      });
                    }}
                  >
                    Desfazer · {mmss(left)}
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>
    </RegistroShell>
  );
}

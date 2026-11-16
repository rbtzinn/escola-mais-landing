'use client';

import { useState } from 'react';
import { Icon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { formatHora } from '@/lib/attendance/clock';
import { CHANNEL_LABEL, type Motivo, type RosterEntry } from '@/lib/attendance/types';
import { demoStore } from '@/lib/demoStore';
import { RegistroShell } from './RegistroShell';
import {
  type Feedback,
  FeedbackBox,
  MotivoChips,
  OperatorField,
  StudentSearch,
  describe,
} from './shared';
import { useRegistro } from './useRegistro';

/** Portaria: link aberto no celular do porteiro, para quem não conseguiu ler o QR da entrada. */
export function PortariaView() {
  const { roster, records, now } = useRegistro();
  const [operator, setOperator] = useState('Portaria');
  const [picked, setPicked] = useState<RosterEntry | null>(null);
  const [motivo, setMotivo] = useState<Motivo | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const save = () => {
    if (!picked) return;
    const result = demoStore.register({
      entry: picked,
      channel: 'portaria',
      registradoPor: operator,
      at: now(),
      motivo,
    });
    setFeedback(describe(result, picked.aluno));
    setPicked(null);
    setMotivo(null);
  };

  const hoje = [...records].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <RegistroShell
      title="Portaria"
      subtitle="Para o aluno sem celular ou sem internet: digite o nome e registre a chegada."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
        <section
          aria-labelledby="portaria-titulo"
          className="space-y-4 rounded-3xl border border-border bg-surface p-4 shadow-card sm:p-6"
        >
          <h2 id="portaria-titulo" className="font-display text-xl font-semibold">
            Registrar chegada
          </h2>
          <div className="max-w-sm">
            <OperatorField
              id="portaria-nome"
              label="Quem está na portaria"
              value={operator}
              onChange={setOperator}
            />
          </div>
          <FeedbackBox feedback={feedback} />
          {picked ? (
            <div className="space-y-3 rounded-2xl border-2 border-primary/50 bg-primary/5 p-4">
              <div>
                <p className="font-display text-xl font-semibold">{picked.aluno}</p>
                <p className="text-sm text-fg-muted">
                  {picked.turma} · chegada às {formatHora(now())}
                </p>
              </div>
              <MotivoChips value={motivo} onChange={setMotivo} />
              <div className="flex flex-wrap gap-2">
                <Button onClick={save}>
                  <Icon name="check" size={20} />
                  Registrar atraso
                </Button>
                <Button variant="ghost" onClick={() => setPicked(null)}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <StudentSearch
              id="portaria-busca"
              roster={roster}
              records={records}
              onPick={(r) => {
                setPicked(r);
                setFeedback(null);
              }}
            />
          )}
        </section>

        <section
          aria-labelledby="portaria-hoje"
          className="rounded-3xl border border-border bg-surface p-4 sm:p-6"
        >
          <h2 id="portaria-hoje" className="mb-3 font-display text-lg font-semibold">
            Chegadas atrasadas hoje ({records.length})
          </h2>
          {hoje.length === 0 ? (
            <p className="text-sm text-fg-muted">Ninguém registrado ainda.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {hoje.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{r.aluno}</span>
                    <span className="text-fg-muted">
                      {r.turma} · {CHANNEL_LABEL[r.channel]}
                    </span>
                  </span>
                  <span className="shrink-0 font-semibold">{formatHora(new Date(r.at))}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </RegistroShell>
  );
}

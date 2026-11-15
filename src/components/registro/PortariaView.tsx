'use client';

import clsx from 'clsx';
import { useState } from 'react';
import { Icon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { formatHora } from '@/lib/attendance/clock';
import { findByCode } from '@/lib/attendance/codes';
import {
  type LateRecord,
  MOTIVO_LABEL,
  type Motivo,
  type RosterEntry,
} from '@/lib/attendance/types';
import { demoStore } from '@/lib/demoStore';
import { ScanQr } from './ScanQr';
import {
  type Feedback,
  FeedbackBox,
  NOT_FOUND,
  OperatorField,
  StudentSearch,
  describe,
} from './shared';

export function MotivoChips({
  value,
  onChange,
  label = 'Motivo (opcional, não vai para a família)',
}: {
  value: Motivo | null;
  onChange: (m: Motivo | null) => void;
  label?: string;
}) {
  return (
    <div role="group" aria-label={label}>
      <p className="mb-1.5 text-sm font-semibold">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(MOTIVO_LABEL) as Motivo[]).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={value === m}
            onClick={() => onChange(value === m ? null : m)}
            className={clsx(
              'min-h-10 rounded-full border px-3 text-sm font-semibold transition-colors',
              value === m
                ? 'border-primary bg-primary text-on-primary'
                : 'border-border bg-surface hover:border-primary',
            )}
          >
            {MOTIVO_LABEL[m]}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Portaria: busca pelo nome (quem não tem carteirinha) ou lê o QR com o celular. */
export function PortariaView({
  roster,
  records,
  now,
}: {
  roster: RosterEntry[];
  records: LateRecord[];
  now: () => Date;
}) {
  const [operator, setOperator] = useState('Portaria');
  const [picked, setPicked] = useState<RosterEntry | null>(null);
  const [motivo, setMotivo] = useState<Motivo | null>(null);
  const [scan, setScan] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const save = (entry: RosterEntry, m: Motivo | null) => {
    const result = demoStore.register({
      entry,
      channel: 'portaria',
      registradoPor: operator,
      at: now(),
      motivo: m,
    });
    setFeedback(describe(result, entry.aluno));
    setPicked(null);
    setMotivo(null);
  };

  const mine = records.filter((r) => r.channel === 'portaria').slice(0, 5);

  return (
    <section aria-labelledby="portaria-titulo" className="space-y-4">
      <h2 id="portaria-titulo" className="font-display text-xl font-bold">
        Portaria
      </h2>
      <OperatorField
        id="portaria-nome"
        label="Quem está na portaria"
        value={operator}
        onChange={setOperator}
      />
      <FeedbackBox feedback={feedback} />

      {picked ? (
        <div className="space-y-3 rounded-2xl border-2 border-primary/50 bg-primary/5 p-4">
          <p className="font-display text-xl font-extrabold">{picked.aluno}</p>
          <p className="text-sm text-fg-muted">
            {picked.turma} · chegada às {formatHora(now())}
          </p>
          <MotivoChips value={motivo} onChange={setMotivo} />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => save(picked, motivo)}>
              <Icon name="check" size={20} />
              Registrar atraso
            </Button>
            <Button variant="ghost" onClick={() => setPicked(null)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <StudentSearch id="portaria-busca" roster={roster} records={records} onPick={setPicked} />
      )}

      {scan ? (
        <ScanQr
          id="portaria-codigo"
          autoStart
          onCode={(raw) => {
            const entry = findByCode(roster, raw);
            if (entry) save(entry, null);
            else setFeedback(NOT_FOUND);
          }}
        />
      ) : (
        <Button variant="secondary" onClick={() => setScan(true)} className="w-full">
          <Icon name="qr" size={20} />
          Ler carteirinha
        </Button>
      )}

      {mine.length > 0 && (
        <div>
          <h3 className="mb-1 text-sm font-semibold">Registrados pela portaria hoje</h3>
          <ul className="space-y-1 text-sm">
            {mine.map((r) => (
              <li key={r.id} className="flex justify-between gap-2">
                <span>
                  {r.aluno} <span className="text-fg-muted">{r.turma}</span>
                </span>
                <span className="text-fg-muted">{formatHora(new Date(r.at))}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

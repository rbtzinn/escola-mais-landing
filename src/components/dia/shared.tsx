'use client';

import clsx from 'clsx';
import { useState } from 'react';
import { TextField } from '@/components/ui/TextField';
import { formatHora } from '@/lib/attendance/clock';
import type { RegisterResult } from '@/lib/attendance/records';
import {
  CHANNEL_LABEL,
  type LateRecord,
  MOTIVO_LABEL,
  type Motivo,
  type RosterEntry,
} from '@/lib/attendance/types';
import { normalizeText } from '@/lib/text';

export type Feedback = { tone: 'ok' | 'info' | 'error'; title: string; detail?: string };

/** Texto do resultado de um registro, igual em todas as telas. */
export function describe(result: RegisterResult, aluno: string): Feedback {
  if (result.status === 'novo')
    return {
      tone: 'ok',
      title: `Atraso registrado: ${aluno}`,
      detail: `Chegou às ${formatHora(new Date(result.record.at))} (${result.record.minutos} min depois da entrada). O aviso foi para a fila da coordenação.`,
    };
  if (result.status === 'duplicado')
    return {
      tone: 'info',
      title: `${aluno} já foi registrado hoje`,
      detail: `Por ${CHANNEL_LABEL[result.record.channel]} (${result.record.registradoPor}) às ${formatHora(new Date(result.record.at))}.`,
    };
  return {
    tone: 'info',
    title: `${aluno} chegou no horário`,
    detail: 'Dentro da tolerância: não conta como atraso.',
  };
}

export const NOT_FOUND: Feedback = {
  tone: 'error',
  title: 'Matrícula não encontrada nesta turma',
  detail: 'Confira a turma e o número. Se não der certo, procure a portaria.',
};

export function FeedbackBox({
  feedback,
  large = false,
}: {
  feedback: Feedback | null;
  large?: boolean;
}) {
  return (
    <div role="status" aria-label="Resultado do registro" aria-live="polite" aria-atomic="true">
      {feedback && (
        <div
          className={clsx(
            'rounded-2xl border-2 p-4',
            feedback.tone === 'ok' && 'border-primary/50 bg-primary/10',
            feedback.tone === 'info' && 'border-accent bg-accent/20',
            feedback.tone === 'error' && 'border-danger/60 bg-danger/10',
          )}
        >
          <p className={clsx('font-display font-semibold', large ? 'text-3xl' : 'text-lg')}>
            {feedback.title}
          </p>
          {feedback.detail && (
            <p className={large ? 'mt-1 text-lg' : 'text-sm'}>{feedback.detail}</p>
          )}
        </div>
      )}
    </div>
  );
}

/** Campo "quem está registrando" (vira o "registrado por"). */
export function OperatorField({
  id,
  value,
  onChange,
  label,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return <TextField id={id} label={label} value={value} onChange={onChange} autoComplete="off" />;
}

/** Busca de aluno pelo nome (sem acento), mostrando quem já foi registrado hoje. */
export function StudentSearch({
  id,
  roster,
  records,
  onPick,
}: {
  id: string;
  roster: RosterEntry[];
  records: LateRecord[];
  onPick: (r: RosterEntry) => void;
}) {
  const [query, setQuery] = useState('');
  const q = normalizeText(query);
  const results =
    q.length < 2 ? [] : roster.filter((r) => normalizeText(r.aluno).includes(q)).slice(0, 8);
  const registered = new Map(records.map((r) => [r.key, r]));

  return (
    <div>
      <TextField
        id={id}
        label="Buscar aluno pelo nome"
        type="search"
        value={query}
        onChange={setQuery}
        autoComplete="off"
      />
      {q.length >= 2 && (
        <ul aria-label="Resultados da busca" className="mt-2 space-y-1.5">
          {results.length === 0 && (
            <li className="text-sm text-fg-muted">Nenhum aluno encontrado.</li>
          )}
          {results.map((r) => {
            const reg = registered.get(r.key);
            return (
              <li key={r.key}>
                <button
                  type="button"
                  onClick={() => {
                    onPick(r);
                    setQuery('');
                  }}
                  className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-left transition-colors hover:border-primary hover:bg-muted"
                >
                  <span>
                    <span className="font-semibold">{r.aluno}</span>{' '}
                    <span className="text-sm text-fg-muted">{r.turma}</span>
                  </span>
                  {reg && (
                    <span className="shrink-0 text-xs font-semibold text-fg-muted">
                      já registrado {formatHora(new Date(reg.at))}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Motivo do atraso (opcional). Nunca vai para a mensagem da família. */
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
      <p className="mb-1.5 text-sm font-semibold text-fg">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(MOTIVO_LABEL) as Motivo[]).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={value === m}
            onClick={() => onChange(value === m ? null : m)}
            className={clsx(
              'min-h-10 rounded-md border px-3 text-sm font-semibold transition-colors',
              value === m
                ? 'border-primary bg-primary text-on-primary'
                : 'border-border bg-surface text-fg hover:border-primary',
            )}
          >
            {MOTIVO_LABEL[m]}
          </button>
        ))}
      </div>
    </div>
  );
}

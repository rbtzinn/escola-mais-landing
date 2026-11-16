'use client';

import clsx from 'clsx';
import { useState } from 'react';
import { Icon } from '@/components/icons';
import { Button, buttonClasses } from '@/components/ui/Button';
import { formatHora } from '@/lib/attendance/clock';
import { lateMessage } from '@/lib/attendance/message';
import { pendingNotices } from '@/lib/attendance/records';
import {
  CHANNEL_LABEL,
  LIBERADO_LABEL,
  type LateRecord,
  type Liberado,
  type RosterEntry,
} from '@/lib/attendance/types';
import { demoStore } from '@/lib/demoStore';
import type { Analysis } from '@/lib/spreadsheet/types';
import { familyMessage, whatsappUrl } from '@/lib/spreadsheet/whatsapp';
import { MotivoChips } from './PortariaView';
import { type Feedback, FeedbackBox, OperatorField, StudentSearch, describe } from './shared';

const AVISO_LABEL: Record<LateRecord['aviso'], string> = {
  pendente: 'Aviso pendente',
  enviado: 'Aviso enviado',
  dispensado: 'Aviso dispensado',
};

interface Props {
  roster: RosterEntry[];
  records: LateRecord[];
  now: () => Date;
  /** Análise com os atrasos de hoje somados (para os reincidentes). */
  analysis: Analysis | null;
}

/** Coordenação: registra, edita o dia, envia os avisos (grátis, via wa.me) e vê reincidentes. */
export function CoordenacaoView({ roster, records, now, analysis }: Props) {
  const [operator, setOperator] = useState('Coordenação');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const phones = new Map(roster.map((r) => [r.key, r.telefone]));
  const fila = pendingNotices(records);
  const send = (r: LateRecord) => demoStore.update(r.id, { aviso: 'enviado' });
  const linkFor = (r: LateRecord) => whatsappUrl(phones.get(r.key) ?? null, lateMessage(r));

  const openNext = () => {
    const next = fila[0];
    if (!next) return;
    window.open(linkFor(next), '_blank', 'noopener,noreferrer');
    send(next);
  };

  return (
    <div className="space-y-6">
      <section aria-labelledby="coord-registrar" className="space-y-3">
        <h2 id="coord-registrar" className="font-display text-xl font-bold">
          Coordenação
        </h2>
        <OperatorField id="coord-nome" label="Seu nome" value={operator} onChange={setOperator} />
        <FeedbackBox feedback={feedback} />
        <StudentSearch
          id="coord-busca"
          roster={roster}
          records={records}
          onPick={(entry) =>
            setFeedback(
              describe(
                demoStore.register({
                  entry,
                  channel: 'coordenacao',
                  registradoPor: operator,
                  at: now(),
                }),
                entry.aluno,
              ),
            )
          }
        />
      </section>

      <section aria-labelledby="coord-fila" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 id="coord-fila" className="font-display text-lg font-bold">
            Fila de avisos ({fila.length})
          </h3>
          {fila.length > 0 && (
            <Button onClick={openNext} className="!min-h-10 !px-4 text-sm">
              <Icon name="message" size={18} />
              Enviar próximo
            </Button>
          )}
        </div>
        <p className="text-sm text-fg-muted">
          Grátis e dentro das regras do WhatsApp: cada aviso abre a conversa com o texto pronto (só
          nome, turma e horário) e você confere antes de enviar. Justificados não entram na fila.
        </p>
        {fila.length === 0 ? (
          <p className="text-sm">Nenhum aviso pendente.</p>
        ) : (
          <ul aria-label="Avisos pendentes" className="space-y-1.5">
            {fila.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 py-2"
              >
                <span className="min-w-0">
                  <span className="font-semibold">{r.aluno}</span>{' '}
                  <span className="text-sm text-fg-muted">
                    {r.turma} · {formatHora(new Date(r.at))}
                  </span>
                </span>
                <span className="flex gap-1.5">
                  <a
                    href={linkFor(r)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => send(r)}
                    aria-label={`Avisar a família de ${r.aluno} no WhatsApp`}
                    className={buttonClasses('primary', '!min-h-9 !px-3 text-sm')}
                  >
                    WhatsApp
                  </a>
                  <Button
                    variant="ghost"
                    onClick={() => demoStore.update(r.id, { aviso: 'dispensado' })}
                    aria-label={`Dispensar aviso de ${r.aluno}`}
                    className="!min-h-9 !px-3 text-sm"
                  >
                    Dispensar
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="coord-hoje" className="space-y-3">
        <h3 id="coord-hoje" className="font-display text-lg font-bold">
          Atrasos de hoje ({records.length})
        </h3>
        {records.length === 0 ? (
          <p className="text-sm text-fg-muted">
            Nenhum atraso registrado ainda. Use o totem, a portaria ou o professor.
          </p>
        ) : (
          <ul aria-label="Atrasos de hoje" className="space-y-2">
            {[...records]
              .sort((a, b) => a.at.localeCompare(b.at))
              .map((r) => (
                <RecordCard key={r.id} r={r} />
              ))}
          </ul>
        )}
      </section>

      {analysis && (
        <section aria-labelledby="coord-reincidentes" className="space-y-3">
          <h3 id="coord-reincidentes" className="font-display text-lg font-bold">
            Reincidentes ({analysis.atrasos.length})
          </h3>
          <p className="text-sm text-fg-muted">
            {analysis.options.atrasosMin} atrasos ou mais (total da planilha + registros de hoje,
            sem os justificados).
          </p>
          <ul className="space-y-1.5">
            {analysis.atrasos.slice(0, 10).map((s) => (
              <li
                key={`${s.turma}-${s.aluno}`}
                className="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 py-2"
              >
                <span className="min-w-0">
                  <span className="font-semibold">{s.aluno}</span>{' '}
                  <span className="text-sm text-fg-muted">{s.turma}</span>{' '}
                  <span className="text-sm font-bold text-danger">{s.atrasos} atrasos</span>
                </span>
                <a
                  href={whatsappUrl(s.telefone, familyMessage(s, analysis.options))}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Chamar a família de ${s.aluno} para conversar`}
                  className={buttonClasses('secondary', '!min-h-9 shrink-0 !px-3 text-sm')}
                >
                  Conversar
                </a>
              </li>
            ))}
          </ul>
          {analysis.atrasos.length > 10 && (
            <p className="text-sm text-fg-muted">
              Mostrando os 10 com mais atrasos. A lista completa está no painel, aba Alunos, filtro
              Atrasos.
            </p>
          )}
        </section>
      )}
    </div>
  );
}

/** Um atraso do dia, com motivo, justificativa e liberação editáveis. */
function RecordCard({ r }: { r: LateRecord }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="rounded-xl border border-border bg-surface p-3">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="min-w-0">
          <span className="font-semibold">{r.aluno}</span>{' '}
          <span className="text-sm text-fg-muted">{r.turma}</span>
          <span className="block text-sm text-fg-muted">
            {formatHora(new Date(r.at))} ({r.minutos} min) · {CHANNEL_LABEL[r.channel]}
            {r.registradoPor !== CHANNEL_LABEL[r.channel] && ` · ${r.registradoPor}`}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-0.5 text-xs font-semibold">
          {r.justificado && <span className="text-primary">Justificado</span>}
          <span className={r.aviso === 'pendente' ? 'text-danger' : 'text-fg-muted'}>
            {AVISO_LABEL[r.aviso]}
          </span>
        </span>
        <Icon
          name="chevron"
          size={18}
          className={clsx('shrink-0 transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div className="mt-3 space-y-3 border-t border-border pt-3">
          <MotivoChips
            label="Motivo"
            value={r.motivo}
            onChange={(motivo) => demoStore.update(r.id, { motivo })}
          />
          <button
            type="button"
            role="switch"
            aria-checked={r.justificado}
            onClick={() => demoStore.update(r.id, { justificado: !r.justificado })}
            className="flex min-h-11 items-center gap-3 text-left text-sm font-semibold"
          >
            <span
              aria-hidden="true"
              className={clsx(
                'relative block h-6 w-11 shrink-0 rounded-full transition-colors',
                r.justificado ? 'bg-primary' : 'bg-border',
              )}
            >
              <span
                className={clsx(
                  'absolute top-0.5 left-0 size-5 rounded-full bg-surface transition-transform',
                  r.justificado ? 'translate-x-5.5' : 'translate-x-0.5',
                )}
              />
            </span>
            Justificado (não conta no total e dispensa o aviso)
          </button>
          <div role="group" aria-label="Liberado para a aula" className="flex flex-wrap gap-1.5">
            {(Object.keys(LIBERADO_LABEL) as Liberado[]).map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={r.liberado === l}
                onClick={() => demoStore.update(r.id, { liberado: r.liberado === l ? null : l })}
                className={clsx(
                  'min-h-10 rounded-full border px-3 text-sm font-semibold',
                  r.liberado === l
                    ? 'border-primary bg-primary text-on-primary'
                    : 'border-border bg-surface hover:border-primary',
                )}
              >
                {LIBERADO_LABEL[l]}
              </button>
            ))}
          </div>
        </div>
      )}
    </li>
  );
}

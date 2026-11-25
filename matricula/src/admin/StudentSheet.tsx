import clsx from 'clsx';
import { useRef, useState } from 'react';
import { Icon } from '@/components/icons';
import { FieldLabel, fieldClasses } from '@/components/ui/Field';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { replyMessage } from '@/lib/adminApi';
import { STATUS, ficha, type Rec } from '@/lib/adminData';
import type { DiplomaConfig } from '@/lib/diplomaConfig';
import type { Step } from '@/lib/schema';
import { DiplomaSection } from './DiplomaSection';
import type { Run } from './types';
import { Button, Notice, StatusBadge } from './ui';

/** Ficha do aluno num painel lateral (sem <dialog>): status com motivo e todos os dados. */
export function StudentSheet({
  rec,
  header,
  steps,
  run,
  onClose,
  diploma,
  registrosUsados,
}: {
  rec: Rec;
  header: string[];
  steps: Step[];
  run: Run;
  onClose: () => void;
  diploma: DiplomaConfig;
  registrosUsados: string[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, true, onClose);
  const [status, setStatus] = useState(rec.status);
  const [obs, setObs] = useState(rec.observacao);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const changed = status !== rec.status || obs.trim() !== rec.observacao;
  const sections = ficha(steps, header, rec.row);

  const save = async () => {
    if (status === 'Pendente' && !obs.trim()) {
      setMsg({ tone: 'error', text: 'Escreva o motivo da pendência.' });
      document.getElementById('motivo')?.focus();
      return;
    }
    setBusy(true);
    setMsg(null);
    const r = await run('status', {
      protocolo: rec.protocolo,
      status,
      observacao: status === 'Matriculado' ? '' : obs.trim(),
    });
    setBusy(false);
    setMsg(
      r.status === 'ok'
        ? { tone: 'ok', text: 'Status salvo.' }
        : { tone: 'error', text: replyMessage(r) },
    );
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-ink/50" aria-hidden="true" onClick={onClose} />
      <div
        ref={ref}
        role="region"
        aria-labelledby="ficha-titulo"
        className="sheet-enter sheet-enter-side relative flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-bg shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-fg/10 bg-bg/95 px-5 py-4 backdrop-blur">
          <div className="min-w-0">
            <p className="font-mono text-sm text-fg-muted">{rec.protocolo}</p>
            <h2 id="ficha-titulo" className="font-display text-3xl leading-tight font-extrabold">
              {rec.nome || '(sem nome)'}
            </h2>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm">
              <StatusBadge status={rec.status} />
              {rec.alteradoPor && (
                <span className="text-fg-muted">
                  por {rec.alteradoPor} em {rec.alteradoEm}
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar ficha"
            className="flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-muted"
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="space-y-6 px-5 py-5">
          <section
            aria-labelledby="status-titulo"
            className="space-y-3 rounded-2xl border-2 border-fg/15 bg-surface p-4"
          >
            <h3 id="status-titulo" className="font-display text-xl font-extrabold">
              Status da matrícula
            </h3>
            <div role="radiogroup" aria-labelledby="status-titulo" className="flex flex-wrap gap-2">
              {STATUS.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={status === s}
                  onClick={() => setStatus(s)}
                  className={clsx(
                    'min-h-11 rounded-xl border-2 px-4 font-semibold',
                    status === s
                      ? 'border-primary bg-primary text-on-primary'
                      : 'border-fg/25 bg-surface hover:border-fg',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            {status !== 'Matriculado' && (
              <div>
                <FieldLabel id="motivo">
                  {status === 'Pendente' ? 'Motivo da pendência' : 'Motivo (opcional)'}
                </FieldLabel>
                <textarea
                  id="motivo"
                  rows={2}
                  value={obs}
                  maxLength={500}
                  onChange={(e) => setObs(e.target.value)}
                  placeholder={status === 'Pendente' ? 'Ex.: falta comprovante de endereço' : ''}
                  className={clsx(fieldClasses(false), 'resize-y')}
                />
              </div>
            )}
            <Notice tone={msg?.tone}>{msg?.text}</Notice>
            <Button
              onClick={() => void save()}
              disabled={busy || !changed}
              icon={busy ? 'refresh' : 'check'}
            >
              {busy ? 'Salvando…' : 'Salvar status'}
            </Button>
          </section>

          <DiplomaSection
            rec={rec}
            header={header}
            steps={steps}
            cfg={diploma}
            registrosUsados={registrosUsados}
            run={run}
          />

          {sections.map((s) => (
            <section key={s.title}>
              <h3 className="mb-2 font-display text-xl font-extrabold">{s.title}</h3>
              <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                {s.items.map((it) => (
                  <div key={it.label} className="min-w-0">
                    <dt className="text-xs text-fg-muted">{it.label}</dt>
                    <dd className="font-medium break-words">{it.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

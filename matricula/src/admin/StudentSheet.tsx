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
import { ReceiptButton } from './ReceiptButton';
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
  proximos = '',
}: {
  rec: Rec;
  header: string[];
  steps: Step[];
  run: Run;
  onClose: () => void;
  diploma: DiplomaConfig;
  registrosUsados: string[];
  /** Próximos passos do comprovante (aba Período). */
  proximos?: string;
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
        <div className="sticky top-0 z-10 flex items-start gap-2 border-b border-fg/10 bg-bg/95 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 backdrop-blur sm:justify-between sm:gap-3 sm:px-5 sm:py-4">
          {/* No celular a ficha é uma tela: volta pela seta à esquerda. */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Voltar para a lista"
            className="flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-muted sm:hidden"
          >
            <Icon name="back" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-sm text-fg-muted">{rec.protocolo}</p>
            <h2
              id="ficha-titulo"
              className="font-display text-2xl leading-tight font-extrabold text-balance sm:text-3xl"
            >
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
            className="hidden size-11 shrink-0 items-center justify-center rounded-full hover:bg-muted sm:flex"
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="space-y-6 px-4 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-5">
          <section
            aria-labelledby="status-titulo"
            className="space-y-3 rounded-2xl border-2 border-fg/15 bg-surface p-4"
          >
            <h3 id="status-titulo" className="font-display text-xl font-extrabold">
              Status da matrícula
            </h3>
            <div
              role="radiogroup"
              aria-labelledby="status-titulo"
              className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap"
            >
              {STATUS.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={status === s}
                  onClick={() => setStatus(s)}
                  className={clsx(
                    'min-h-12 rounded-xl border-2 px-2 font-semibold sm:min-h-11 sm:px-4',
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
            {/* No celular, com mudança por salvar, o botão vai para a barra fixa embaixo. */}
            <Button
              onClick={() => void save()}
              disabled={busy || !changed}
              icon={busy ? 'refresh' : 'check'}
              className={clsx(changed && 'max-sm:hidden')}
            >
              {busy ? 'Salvando…' : 'Salvar status'}
            </Button>
          </section>

          <ReceiptButton rec={rec} header={header} steps={steps} proximos={proximos} />

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
              <dl className="grid gap-x-6 gap-y-3 rounded-2xl border-2 border-fg/10 p-4 sm:grid-cols-2 sm:border-0 sm:p-0">
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
        {changed && (
          <div className="sticky bottom-0 z-10 mt-auto border-t border-fg/10 bg-surface/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:hidden">
            <Button
              onClick={() => void save()}
              disabled={busy}
              icon={busy ? 'refresh' : 'check'}
              className="w-full"
            >
              {busy ? 'Salvando…' : `Salvar status: ${status}`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

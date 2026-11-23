import clsx from 'clsx';
import type { Rec, Stats } from '@/lib/adminData';
import { Card, StatusBadge } from './ui';

function Number_({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: 'ok' | 'accent' | 'muted' | 'primary';
}) {
  return (
    <div className="rounded-2xl border-2 border-fg/15 bg-surface p-4">
      <p className="text-sm font-semibold text-fg-muted">{label}</p>
      <p
        className={clsx(
          'font-display text-5xl leading-none font-extrabold tabular-nums',
          tone === 'ok' && 'text-ok',
          tone === 'primary' && 'text-primary',
          tone === 'muted' && 'text-fg-muted',
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function Overview({
  stats,
  recs,
  onOpen,
}: {
  stats: Stats;
  recs: Rec[];
  onOpen: (r: Rec) => void;
}) {
  const max = Math.max(1, ...stats.porCurso.map((c) => c.ativos));
  const maxDay = Math.max(1, ...stats.porDia.map((d) => d.n));
  const days = stats.porDia.slice(-21);
  const pend = recs.filter((r) => r.status === 'Pendente');
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Number_ label="Matrículas ativas" value={stats.ativos} tone="primary" />
        <Number_ label="Matriculados" value={stats.matriculados} tone="ok" />
        <Number_ label="Pendentes" value={stats.pendentes} />
        <Number_ label="Cancelados" value={stats.cancelados} tone="muted" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Por curso">
          {stats.porCurso.length === 0 ? (
            <p className="text-fg-muted">Nenhuma matrícula ainda.</p>
          ) : (
            <ul className="space-y-3">
              {stats.porCurso.map((c) => (
                <li key={c.curso}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-semibold">{c.curso}</span>
                    <span className="tabular-nums">
                      <strong>{c.ativos}</strong>
                      {c.pendentes > 0 && (
                        <span className="text-fg-muted">
                          {' '}
                          · {c.pendentes} pendente{c.pendentes > 1 ? 's' : ''}
                        </span>
                      )}
                    </span>
                  </div>
                  <div
                    className="mt-1 flex h-3 overflow-hidden rounded-full bg-fg/10"
                    aria-hidden="true"
                  >
                    <div
                      className="h-full bg-ok"
                      style={{ width: `${((c.ativos - c.pendentes) / max) * 100}%` }}
                    />
                    <div
                      className="h-full bg-accent"
                      style={{ width: `${(c.pendentes / max) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 flex gap-4 text-xs text-fg-muted" aria-hidden="true">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded-full bg-ok" /> Matriculados
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded-full bg-accent" /> Pendentes
            </span>
          </p>
        </Card>

        <Card title="Envios por dia">
          {days.length === 0 ? (
            <p className="text-fg-muted">Nenhum envio ainda.</p>
          ) : (
            <>
              <div
                className="flex h-40 items-end gap-1"
                role="img"
                aria-label={days.map((d) => `${d.dia}: ${d.n}`).join(', ')}
              >
                {days.map((d) => (
                  <div
                    key={d.dia}
                    className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
                  >
                    <span className="text-xs font-bold tabular-nums">{d.n}</span>
                    <div
                      className="w-full rounded-t-md bg-primary"
                      style={{ height: Math.max(4, Math.round((d.n / maxDay) * 120)) }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-1 flex gap-1 text-[0.65rem] text-fg-muted" aria-hidden="true">
                {days.map((d, i) => (
                  <span key={d.dia} className="min-w-0 flex-1 text-center">
                    {i === 0 || i === days.length - 1 || days.length <= 8 ? d.dia : ''}
                  </span>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      <Card title={`Pendentes (${pend.length})`}>
        {pend.length === 0 ? (
          <p className="text-fg-muted">Nenhuma matrícula pendente.</p>
        ) : (
          <ul className="divide-y divide-fg/10">
            {pend.map((r) => (
              <li key={r.protocolo}>
                <button
                  type="button"
                  onClick={() => onOpen(r)}
                  className="flex w-full flex-col gap-1 py-3 text-left hover:bg-muted sm:px-2"
                >
                  <span className="flex flex-wrap items-center gap-2 font-semibold">
                    {r.nome || r.protocolo} <StatusBadge status={r.status} />
                  </span>
                  <span className="text-sm text-fg-muted">
                    {r.curso} · {r.observacao || 'sem motivo'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

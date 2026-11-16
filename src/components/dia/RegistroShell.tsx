'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/icons';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { formatHora, toMinutes } from '@/lib/attendance/clock';
import { SAMPLE_NAME, demoStore } from '@/lib/demoStore';
import { ClockSettingsModal } from './ClockSettingsModal';
import { useRegistro } from './useRegistro';

interface Props {
  title: string;
  subtitle: string;
  /** Na Entrada (hub) não há link de voltar. */
  hub?: boolean;
  children: React.ReactNode;
}

/** Moldura das telas de registro: voltar à Entrada, escola, relógio da demo e contadores do dia. */
export function RegistroShell({ title, subtitle, hub = false, children }: Props) {
  const { school, records, clock, now, pendentes } = useRegistro();
  const [clockOpen, setClockOpen] = useState(false);

  // Cada tela abre no topo (a navegação entre telas não recarrega a página).
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  const entrada = toMinutes(clock.entrada) ?? 420;
  const entradaLabel = `${Math.floor(entrada / 60)}h${String(entrada % 60).padStart(2, '0')}`;

  return (
    <Container className="py-4 sm:py-8">
      {!hub && (
        <Link
          href="/demo/dia"
          className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          <Icon name="arrow" size={16} className="rotate-180" />
          Hoje na escola
        </Link>
      )}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-fg pb-4 sm:mb-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-3xl font-medium sm:text-4xl">{title}</h1>
            {school && (
              <Badge tone={school.sourceName === SAMPLE_NAME ? 'accent' : 'neutral'}>
                {school.sourceName}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-fg-muted">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-fg-muted" aria-live="polite">
            Hoje: <strong className="text-fg">{records.length}</strong>{' '}
            {records.length === 1 ? 'atraso' : 'atrasos'} ·{' '}
            <strong className={pendentes ? 'text-danger' : 'text-fg'}>{pendentes}</strong>{' '}
            {pendentes === 1 ? 'aviso pendente' : 'avisos pendentes'}
          </p>
          <Button variant="secondary" size="sm" onClick={() => setClockOpen(true)}>
            <Icon name="clock" size={18} />
            {formatHora(now())} · entrada {entradaLabel} (+{clock.tolerancia} min)
          </Button>
        </div>
      </div>

      {school ? children : <p className="text-fg-muted">Carregando a escola…</p>}

      <ClockSettingsModal
        open={clockOpen}
        onClose={() => setClockOpen(false)}
        value={clock}
        onChange={demoStore.setClock}
      />
    </Container>
  );
}

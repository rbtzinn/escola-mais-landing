'use client';

import clsx from 'clsx';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Icon, type IconName } from '@/components/icons';
import { Badge } from '@/components/ui/Badge';
import { Button, buttonClasses } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { useDemoStore } from '@/hooks/useDemoStore';
import { formatHora, nowFor, toMinutes } from '@/lib/attendance/clock';
import { buildRoster } from '@/lib/attendance/codes';
import { applyLateRecords, pendingNotices } from '@/lib/attendance/records';
import { CHANNEL_LABEL, type Channel } from '@/lib/attendance/types';
import { SAMPLE_NAME, demoStore } from '@/lib/demoStore';
import { analyze } from '@/lib/spreadsheet/analyze';
import { toOptions } from '@/components/demo/Thresholds';
import { ClockSettingsModal } from './ClockSettingsModal';
import { CoordenacaoView } from './CoordenacaoView';
import { PortariaView } from './PortariaView';
import { ProfessorView } from './ProfessorView';
import { TotemView } from './TotemView';

// O gerador de QR só é carregado quando as carteirinhas são abertas.
const CarteirinhasSheet = dynamic(
  () => import('./CarteirinhasSheet').then((m) => m.CarteirinhasSheet),
  { ssr: false },
);

const CHANNELS: { id: Channel; icon: IconName; hint: string }[] = [
  { id: 'totem', icon: 'qr', hint: 'Aluno lê a carteirinha' },
  { id: 'portaria', icon: 'school', hint: 'Busca pelo nome ou QR' },
  { id: 'professor', icon: 'users', hint: 'Marca na chamada' },
  { id: 'coordenacao', icon: 'inbox', hint: 'Edita e avisa famílias' },
];

const isChannel = (v: string | null): v is Channel =>
  v === 'totem' || v === 'portaria' || v === 'professor' || v === 'coordenacao';

/**
 * Registro de atrasos: totem, portaria, professor e coordenação gravando no mesmo lugar.
 * Tudo em memória nesta aba; o painel da /demo soma estes atrasos ao da planilha.
 */
export function RegistroApp() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const canal = params.get('canal');
  const channel: Channel = isChannel(canal) ? canal : 'portaria';
  const { school, records, clock, optionsText } = useDemoStore();
  const [clockOpen, setClockOpen] = useState(false);
  const [cardsOpen, setCardsOpen] = useState(false);

  // Sem planilha carregada na /demo, usa a escola de exemplo.
  useEffect(() => demoStore.ensureSchool(), []);

  const options = useMemo(() => toOptions(optionsText), [optionsText]);
  const analysis = useMemo(() => {
    if (!school) return null;
    const merged = applyLateRecords(school.table, school.mapping, records);
    return analyze(merged.table, merged.mapping, options);
  }, [school, records, options]);
  const roster = useMemo(() => (analysis ? buildRoster(analysis.students) : []), [analysis]);
  const now = useCallback(() => nowFor(clock, new Date()), [clock]);
  const pendentes = pendingNotices(records).length;
  const entradaMin = toMinutes(clock.entrada) ?? 420;
  const entradaLabel = `${Math.floor(entradaMin / 60)}h${String(entradaMin % 60).padStart(2, '0')}`;

  const go = (c: Channel) => router.replace(`${pathname}?canal=${c}`, { scroll: false });

  return (
    <Container className="py-4 sm:py-10">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Registro de atrasos</h1>
        {school && (
          <Badge tone={school.sourceName === SAMPLE_NAME ? 'accent' : 'neutral'}>
            {school.sourceName}
          </Badge>
        )}
      </div>

      <p className="mb-3 flex items-start gap-2 rounded-xl border border-border bg-muted p-3 text-sm">
        <Icon name="info" size={18} className="mt-0.5 shrink-0 text-primary" />
        Demonstração: totem, portaria, professor e coordenação gravam no mesmo lugar. Os registros
        ficam só nesta aba e somem ao recarregar.
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          onClick={() => setClockOpen(true)}
          className="!min-h-10 !px-4 text-sm"
        >
          <Icon name="clock" size={18} />
          {formatHora(now())} · entrada {entradaLabel} (+{clock.tolerancia} min)
        </Button>
        <Button
          variant="ghost"
          onClick={() => setCardsOpen(true)}
          className="!min-h-10 !px-4 text-sm"
        >
          <Icon name="qr" size={18} />
          Carteirinhas
        </Button>
        <Link href="/demo" className={buttonClasses('ghost', '!min-h-10 !px-4 text-sm')}>
          <Icon name="chart" size={18} />
          Ver painel
        </Link>
      </div>

      <div
        role="group"
        aria-label="Onde o atraso é registrado"
        className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-4"
      >
        {CHANNELS.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={channel === c.id}
            onClick={() => go(c.id)}
            className={clsx(
              'flex min-h-14 items-center gap-2 rounded-2xl border-2 p-2.5 text-left transition-colors',
              channel === c.id
                ? 'border-primary bg-primary/10'
                : 'border-border bg-surface hover:border-primary',
            )}
          >
            <Icon name={c.icon} size={22} className="shrink-0 text-primary" />
            <span className="min-w-0">
              <span className="block font-semibold">{CHANNEL_LABEL[c.id]}</span>
              <span className="block truncate text-xs text-fg-muted">{c.hint}</span>
            </span>
          </button>
        ))}
      </div>
      <p className="mb-4 text-sm text-fg-muted">
        Hoje: <strong className="text-fg">{records.length}</strong>{' '}
        {records.length === 1 ? 'atraso' : 'atrasos'} ·{' '}
        <strong className={pendentes ? 'text-danger' : 'text-fg'}>{pendentes}</strong>{' '}
        {pendentes === 1 ? 'aviso pendente' : 'avisos pendentes'}
      </p>

      <div className="rounded-3xl border border-border bg-surface p-3 shadow-card sm:p-8">
        {!school ? (
          <p className="text-fg-muted">Carregando a escola…</p>
        ) : channel === 'totem' ? (
          <TotemView roster={roster} now={now} />
        ) : channel === 'portaria' ? (
          <PortariaView roster={roster} records={records} now={now} />
        ) : channel === 'professor' ? (
          <ProfessorView roster={roster} records={records} now={now} />
        ) : (
          <CoordenacaoView roster={roster} records={records} now={now} analysis={analysis} />
        )}
      </div>

      <ClockSettingsModal
        open={clockOpen}
        onClose={() => setClockOpen(false)}
        value={clock}
        onChange={demoStore.setClock}
      />
      {cardsOpen && (
        <CarteirinhasSheet open={cardsOpen} onClose={() => setCardsOpen(false)} roster={roster} />
      )}
    </Container>
  );
}

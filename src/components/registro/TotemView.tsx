'use client';

import { useEffect, useState } from 'react';
import { findByCode, publicName } from '@/lib/attendance/codes';
import type { RosterEntry } from '@/lib/attendance/types';
import { demoStore } from '@/lib/demoStore';
import { ScanQr } from './ScanQr';
import { type Feedback, FeedbackBox, NOT_FOUND, describe } from './shared';

const CLEAR_MS = 4000;

/** Totem na entrada: o aluno aproxima a carteirinha. Tela pública: só primeiro nome e inicial. */
export function TotemView({ roster, now }: { roster: RosterEntry[]; now: () => Date }) {
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), CLEAR_MS);
    return () => clearTimeout(t);
  }, [feedback]);

  const onCode = (raw: string) => {
    const entry = findByCode(roster, raw);
    if (!entry) return setFeedback(NOT_FOUND);
    const result = demoStore.register({
      entry,
      channel: 'totem',
      registradoPor: 'Totem da entrada',
      at: now(),
    });
    setFeedback(describe(result, publicName(entry.aluno)));
  };

  return (
    <section aria-labelledby="totem-titulo" className="space-y-4">
      <div className="rounded-3xl bg-primary p-5 text-center text-on-primary">
        <h2 id="totem-titulo" className="font-display text-2xl font-extrabold sm:text-3xl">
          Aproxime sua carteirinha
        </h2>
        <p className="mt-1">O QR da carteirinha registra a sua chegada.</p>
      </div>
      <FeedbackBox feedback={feedback} large />
      <ScanQr id="totem-codigo" onCode={onCode} />
      <p className="text-sm text-fg-muted">
        Sem carteirinha ou sem celular? A portaria e a coordenação registram pelo nome, no mesmo
        lugar.
      </p>
    </section>
  );
}

'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Listbox } from '@/components/ui/Listbox';
import { Modal } from '@/components/ui/Modal';
import type { RosterEntry } from '@/lib/attendance/types';
import { QrCode } from './QrCode';

const ALL = 'todas';

function Card({ r }: { r: RosterEntry }) {
  return (
    <div className="qr-light flex break-inside-avoid items-center gap-3 rounded-xl border border-border bg-surface p-3 text-fg">
      <QrCode
        value={r.code}
        label={`QR da carteirinha de ${r.aluno}`}
        className="size-24 shrink-0"
      />
      <div className="min-w-0">
        <p className="text-xs font-semibold tracking-wide text-fg-muted uppercase">Escola+</p>
        <p className="truncate font-bold">{r.aluno}</p>
        <p className="text-sm">{r.turma}</p>
        <p className="mt-1 font-mono text-sm tracking-wider">{r.code}</p>
      </div>
    </div>
  );
}

/**
 * Carteirinhas com QR para testar o totem: abra em outro celular ou imprima.
 * O QR traz só o código opaco; o nome aparece impresso, como em qualquer carteirinha.
 */
export function CarteirinhasSheet({
  open,
  onClose,
  roster,
}: {
  open: boolean;
  onClose: () => void;
  roster: RosterEntry[];
}) {
  const turmas = [...new Set(roster.map((r) => r.turma))].sort((a, b) =>
    a.localeCompare(b, 'pt-BR', { numeric: true }),
  );
  const [turma, setTurma] = useState(turmas[0] ?? ALL);
  const list = turma === ALL ? roster : roster.filter((r) => r.turma === turma);

  return (
    <Modal open={open} onClose={onClose} title="Carteirinhas de teste">
      <p>
        Abra esta tela em outro celular (ou imprima) e aponte para a câmera do totem ou da portaria.
        O QR guarda só um código, sem nome nem turma.
      </p>
      <Listbox
        id="carteirinhas-turma"
        name="carteirinhas-turma"
        label="Turma"
        options={[
          ...turmas.map((t) => ({ value: t, label: t })),
          { value: ALL, label: 'Todas as turmas' },
        ]}
        value={turma}
        onChange={setTurma}
      />
      <Button variant="secondary" onClick={() => window.print()} className="w-full">
        <Icon name="file" size={18} />
        Imprimir ({list.length})
      </Button>
      <div className="grid gap-2">
        {list.map((r) => (
          <Card key={r.code} r={r} />
        ))}
      </div>
      {open &&
        createPortal(
          <div className="print-only">
            <div className="grid grid-cols-2 gap-3 p-4">
              {list.map((r) => (
                <Card key={r.code} r={r} />
              ))}
            </div>
          </div>,
          document.body,
        )}
    </Modal>
  );
}

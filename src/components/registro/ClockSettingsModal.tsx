'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TextField } from '@/components/ui/TextField';
import { addMinutes, isValidTime } from '@/lib/attendance/clock';
import type { ClockSettings } from '@/lib/attendance/types';
import { parseNumber } from '@/lib/spreadsheet/numbers';

interface Props {
  open: boolean;
  onClose: () => void;
  value: ClockSettings;
  onChange: (c: ClockSettings) => void;
}

/** Horário de entrada, tolerância e a hora usada pela demo (simulada ou real). */
export function ClockSettingsModal({ open, onClose, value, onChange }: Props) {
  const [entrada, setEntrada] = useState(value.entrada);
  const [tolerancia, setTolerancia] = useState(String(value.tolerancia));
  const tol = parseNumber(tolerancia);
  const tolOk = tol !== null && Number.isInteger(tol) && tol >= 0 && tol <= 120;

  const commit = (patch: Partial<ClockSettings>) => onChange({ ...value, ...patch });

  return (
    <Modal open={open} onClose={onClose} title="Relógio e horário">
      <div className="grid grid-cols-2 gap-3">
        <TextField
          id="relogio-entrada"
          label="Entrada"
          type="time"
          value={entrada}
          onChange={(v) => {
            setEntrada(v);
            if (isValidTime(v)) commit({ entrada: v });
          }}
          error={isValidTime(entrada) ? undefined : 'Use HH:MM.'}
        />
        <TextField
          id="relogio-tolerancia"
          label="Tolerância (min)"
          inputMode="numeric"
          value={tolerancia}
          onChange={(v) => {
            setTolerancia(v);
            const n = parseNumber(v);
            if (n !== null && Number.isInteger(n) && n >= 0 && n <= 120) commit({ tolerancia: n });
          }}
          error={tolOk ? undefined : 'De 0 a 120.'}
        />
      </div>

      <div className="space-y-2 rounded-2xl border border-border p-3">
        <p className="font-semibold text-fg">Hora da demonstração</p>
        <p className="text-sm">
          Para testar fora do horário de entrada, a demo usa uma hora simulada.
        </p>
        {value.simulada !== null ? (
          <>
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <TextField
                  id="relogio-simulada"
                  label="Hora simulada"
                  type="time"
                  value={value.simulada}
                  onChange={(v) => isValidTime(v) && commit({ simulada: v })}
                />
              </div>
              <Button
                variant="secondary"
                className="mb-0.5 !px-3"
                onClick={() => commit({ simulada: addMinutes(value.simulada!, -5) })}
                aria-label="Voltar 5 minutos"
              >
                −5
              </Button>
              <Button
                variant="secondary"
                className="mb-0.5 !px-3"
                onClick={() => commit({ simulada: addMinutes(value.simulada!, 5) })}
                aria-label="Avançar 5 minutos"
              >
                +5
              </Button>
            </div>
            <Button variant="ghost" onClick={() => commit({ simulada: null })}>
              Usar a hora real
            </Button>
          </>
        ) : (
          <Button variant="secondary" onClick={() => commit({ simulada: '07:12' })}>
            Usar hora simulada (7h12)
          </Button>
        )}
      </div>
      <Button onClick={onClose} className="w-full">
        Pronto
      </Button>
    </Modal>
  );
}

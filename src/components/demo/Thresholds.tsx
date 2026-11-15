'use client';

import { TextField } from '@/components/ui/TextField';
import { parseNumber } from '@/lib/spreadsheet/numbers';
import { DEFAULT_OPTIONS, type Options } from '@/lib/spreadsheet/types';

export type OptionsText = Record<keyof Options, string>;

export const defaultOptionsText: OptionsText = {
  diasLetivos: String(DEFAULT_OPTIONS.diasLetivos),
  freqMin: String(DEFAULT_OPTIONS.freqMin),
  mediaMin: String(DEFAULT_OPTIONS.mediaMin),
  atrasosMin: String(DEFAULT_OPTIONS.atrasosMin),
};

const RANGES: Record<keyof Options, [number, number]> = {
  diasLetivos: [1, 400],
  freqMin: [0, 100],
  mediaMin: [0, 10],
  atrasosMin: [1, 50],
};

/** Converte os textos digitados em números válidos (fora do intervalo ou vazio: usa o padrão). */
export function toOptions(text: OptionsText): Options {
  const out = { ...DEFAULT_OPTIONS };
  (Object.keys(RANGES) as (keyof Options)[]).forEach((k) => {
    const n = parseNumber(text[k]);
    const [min, max] = RANGES[k];
    if (n !== null && n >= min && n <= max) out[k] = n;
  });
  return out;
}

const FIELDS: { key: keyof Options; label: string }[] = [
  { key: 'diasLetivos', label: 'Dias letivos até agora' },
  { key: 'freqMin', label: 'Frequência mínima (%)' },
  { key: 'mediaMin', label: 'Média mínima (0 a 10)' },
  { key: 'atrasosMin', label: 'Atrasos para avisar' },
];

interface Props {
  value: OptionsText;
  onChange: (v: OptionsText) => void;
}

/** Critérios do painel. Ao mudar, o painel é recalculado na hora. */
export function Thresholds({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {FIELDS.map(({ key, label }) => {
        const n = parseNumber(value[key]);
        const [min, max] = RANGES[key];
        const invalid = value[key].trim() !== '' && (n === null || n < min || n > max);
        return (
          <TextField
            key={key}
            id={`opt-${key}`}
            label={label}
            inputMode="decimal"
            value={value[key]}
            onChange={(v) => onChange({ ...value, [key]: v })}
            error={invalid ? `Use um valor de ${min} a ${max}.` : undefined}
          />
        );
      })}
    </div>
  );
}

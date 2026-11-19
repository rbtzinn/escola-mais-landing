import clsx from 'clsx';
import { Icon } from '@/components/icons';
import type { Delta } from '@/lib/spreadsheet/compare';
import type { Level } from '@/lib/spreadsheet/insights';
import { formatNumber } from '@/lib/spreadsheet/numbers';

/** Cores do semáforo, só com tokens. O texto sempre repete a situação (a cor não é a única pista). */
export const LEVEL_CARD: Record<Level, string> = {
  ok: 'border-ok/50 bg-ok/10',
  atencao: 'border-accent bg-accent/25',
  critico: 'border-danger/60 bg-danger/10',
};

export const LEVEL_DOT: Record<Level, string> = {
  ok: 'bg-ok',
  atencao: 'bg-accent',
  critico: 'bg-danger',
};

export const LEVEL_TEXT: Record<Level, string> = {
  ok: 'text-ok',
  atencao: 'text-fg',
  critico: 'text-danger',
};

interface DeltaProps {
  value: Delta;
  /** true quando subir é bom (frequência, média); false quando subir é ruim (alunos em risco). */
  higherIsBetter: boolean;
  /** Sufixo da unidade: " p.p.", "" etc. */
  unit?: string;
  decimals?: number;
  className?: string;
}

/** Seta com a variação desde a planilha anterior. Verde quando melhora, vermelho quando piora. */
export function DeltaTag({
  value,
  higherIsBetter,
  unit = '',
  decimals = 1,
  className,
}: DeltaProps) {
  if (value === null) return null;
  const rounded = Number(value.toFixed(decimals));
  if (rounded === 0)
    return <span className={clsx('text-xs font-semibold text-fg-muted', className)}>= igual</span>;
  const up = rounded > 0;
  const good = up === higherIsBetter;
  const text = `${up ? '+' : '−'}${formatNumber(Math.abs(rounded), decimals)}${unit}`;
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-0.5 text-xs font-bold whitespace-nowrap',
        good ? 'text-ok' : 'text-danger',
        className,
      )}
    >
      <Icon name={up ? 'up' : 'down'} size={14} />
      {text}
      <span className="sr-only">{good ? ' (melhorou)' : ' (piorou)'}</span>
    </span>
  );
}

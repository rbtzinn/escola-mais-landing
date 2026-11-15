'use client';

import clsx from 'clsx';
import { Icon } from '@/components/icons';
import { Button } from '@/components/ui/Button';

interface Props {
  /** Nome da planilha anterior em uso, ou null quando não há comparação. */
  previousName: string | null;
  emComum: number;
  loading: boolean;
  onFile: (file: File) => void;
  /** Só na escola de exemplo: usa o bimestre anterior fictício. */
  onSample?: () => void;
  onRemove: () => void;
}

/** Envia uma segunda planilha (ex.: bimestre anterior) para ver o que melhorou ou piorou. */
export function ComparePanel({
  previousName,
  emComum,
  loading,
  onFile,
  onSample,
  onRemove,
}: Props) {
  if (previousName)
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-surface p-3 text-sm">
        <p className="min-w-0">
          <span className="font-semibold">Comparando com:</span> {previousName}
          <span className="text-fg-muted">
            {' '}
            · {emComum.toLocaleString('pt-BR')} aluno(s) nas duas planilhas
          </span>
        </p>
        <Button variant="ghost" onClick={onRemove} className="!min-h-10 !px-3 text-sm">
          Remover comparação
        </Button>
      </div>
    );

  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface p-3">
      <p className="text-sm font-semibold">Comparar com a planilha anterior</p>
      <p className="text-sm text-fg-muted">
        Envie o bimestre passado para ver setas de melhora e piora por turma e por aluno.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <input
          id="arquivo-anterior"
          type="file"
          accept=".csv,.xlsx"
          className="peer sr-only"
          disabled={loading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) onFile(file);
          }}
        />
        <label
          htmlFor="arquivo-anterior"
          className={clsx(
            'peer-focus-visible:outline-ring inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-semibold peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 hover:border-primary hover:text-primary',
            loading && 'pointer-events-none opacity-60',
          )}
        >
          <Icon name="sheet" size={18} />
          {loading ? 'Lendo…' : 'Enviar planilha anterior'}
        </label>
        {onSample && (
          <Button variant="ghost" onClick={onSample} className="!min-h-10 !px-4 text-sm">
            Usar bimestre anterior do exemplo
          </Button>
        )}
      </div>
    </div>
  );
}

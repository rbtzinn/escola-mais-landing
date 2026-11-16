'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/icons';
import { Button } from '@/components/ui/Button';

interface Props {
  onFile: (file: File) => void;
  /** Abre o painel com a escola de exemplo, sem planilha. */
  onSample: () => void;
  loading: boolean;
  error: string | null;
}

/** Área para escolher ou arrastar a planilha. O input nativo fica oculto; o rótulo é o botão. */
export function FileDropzone({ onFile, onSample, loading, error }: Props) {
  const [dragging, setDragging] = useState(false);

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) onFile(file);
        }}
        className={clsx(
          'flex flex-col items-center rounded-3xl border-2 border-dashed px-6 py-12 text-center transition-colors',
          dragging ? 'border-primary bg-primary/10' : 'border-border bg-surface',
        )}
      >
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon name="sheet" size={28} />
        </span>
        <p className="mt-5 font-display text-xl font-bold">Arraste a planilha da sua escola aqui</p>
        <p className="mt-1 text-fg-muted">Formatos aceitos: .csv e .xlsx, até 5 MB</p>

        <input
          id="arquivo-planilha"
          type="file"
          accept=".csv,.xlsx"
          className="peer sr-only"
          disabled={loading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = ''; // permite escolher o mesmo arquivo de novo
            if (file) onFile(file);
          }}
        />
        <label
          htmlFor="arquivo-planilha"
          className={clsx(
            'peer-focus-visible:outline-ring mt-6 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full bg-primary px-6 py-2.5 font-semibold text-on-primary peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 hover:brightness-110',
            loading && 'pointer-events-none opacity-60',
          )}
        >
          {loading ? 'Lendo planilha…' : 'Escolher arquivo'}
        </label>
        <p className="mt-5 text-sm text-fg-muted">Sem planilha à mão?</p>
        <Button variant="secondary" onClick={onSample} disabled={loading} className="mt-2">
          <Icon name="school" size={20} />
          Ver com escola de exemplo
        </Button>
        <Link
          href="/demo/dia"
          className="mt-3 text-sm font-semibold text-primary underline underline-offset-4"
        >
          Ou simule o registro de atrasos na entrada
        </Link>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-danger/40 bg-danger/10 p-4 font-medium text-danger"
        >
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-2 text-sm text-fg-muted sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2">
          <Icon name="shield" size={18} className="mt-0.5 shrink-0 text-primary" />
          Seus dados não saem do navegador: a planilha é lida e calculada aqui mesmo, sem envio nem
          armazenamento.
        </p>
        <a
          href="/modelo-escola-mais.csv"
          download
          className="shrink-0 font-semibold text-primary underline underline-offset-4"
        >
          Baixar planilha-modelo
        </a>
      </div>
    </div>
  );
}

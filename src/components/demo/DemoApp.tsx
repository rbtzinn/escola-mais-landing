'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { useToast } from '@/components/ui/Toast';
import { analyze } from '@/lib/spreadsheet/analyze';
import { guessMapping } from '@/lib/spreadsheet/columns';
import { readSpreadsheet } from '@/lib/spreadsheet/readFile';
import type { Mapping, RawTable } from '@/lib/spreadsheet/types';
import { ColumnMapper } from './ColumnMapper';
import { Dashboard } from './Dashboard';
import { FileDropzone } from './FileDropzone';
import { Thresholds, defaultOptionsText, toOptions, type OptionsText } from './Thresholds';

type Step = 'upload' | 'map' | 'dashboard';

const TITLES: Record<Step, string> = {
  upload: '1. Envie a planilha',
  map: '2. Confira as colunas',
  dashboard: '3. Seu painel',
};

/** Demo funcional: planilha (CSV ou Excel) vira painel, tudo no navegador. */
export function DemoApp() {
  const toast = useToast();
  const [step, setStep] = useState<Step>('upload');
  const [table, setTable] = useState<RawTable | null>(null);
  const [mapping, setMapping] = useState<Mapping | null>(null);
  const [optionsText, setOptionsText] = useState<OptionsText>(defaultOptionsText);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options = useMemo(() => toOptions(optionsText), [optionsText]);
  const analysis = useMemo(
    () => (step === 'dashboard' && table && mapping ? analyze(table, mapping, options) : null),
    [step, table, mapping, options],
  );

  const onFile = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const t = await readSpreadsheet(file);
      setTable(t);
      setMapping(guessMapping(t));
      setStep('map');
      toast.show({
        title: 'Planilha carregada',
        description: `${t.rows.length.toLocaleString('pt-BR')} linha(s) lida(s) neste navegador.`,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível ler a planilha.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setTable(null);
    setMapping(null);
    setError(null);
    setStep('upload');
  };

  return (
    <Container className="py-12 sm:py-16">
      <div className="mb-8 max-w-2xl">
        <p className="mb-3 text-sm font-bold tracking-[0.14em] text-secondary uppercase">
          Demonstração
        </p>
        <h1 className="font-display text-3xl leading-tight font-extrabold text-balance sm:text-4xl">
          Teste com a planilha da sua escola
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-fg-muted">
          Envie uma planilha de alunos e veja frequência, notas, alunos em risco e atrasos em um
          painel, sem cadastro e sem enviar nada para a internet.
        </p>
      </div>

      <div className="rounded-3xl border border-border bg-surface p-3 shadow-card sm:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold" aria-live="polite">
            {TITLES[step]}
          </h2>
          {step !== 'upload' && (
            <div className="flex gap-2">
              {step === 'dashboard' && (
                <Button
                  variant="ghost"
                  className="!min-h-10 text-sm"
                  onClick={() => setStep('map')}
                >
                  Ajustar colunas
                </Button>
              )}
              <Button variant="secondary" className="!min-h-10 text-sm" onClick={reset}>
                Trocar planilha
              </Button>
            </div>
          )}
        </div>

        {step === 'upload' && <FileDropzone onFile={onFile} loading={loading} error={error} />}

        {step === 'map' && table && mapping && (
          <ColumnMapper
            table={table}
            mapping={mapping}
            onChange={setMapping}
            onSubmit={() => setStep('dashboard')}
            onBack={reset}
          />
        )}

        {step === 'dashboard' && analysis && mapping && (
          <div>
            <div className="mb-6">
              <Thresholds value={optionsText} onChange={setOptionsText} />
            </div>
            <Dashboard analysis={analysis} hasLateColumn={mapping.atrasos !== null} />
          </div>
        )}
      </div>
    </Container>
  );
}

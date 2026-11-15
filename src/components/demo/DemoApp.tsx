'use client';

import { useEffect, useMemo, useState } from 'react';
import { Icon } from '@/components/icons';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { analyze } from '@/lib/spreadsheet/analyze';
import { guessMapping, isConfident } from '@/lib/spreadsheet/columns';
import { compare } from '@/lib/spreadsheet/compare';
import { readSpreadsheet } from '@/lib/spreadsheet/readFile';
import { sampleTable } from '@/lib/spreadsheet/sample';
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

const SAMPLE_NAME = 'Escola de exemplo';

/** Demo funcional: planilha (CSV ou Excel) vira painel, tudo no navegador. */
export function DemoApp() {
  const toast = useToast();
  const [step, setStep] = useState<Step>('upload');
  const [table, setTable] = useState<RawTable | null>(null);
  const [sourceName, setSourceName] = useState<string | null>(null);
  const [mapping, setMapping] = useState<Mapping | null>(null);
  const [previous, setPrevious] = useState<{ table: RawTable; name: string } | null>(null);
  const [optionsText, setOptionsText] = useState<OptionsText>(defaultOptionsText);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingPrev, setLoadingPrev] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options = useMemo(() => toOptions(optionsText), [optionsText]);
  const analysis = useMemo(
    () => (step === 'dashboard' && table && mapping ? analyze(table, mapping, options) : null),
    [step, table, mapping, options],
  );
  const comparison = useMemo(() => {
    if (!analysis || !previous) return null;
    return compare(analysis, analyze(previous.table, guessMapping(previous.table), options));
  }, [analysis, previous, options]);

  const isSample = sourceName === SAMPLE_NAME;

  // Ao abrir o painel, volta ao topo: a primeira coisa vista é o veredito.
  useEffect(() => {
    if (step === 'dashboard') window.scrollTo({ top: 0 });
  }, [step]);

  const open = (t: RawTable, name: string) => {
    const m = guessMapping(t);
    setTable(t);
    setSourceName(name);
    setMapping(m);
    setPrevious(null);
    setStep(isConfident(m) ? 'dashboard' : 'map');
    return m;
  };

  const onFile = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const t = await readSpreadsheet(file);
      const m = open(t, file.name);
      const lidas = `${t.rows.length.toLocaleString('pt-BR')} linha(s) lida(s) neste navegador.`;
      toast.show(
        isConfident(m)
          ? {
              title: 'Colunas reconhecidas',
              description: `${lidas} Ajuste em “Colunas” se precisar.`,
            }
          : { title: 'Planilha carregada', description: lidas },
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível ler a planilha.');
    } finally {
      setLoading(false);
    }
  };

  const onSample = () => {
    setError(null);
    open(sampleTable('atual'), SAMPLE_NAME);
  };

  const onPrevious = async (file: File) => {
    setLoadingPrev(true);
    try {
      const t = await readSpreadsheet(file);
      const m = guessMapping(t);
      if (m.aluno === null || m.turma === null)
        throw new Error('Não encontramos as colunas de aluno e turma na planilha anterior.');
      setPrevious({ table: t, name: file.name });
      toast.show({ title: 'Comparação pronta', description: `Comparando com ${file.name}.` });
    } catch (e) {
      toast.show({
        title: 'Não foi possível comparar',
        description: e instanceof Error ? e.message : 'Verifique a planilha anterior.',
      });
    } finally {
      setLoadingPrev(false);
    }
  };

  const reset = () => {
    setTable(null);
    setSourceName(null);
    setMapping(null);
    setPrevious(null);
    setError(null);
    setStep('upload');
  };

  const onDashboard = step === 'dashboard';

  return (
    <Container className={onDashboard ? 'py-4 sm:py-10' : 'py-12 sm:py-16'}>
      {onDashboard ? (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Painel da escola</h1>
          {sourceName && <Badge tone={isSample ? 'accent' : 'neutral'}>{sourceName}</Badge>}
        </div>
      ) : (
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
      )}

      <div className="rounded-3xl border border-border bg-surface p-3 shadow-card sm:p-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 sm:mb-6">
          <h2
            className={onDashboard ? 'sr-only' : 'font-display text-xl font-bold'}
            aria-live="polite"
          >
            {TITLES[step]}
          </h2>
          {step !== 'upload' && (
            <div className="flex flex-wrap gap-2">
              {onDashboard && (
                <>
                  <Button
                    variant="secondary"
                    className="!min-h-10 !px-4 text-sm"
                    onClick={() => setSettingsOpen(true)}
                  >
                    <Icon name="sliders" size={18} />
                    Critérios
                  </Button>
                  {!isSample && (
                    <Button
                      variant="ghost"
                      className="!min-h-10 !px-4 text-sm"
                      onClick={() => setStep('map')}
                    >
                      Colunas
                    </Button>
                  )}
                </>
              )}
              <Button variant="ghost" className="!min-h-10 !px-4 text-sm" onClick={reset}>
                Trocar planilha
              </Button>
            </div>
          )}
        </div>

        {step === 'upload' && (
          <FileDropzone onFile={onFile} onSample={onSample} loading={loading} error={error} />
        )}

        {step === 'map' && table && mapping && (
          <ColumnMapper
            table={table}
            mapping={mapping}
            onChange={setMapping}
            onSubmit={() => setStep('dashboard')}
            onBack={reset}
          />
        )}

        {onDashboard && analysis && mapping && (
          <Dashboard
            analysis={analysis}
            comparison={comparison}
            hasLateColumn={mapping.atrasos !== null}
            compareProps={{
              previousName: previous?.name ?? null,
              loading: loadingPrev,
              onFile: onPrevious,
              onSample: isSample
                ? () =>
                    setPrevious({ table: sampleTable('anterior'), name: '1º bimestre (exemplo)' })
                : undefined,
              onRemove: () => setPrevious(null),
            }}
          />
        )}
      </div>

      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Critérios do painel">
        <p>O painel é recalculado na hora, a cada mudança.</p>
        <Thresholds value={optionsText} onChange={setOptionsText} />
        <Button onClick={() => setSettingsOpen(false)} className="w-full">
          Ver painel
        </Button>
      </Modal>
    </Container>
  );
}

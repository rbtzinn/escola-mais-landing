'use client';

import { useState } from 'react';
import { Icon } from '@/components/icons';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { downloadText, riskToCsv } from '@/lib/spreadsheet/exportCsv';
import type { Analysis } from '@/lib/spreadsheet/types';

const INITIAL = 5;

/** Alunos com frequência ou média abaixo do mínimo, com o motivo de cada alerta. */
export function RiskList({ analysis }: { analysis: Analysis }) {
  const toast = useToast();
  const [all, setAll] = useState(false);
  const { risco } = analysis;
  const shown = all ? risco : risco.slice(0, INITIAL);

  const download = () => {
    downloadText('alunos-em-risco.csv', riskToCsv(analysis));
    toast.show({
      title: 'Lista baixada',
      description: 'Arquivo alunos-em-risco.csv, aberto direto no Excel.',
    });
  };

  return (
    <section
      aria-labelledby="risco-titulo"
      className="min-w-0 rounded-2xl border border-border bg-surface p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id="risco-titulo" className="font-display text-xl font-bold">
          Alunos em risco ({risco.length})
        </h3>
        {risco.length > 0 && (
          <Button variant="secondary" onClick={download} className="!min-h-10 !px-4 text-sm">
            <Icon name="file" size={18} />
            Baixar lista em CSV
          </Button>
        )}
      </div>

      {risco.length === 0 ? (
        <p className="mt-3 text-fg-muted">
          Nenhum aluno abaixo dos mínimos de frequência e de média.
        </p>
      ) : (
        <>
          <ul className="mt-3 space-y-2">
            {shown.map(({ student, motivos }) => (
              <li
                key={`${student.turma}-${student.aluno}`}
                className="rounded-xl border border-border bg-bg px-3 py-2.5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{student.aluno}</span>
                  <Badge>{student.turma}</Badge>
                </div>
                <p className="mt-1 text-sm text-fg-muted">{motivos.join(' · ')}</p>
              </li>
            ))}
          </ul>
          {risco.length > INITIAL && (
            <Button variant="ghost" onClick={() => setAll(!all)} className="mt-3">
              {all ? 'Mostrar menos' : `Mostrar todos (${risco.length})`}
            </Button>
          )}
        </>
      )}
    </section>
  );
}

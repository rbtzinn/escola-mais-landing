'use client';

import clsx from 'clsx';
import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { TextField } from '@/components/ui/TextField';
import { isValidTime, formatHHMM } from '@/lib/attendance/clock';
import { demoStore } from '@/lib/demoStore';
import { RegistroShell } from './RegistroShell';
import { useRegistro } from './useRegistro';

/** Merenda: quantas refeições a cozinha prepara hoje, por turma e no total. */
export function MerendaView() {
  const { mealsByClass, refeicoes, merendaAberta, mealDeadline } = useRegistro();
  const [prazo, setPrazo] = useState(mealDeadline);
  const naoVao = mealsByClass.reduce((s, c) => s + c.naoVao, 0);
  const semResposta = mealsByClass.reduce((s, c) => s + c.semResposta, 0);
  const estimadas = mealsByClass.filter((c) => c.estimado).length;
  const h = formatHHMM(mealDeadline);

  return (
    <RegistroShell
      title="Merenda"
      subtitle="O aluno responde pelo celular se vai comer. Quem está presente e não respondeu entra na conta."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
        <section
          aria-labelledby="merenda-total"
          className="space-y-4 rounded-3xl border border-border bg-surface p-4 shadow-card sm:p-6"
        >
          <h2 id="merenda-total" className="text-sm font-semibold text-fg-muted">
            Refeições para preparar hoje
          </h2>
          <p className="font-display text-5xl font-extrabold">{refeicoes}</p>
          <p className="flex flex-wrap items-center gap-2 text-sm">
            <span
              className={clsx(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold',
                merendaAberta ? 'bg-accent/25 text-fg' : 'bg-primary/15 text-primary',
              )}
            >
              <span
                aria-hidden="true"
                className={clsx('size-2 rounded-full', merendaAberta ? 'bg-accent' : 'bg-primary')}
              />
              {merendaAberta ? `Respostas abertas até ${h}` : `Conta fechada às ${h}`}
            </span>
          </p>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl bg-muted p-3">
              <dt className="text-fg-muted">Não vão comer</dt>
              <dd className="font-display text-xl font-extrabold">{naoVao}</dd>
            </div>
            <div className="rounded-xl bg-muted p-3">
              <dt className="text-fg-muted">Sem resposta (contam)</dt>
              <dd className="font-display text-xl font-extrabold">{semResposta}</dd>
            </div>
          </dl>
          {estimadas > 0 && (
            <p className="text-sm text-fg-muted">
              {estimadas} {estimadas === 1 ? 'turma ainda não fez' : 'turmas ainda não fizeram'} a
              chamada: a conta usa todos os alunos delas até lá.
            </p>
          )}
          <div className="max-w-48 border-t border-border pt-4">
            <TextField
              id="merenda-prazo"
              label="Prazo para o aluno responder"
              type="time"
              value={prazo}
              onChange={(v) => {
                setPrazo(v);
                if (isValidTime(v)) demoStore.setMealDeadline(v);
              }}
              error={isValidTime(prazo) ? undefined : 'Use HH:MM.'}
            />
          </div>
        </section>

        <section
          aria-labelledby="merenda-turmas"
          className="rounded-3xl border border-border bg-surface p-4 sm:p-6"
        >
          <h2 id="merenda-turmas" className="mb-3 font-display text-lg font-bold">
            Por turma
          </h2>
          <div
            role="region"
            aria-labelledby="merenda-turmas"
            tabIndex={0}
            className="overflow-x-auto"
          >
            <table className="w-full min-w-max text-left text-sm">
              <thead>
                <tr className="border-b border-border text-fg-muted">
                  <th scope="col" className="py-2 pr-3 font-semibold">
                    Turma
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">
                    Presentes
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">
                    Vão comer
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">
                    Não vão
                  </th>
                  <th scope="col" className="py-2 pl-3 text-right font-semibold">
                    Sem resposta
                  </th>
                </tr>
              </thead>
              <tbody>
                {mealsByClass.map((c) => (
                  <tr key={c.turma} className="border-b border-border last:border-0">
                    <th scope="row" className="py-2 pr-3 font-semibold">
                      {c.turma}{' '}
                      {c.estimado && <Badge className="ml-1 !px-2 !py-0.5">sem chamada</Badge>}
                    </th>
                    <td className="px-3 py-2 text-right">{c.base}</td>
                    <td className="px-3 py-2 text-right font-bold">{c.vaoComer}</td>
                    <td className="px-3 py-2 text-right">{c.naoVao}</td>
                    <td className="py-2 pl-3 text-right text-fg-muted">{c.semResposta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </RegistroShell>
  );
}

'use client';

import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Listbox } from '@/components/ui/Listbox';
import { formatHora } from '@/lib/attendance/clock';
import { UNDO_MINUTES, undoSecondsLeft } from '@/lib/attendance/records';
import { CHANNEL_LABEL } from '@/lib/attendance/types';
import { demoStore } from '@/lib/demoStore';
import { RegistroShell } from './RegistroShell';
import { type Feedback, FeedbackBox, OperatorField, describe } from './shared';
import { useRegistro } from './useRegistro';

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/**
 * Chamada do 1º horário: o professor marca só quem faltou (os demais contam como presentes),
 * registra quem entrou atrasado e pode desfazer um atraso por 5 minutos.
 */
export function ChamadaView() {
  const { roster, records, turmas, now, chamadas } = useRegistro();
  const [turma, setTurma] = useState('');
  const [operator, setOperator] = useState('Professor(a)');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  // Ausentes marcados e ainda não salvos, por turma.
  const [rascunho, setRascunho] = useState<Record<string, string[]>>({});
  // Relógio real (não o simulado) para a contagem do "desfazer".
  const [agora, setAgora] = useState(() => new Date());

  const turmaAtual = turma || turmas[0] || '';
  const salva = chamadas[turmaAtual];
  const ausentes = rascunho[turmaAtual] ?? salva?.ausentes ?? [];
  const alterada =
    rascunho[turmaAtual] !== undefined &&
    [...rascunho[turmaAtual]].sort().join() !== [...(salva?.ausentes ?? [])].sort().join();
  const registered = new Map(records.map((r) => [r.key, r]));
  const desfazendo = records.filter(
    (r) => r.channel === 'professor' && undoSecondsLeft(r, agora) > 0,
  ).length;

  // Só faz tique-taque enquanto houver algo que ainda dá para desfazer.
  useEffect(() => {
    if (desfazendo === 0) return;
    const t = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(t);
  }, [desfazendo]);

  const alunos = roster
    .filter((r) => r.turma === turmaAtual)
    .sort((a, b) => a.aluno.localeCompare(b.aluno, 'pt-BR'));
  const faltas = alunos.filter((a) => ausentes.includes(a.key) && !registered.has(a.key)).length;

  const toggleFalta = (key: string) =>
    setRascunho({
      ...rascunho,
      [turmaAtual]: ausentes.includes(key) ? ausentes.filter((k) => k !== key) : [...ausentes, key],
    });

  const salvar = () => {
    demoStore.saveChamada({
      turma: turmaAtual,
      ausentes,
      por: operator.trim() || 'Professor(a)',
      em: now().toISOString(),
    });
    setRascunho(Object.fromEntries(Object.entries(rascunho).filter(([t]) => t !== turmaAtual)));
    setFeedback({
      tone: 'ok',
      title: `Chamada da turma ${turmaAtual} salva`,
      detail: `${alunos.length - faltas} presentes e ${faltas} ${faltas === 1 ? 'ausente' : 'ausentes'}. A contagem do dia e a merenda já foram atualizadas.`,
    });
  };

  return (
    <RegistroShell
      title="Chamada"
      subtitle={`Marque só quem faltou e quem entrou atrasado. Errou um atraso? Dá para desfazer por ${UNDO_MINUTES} minutos.`}
    >
      <section
        aria-labelledby="chamada-titulo"
        className="space-y-4 rounded-3xl border border-border bg-surface p-4 shadow-card sm:p-6"
      >
        <h2 id="chamada-titulo" className="sr-only">
          Chamada da turma
        </h2>
        <div className="grid max-w-2xl gap-3 sm:grid-cols-2">
          <OperatorField
            id="chamada-nome"
            label="Seu nome"
            value={operator}
            onChange={setOperator}
          />
          <Listbox
            id="chamada-turma"
            name="chamada-turma"
            label="Turma"
            options={turmas.map((t) => ({
              value: t,
              label: chamadas[t] ? `${t} · chamada feita` : t,
            }))}
            value={turmaAtual}
            onChange={setTurma}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-muted p-3">
          <p className="text-sm">
            <strong className="text-fg">{alunos.length - faltas}</strong> presentes ·{' '}
            <strong className={faltas ? 'text-danger' : 'text-fg'}>{faltas}</strong>{' '}
            {faltas === 1 ? 'ausente' : 'ausentes'}
            <span className="block text-xs text-fg-muted">
              {salva
                ? `Chamada salva às ${formatHora(new Date(salva.em))} por ${salva.por}${alterada ? ' · alterações não salvas' : ''}`
                : 'Chamada ainda não salva'}
            </span>
          </p>
          <Button size="sm" onClick={salvar} disabled={Boolean(salva) && !alterada}>
            <Icon name="check" size={18} />
            {salva ? 'Salvar alterações' : 'Salvar chamada'}
          </Button>
        </div>

        <FeedbackBox feedback={feedback} />

        <ul aria-label={`Alunos da turma ${turmaAtual}`} className="grid gap-2 lg:grid-cols-2">
          {alunos.map((a) => {
            const reg = registered.get(a.key);
            const faltou = !reg && ausentes.includes(a.key);
            const left = reg && reg.channel === 'professor' ? undoSecondsLeft(reg, agora) : 0;
            return (
              <li
                key={a.key}
                className={clsx(
                  'flex min-h-14 items-center justify-between gap-2 rounded-xl border px-3 py-2',
                  faltou ? 'border-danger/50 bg-danger/5' : 'border-border bg-surface',
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{a.aluno}</span>
                  <span className="block text-xs text-fg-muted">
                    {reg
                      ? `Atrasado · ${formatHora(new Date(reg.at))} · por ${CHANNEL_LABEL[reg.channel]}${
                          reg.channel === 'professor' && left === 0
                            ? ' · para corrigir, fale com a coordenação'
                            : ''
                        }`
                      : faltou
                        ? 'Ausente'
                        : 'Presente'}
                  </span>
                </span>
                <span className="flex shrink-0 gap-1">
                  {!reg && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={clsx(faltou && 'bg-danger/10 text-danger ring-1 ring-danger/50')}
                      aria-pressed={faltou}
                      aria-label={`Marcar falta de ${a.aluno}`}
                      onClick={() => toggleFalta(a.key)}
                    >
                      Faltou
                    </Button>
                  )}
                  {!reg && !faltou && (
                    <Button
                      variant="secondary"
                      size="sm"
                      aria-label={`Marcar atraso de ${a.aluno}`}
                      onClick={() => {
                        const result = demoStore.register({
                          entry: a,
                          channel: 'professor',
                          registradoPor: operator,
                          at: now(),
                        });
                        setAgora(new Date());
                        setFeedback(describe(result, a.aluno));
                      }}
                    >
                      Atrasado
                    </Button>
                  )}
                  {reg && left > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger"
                      aria-label={`Desfazer atraso de ${a.aluno} (${mmss(left)})`}
                      onClick={() => {
                        demoStore.remove(reg.id);
                        setFeedback({
                          tone: 'info',
                          title: `Atraso de ${a.aluno} desfeito`,
                          detail: 'O aviso também saiu da fila da coordenação.',
                        });
                      }}
                    >
                      Desfazer · {mmss(left)}
                    </Button>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </RegistroShell>
  );
}

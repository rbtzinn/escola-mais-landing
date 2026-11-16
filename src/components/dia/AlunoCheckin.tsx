'use client';

import clsx from 'clsx';
import { useState } from 'react';
import { Icon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Listbox } from '@/components/ui/Listbox';
import { TextField } from '@/components/ui/TextField';
import { checkinWindow, formatHora } from '@/lib/attendance/clock';
import { findByMatricula, publicName } from '@/lib/attendance/codes';
import { CHANNEL_LABEL, type RosterEntry } from '@/lib/attendance/types';
import { demoStore } from '@/lib/demoStore';

type Result = { tone: 'ok' | 'info' | 'error'; title: string; detail: string };

interface Props {
  roster: RosterEntry[];
  turmas: string[];
  now: () => Date;
  /** No celular simulado da Entrada: mostra uma matrícula de exemplo para testar. */
  demoHint?: boolean;
  idPrefix?: string;
}

/**
 * Tela que o aluno vê ao ler o QR da entrada: turma + matrícula, confirma e registra.
 * O link é público, então nunca lista alunos e mostra só primeiro nome e inicial.
 */
export function AlunoCheckin({ roster, turmas, now, demoHint = false, idPrefix = 'aluno' }: Props) {
  const [turma, setTurma] = useState('');
  const [matricula, setMatricula] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [found, setFound] = useState<RosterEntry | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [exemplo, setExemplo] = useState(0);

  const restart = () => {
    setFound(null);
    setResult(null);
    setError(null);
    setMatricula('');
  };

  const fillExample = () => {
    const registered = new Set(demoStore.get().records.map((r) => r.key));
    const pool = roster.filter((r) => !registered.has(r.key));
    const pick = pool[exemplo % Math.max(pool.length, 1)] ?? roster[0];
    if (!pick) return;
    setExemplo(exemplo + 7);
    setTurma(pick.turma);
    setMatricula(pick.matricula);
    setError(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const janela = checkinWindow(now(), demoStore.get().clock);
    if (janela !== 'aberto') {
      setResult({
        tone: 'error',
        title:
          janela === 'cedo' ? 'O registro ainda não abriu' : 'O registro pelo celular encerrou',
        detail: 'Este link só funciona perto do horário de entrada. Procure a portaria.',
      });
      return;
    }
    if (!turma) return setError('Escolha a sua turma.');
    if (!matricula.trim()) return setError('Digite a sua matrícula.');
    const entry = findByMatricula(roster, turma, matricula);
    if (!entry)
      return setError(
        'Matrícula não encontrada nesta turma. Confira o número ou procure a portaria.',
      );
    setError(null);
    setFound(entry);
  };

  const confirm = () => {
    if (!found) return;
    const r = demoStore.register({
      entry: found,
      channel: 'aluno',
      registradoPor: 'Link da entrada',
      at: now(),
    });
    const nome = publicName(found.aluno);
    if (r.status === 'novo')
      setResult({
        tone: 'ok',
        title: `Chegada registrada às ${formatHora(new Date(r.record.at))}`,
        detail: `${nome}, pode seguir para a sala. A escola avisa a sua família.`,
      });
    else if (r.status === 'duplicado')
      setResult({
        tone: 'info',
        title: 'Você já foi registrado hoje',
        detail: `Por ${CHANNEL_LABEL[r.record.channel].toLowerCase()}, às ${formatHora(new Date(r.record.at))}.`,
      });
    else
      setResult({
        tone: 'ok',
        title: 'Você chegou no horário',
        detail: `${nome}, pode entrar. Não conta como atraso.`,
      });
    setFound(null);
  };

  if (result)
    return (
      <div className="space-y-4 text-center">
        <div
          role="status"
          aria-label="Resultado do registro"
          className={clsx(
            'rounded-2xl border-2 p-5',
            result.tone === 'ok' && 'border-primary/50 bg-primary/10',
            result.tone === 'info' && 'border-accent bg-accent/20',
            result.tone === 'error' && 'border-danger/60 bg-danger/10',
          )}
        >
          <span
            className={clsx(
              'mx-auto mb-2 flex size-12 items-center justify-center rounded-full',
              result.tone === 'error' ? 'bg-danger/15 text-danger' : 'bg-primary/15 text-primary',
            )}
          >
            <Icon name={result.tone === 'error' ? 'info' : 'check'} size={26} />
          </span>
          <p className="font-display text-xl font-extrabold text-fg">{result.title}</p>
          <p className="mt-1 text-sm text-fg-muted">{result.detail}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={restart}>
          {demoHint ? 'Testar com outro aluno' : 'Voltar'}
        </Button>
      </div>
    );

  if (found)
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-fg-muted">Confira antes de registrar</p>
        <p className="font-display text-2xl font-extrabold text-fg">
          Você é {publicName(found.aluno)}?
        </p>
        <p className="text-fg-muted">Turma {found.turma}</p>
        <div className="flex flex-col gap-2">
          <Button onClick={confirm}>
            <Icon name="check" size={20} />
            Sim, registrar minha chegada
          </Button>
          <Button variant="ghost" onClick={restart}>
            Não sou eu
          </Button>
        </div>
      </div>
    );

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div>
        <p className="font-display text-xl font-extrabold text-fg">Registrar chegada</p>
        <p className="text-sm text-fg-muted">
          Chegou depois do horário? Informe sua turma e matrícula.
        </p>
      </div>
      <Listbox
        id={`${idPrefix}-turma`}
        name={`${idPrefix}-turma`}
        label="Sua turma"
        placeholder="Escolha a turma"
        options={turmas.map((t) => ({ value: t, label: t }))}
        value={turma}
        onChange={(v) => {
          setTurma(v);
          setError(null);
        }}
      />
      <TextField
        id={`${idPrefix}-matricula`}
        label="Sua matrícula"
        inputMode="numeric"
        autoComplete="off"
        value={matricula}
        onChange={(v) => {
          setMatricula(v);
          setError(null);
        }}
        error={error ?? undefined}
      />
      <Button type="submit" className="w-full">
        Continuar
      </Button>
      {demoHint && (
        <div className="rounded-xl bg-muted p-3 text-sm text-fg-muted">
          <p>Para testar, use a matrícula de um aluno da escola de exemplo.</p>
          <button
            type="button"
            onClick={fillExample}
            className="mt-1 font-semibold text-primary underline underline-offset-4"
          >
            Preencher com um aluno de exemplo
          </button>
        </div>
      )}
    </form>
  );
}

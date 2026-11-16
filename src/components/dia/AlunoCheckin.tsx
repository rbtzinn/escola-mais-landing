'use client';

import clsx from 'clsx';
import { useState } from 'react';
import { Icon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Listbox } from '@/components/ui/Listbox';
import { TextField } from '@/components/ui/TextField';
import { useDemoStore } from '@/hooks/useDemoStore';
import { checkinWindow, formatHora, formatHHMM } from '@/lib/attendance/clock';
import { sameBirthday } from '@/lib/attendance/birthday';
import { findByMatricula, publicName } from '@/lib/attendance/codes';
import type { StudentMemory } from '@/lib/attendance/remember';
import { CHANNEL_LABEL, type RosterEntry } from '@/lib/attendance/types';
import { mealWindow } from '@/lib/daily/meals';
import { demoStore } from '@/lib/demoStore';

type Result = { tone: 'ok' | 'info' | 'error'; title: string; detail: string };

interface Props {
  roster: RosterEntry[];
  turmas: string[];
  now: () => Date;
  /** No celular simulado da Entrada: mostra uma matrícula de exemplo para testar. */
  demoHint?: boolean;
  idPrefix?: string;
  /** Lembra quem já se identificou neste celular (o aniversário só é pedido na 1ª vez). */
  memory: StudentMemory;
}

function ResultBox({ result }: { result: Result }) {
  return (
    <div
      role="status"
      aria-label="Resultado do registro"
      className={clsx(
        'rounded-xl border-2 p-3 text-center',
        result.tone === 'ok' && 'border-primary/50 bg-primary/10',
        result.tone === 'info' && 'border-accent bg-accent/20',
        result.tone === 'error' && 'border-danger/60 bg-danger/10',
      )}
    >
      <p className="font-display text-lg font-semibold text-fg">{result.title}</p>
      <p className="text-sm text-fg-muted">{result.detail}</p>
    </div>
  );
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * O que o aluno vê no link do QR: identifica-se com turma + matrícula (e, na 1ª vez neste
 * celular, o dia e o mês do aniversário) e então registra a chegada atrasada e/ou responde
 * a merenda de hoje. O link é público: nunca lista alunos e mostra só primeiro nome e inicial.
 */
export function AlunoCheckin({
  roster,
  turmas,
  now,
  demoHint = false,
  idPrefix = 'aluno',
  memory,
}: Props) {
  const { meals, mealDeadline, clock } = useDemoStore();
  const [turma, setTurma] = useState('');
  const [matricula, setMatricula] = useState('');
  const [error, setError] = useState<string | null>(null);
  // Aluno lembrado por este celular: entra direto, sem pedir nada.
  const [aluno, setAluno] = useState<RosterEntry | null>(() => {
    const key = memory.get();
    return (key && roster.find((r) => r.key === key)) || null;
  });
  // Matrícula certa, esperando a confirmação do aniversário.
  const [pendente, setPendente] = useState<RosterEntry | null>(null);
  const [dia, setDia] = useState('');
  const [mes, setMes] = useState('');
  const [atraso, setAtraso] = useState<Result | null>(null);
  const [exemplo, setExemplo] = useState(0);

  const sair = () => {
    memory.set(null);
    setAluno(null);
    setPendente(null);
    setAtraso(null);
    setError(null);
    setMatricula('');
    setDia('');
    setMes('');
  };

  const login = (entry: RosterEntry) => {
    memory.set(entry.key);
    setAluno(entry);
    setPendente(null);
    setError(null);
    setDia('');
    setMes('');
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

  const entrar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!turma) return setError('Escolha a sua turma.');
    if (!matricula.trim()) return setError('Digite a sua matrícula.');
    const entry = findByMatricula(roster, turma, matricula);
    if (!entry)
      return setError(
        'Matrícula não encontrada nesta turma. Confira o número ou procure a portaria.',
      );
    setError(null);
    // Sem data de nascimento na planilha, a matrícula basta (como antes).
    if (entry.nascimento) setPendente(entry);
    else login(entry);
  };

  const confirmar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendente) return;
    if (!dia.trim() || !mes.trim()) return setError('Digite o dia e o mês.');
    if (!sameBirthday(pendente, Number(dia), Number(mes)))
      return setError('O aniversário não confere. Confira ou procure a portaria.');
    login(pendente);
  };

  if (!aluno && pendente)
    return (
      <form onSubmit={confirmar} className="space-y-4" noValidate>
        <div>
          <p className="font-display text-xl font-extrabold text-fg">Confirme que é você</p>
          <p className="text-sm text-fg-muted">
            Digite o dia e o mês do seu aniversário. Só é pedido na primeira vez neste celular.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TextField
            id={`${idPrefix}-dia`}
            label="Dia"
            inputMode="numeric"
            autoComplete="off"
            maxLength={2}
            placeholder="15"
            value={dia}
            onChange={(v) => {
              setDia(v.replace(/\D/g, ''));
              setError(null);
            }}
          />
          <TextField
            id={`${idPrefix}-mes`}
            label="Mês"
            inputMode="numeric"
            autoComplete="off"
            maxLength={2}
            placeholder="03"
            value={mes}
            onChange={(v) => {
              setMes(v.replace(/\D/g, ''));
              setError(null);
            }}
          />
        </div>
        {error && (
          <p role="alert" className="text-sm font-semibold text-danger">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">
            Confirmar
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setPendente(null);
              setError(null);
            }}
          >
            Voltar
          </Button>
        </div>
        {demoHint && pendente.nascimento && (
          <div className="rounded-xl bg-muted p-3 text-sm text-fg-muted">
            <p>
              Aniversário deste aluno de exemplo: {pad2(pendente.nascimento.dia)}/
              {pad2(pendente.nascimento.mes)}.
            </p>
            <button
              type="button"
              onClick={() => {
                setDia(pad2(pendente.nascimento!.dia));
                setMes(pad2(pendente.nascimento!.mes));
                setError(null);
              }}
              className="mt-1 font-semibold text-primary underline underline-offset-4"
            >
              Preencher
            </button>
          </div>
        )}
      </form>
    );

  if (!aluno)
    return (
      <form onSubmit={entrar} className="space-y-4" noValidate>
        <div>
          <p className="font-display text-xl font-semibold text-fg">Olá! Quem é você?</p>
          <p className="text-sm text-fg-muted">
            Informe sua turma e matrícula para registrar a chegada ou responder a merenda.
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
        <p className="text-center text-sm text-fg-muted">
          Não sabe a matrícula? Pergunte na portaria.
        </p>
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

  const nome = publicName(aluno.aluno);
  const resposta = meals[aluno.key];
  const merendaAberta = mealWindow(now(), mealDeadline) === 'aberto';

  const registrarAtraso = () => {
    const janela = checkinWindow(now(), clock);
    if (janela !== 'aberto')
      return setAtraso({
        tone: 'error',
        title:
          janela === 'cedo' ? 'O registro ainda não abriu' : 'O registro pelo celular encerrou',
        detail: 'Este link só registra chegada perto do horário de entrada. Procure a portaria.',
      });
    const r = demoStore.register({
      entry: aluno,
      channel: 'aluno',
      registradoPor: 'Link da entrada',
      at: now(),
    });
    if (r.status === 'novo')
      setAtraso({
        tone: 'ok',
        title: `Chegada registrada às ${formatHora(new Date(r.record.at))}`,
        detail: 'Pode seguir para a sala. A escola avisa a sua família.',
      });
    else if (r.status === 'duplicado')
      setAtraso({
        tone: 'info',
        title: 'Você já foi registrado hoje',
        detail: `Por ${CHANNEL_LABEL[r.record.channel].toLowerCase()}, às ${formatHora(new Date(r.record.at))}.`,
      });
    else
      setAtraso({
        tone: 'ok',
        title: 'Você chegou no horário',
        detail: 'Pode entrar. Não conta como atraso.',
      });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-xl font-semibold text-fg">Olá, {nome}!</p>
          <p className="text-sm text-fg-muted">Turma {aluno.turma}</p>
          <p className="text-xs text-fg-muted">Este celular lembra de você.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={sair}>
          {demoHint ? 'Trocar aluno' : 'Não sou eu'}
        </Button>
      </div>

      <section
        aria-labelledby={`${idPrefix}-atraso`}
        className="space-y-2 rounded-2xl border border-border bg-surface p-3"
      >
        <h3 id={`${idPrefix}-atraso`} className="flex items-center gap-2 font-semibold text-fg">
          <Icon name="clock" size={18} className="text-primary" />
          Chegou depois do horário?
        </h3>
        {atraso ? (
          <ResultBox result={atraso} />
        ) : (
          <Button variant="secondary" size="sm" className="w-full" onClick={registrarAtraso}>
            Registrar minha chegada
          </Button>
        )}
      </section>

      <section
        aria-labelledby={`${idPrefix}-merenda`}
        className="space-y-2 rounded-2xl border border-border bg-surface p-3"
      >
        <h3 id={`${idPrefix}-merenda`} className="flex items-center gap-2 font-semibold text-fg">
          <Icon name="utensils" size={18} className="text-primary" />
          Merenda de hoje
        </h3>
        {merendaAberta ? (
          <>
            <div
              role="group"
              aria-label="Você vai comer a merenda hoje?"
              className="grid grid-cols-2 gap-2"
            >
              {[
                { vai: true, label: 'Vou comer' },
                { vai: false, label: 'Não vou comer' },
              ].map((o) => (
                <button
                  key={o.label}
                  type="button"
                  aria-pressed={resposta === o.vai}
                  onClick={() => demoStore.setMeal(aluno.key, o.vai, now())}
                  className={clsx(
                    'min-h-11 rounded-md border px-3 text-sm font-semibold transition-colors',
                    resposta === o.vai
                      ? 'border-primary bg-primary text-on-primary'
                      : 'border-border bg-surface text-fg hover:border-primary',
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-fg-muted">
              {resposta === undefined
                ? `Responda até ${formatHHMM(mealDeadline)}. Sem resposta, a cozinha conta você.`
                : `Resposta salva. Dá para mudar até ${formatHHMM(mealDeadline)}.`}
            </p>
          </>
        ) : (
          <p className="text-sm text-fg-muted">
            O prazo da merenda encerrou às {formatHHMM(mealDeadline)}.{' '}
            {resposta === undefined
              ? 'Você está na conta da cozinha.'
              : resposta
                ? 'Você respondeu que vai comer.'
                : 'Você respondeu que não vai comer.'}
          </p>
        )}
      </section>
    </div>
  );
}

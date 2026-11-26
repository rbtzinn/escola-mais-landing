import clsx from 'clsx';
import { useState } from 'react';
import { replyMessage } from '@/lib/adminApi';
import { hideCpf, isValidCpf, maskCpf } from '@/lib/cpf';
import { maskDate, parseDate } from '@/lib/masks';
import type { Exception, Run } from './types';
import { Button, Card, ConfirmButton, Notice, TextField, plusDays } from './ui';

const dayKey = (s: string) => {
  const d = parseDate(s);
  return d ? d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate() : 0;
};

export function exceptionState(e: Exception, hoje: string): 'Usada' | 'Vencida' | 'Ativa' {
  if (e.usadaEm) return 'Usada';
  if (e.validade && dayKey(e.validade) < dayKey(hoje)) return 'Vencida';
  return 'Ativa';
}

export function Exceptions({ list, hoje, run }: { list: Exception[]; hoje: string; run: Run }) {
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [nasc, setNasc] = useState('');
  const [validade, setValidade] = useState(plusDays(2));
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const errors = {
    cpf: !isValidCpf(cpf) ? 'CPF inválido.' : undefined,
    nasc: !parseDate(nasc) ? 'Data inválida.' : undefined,
    validade: !parseDate(validade)
      ? 'Data inválida.'
      : dayKey(validade) < dayKey(hoje)
        ? 'Tem que ser hoje ou depois.'
        : undefined,
  };
  const show = (k: keyof typeof errors) => (tried ? errors[k] : undefined);

  const create = async () => {
    setTried(true);
    if (Object.values(errors).some(Boolean)) return;
    setBusy(true);
    setMsg(null);
    const r = await run('excecao_add', {
      nome: nome.trim(),
      cpf,
      nascimento: nasc,
      validade,
      periodo: true,
    });
    setBusy(false);
    if (r.status === 'ok') {
      setMsg({
        tone: 'ok',
        text: `Exceção criada para ${nome.trim() || hideCpf(cpf)}. Avise o aluno para enviar até ${validade}.`,
      });
      setNome('');
      setCpf('');
      setNasc('');
      setTried(false);
    } else setMsg({ tone: 'error', text: replyMessage(r) });
  };

  const sorted = [...list].sort(
    (a, b) =>
      Number(exceptionState(a, hoje) !== 'Ativa') - Number(exceptionState(b, hoje) !== 'Ativa'),
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Card title="Nova exceção">
        <p className="mb-4 text-fg-muted">
          Libera um aluno específico a se matricular fora do período, uma vez só, até o prazo.
        </p>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (!busy) void create();
          }}
          className="space-y-4"
        >
          <TextField
            id="exc-nome"
            label="Nome do aluno (opcional)"
            value={nome}
            onChange={setNome}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="exc-cpf"
              label="CPF do aluno"
              value={cpf}
              onChange={(v) => setCpf(maskCpf(v))}
              inputMode="numeric"
              error={show('cpf')}
            />
            <TextField
              id="exc-nasc"
              label="Data de nascimento"
              value={nasc}
              onChange={(v) => setNasc(maskDate(v))}
              inputMode="numeric"
              placeholder="dd/mm/aaaa"
              error={show('nasc')}
            />
          </div>
          <TextField
            id="exc-validade"
            label="Vale até"
            value={validade}
            onChange={(v) => setValidade(maskDate(v))}
            inputMode="numeric"
            placeholder="dd/mm/aaaa"
            error={show('validade')}
          />
          <Notice tone={msg?.tone}>{msg?.text}</Notice>
          <Button type="submit" disabled={busy} icon="plus">
            {busy ? 'Criando…' : 'Criar exceção'}
          </Button>
        </form>
      </Card>

      <Card title={`Exceções (${list.length})`}>
        {sorted.length === 0 ? (
          <p className="text-fg-muted">Nenhuma exceção criada.</p>
        ) : (
          <ul className="space-y-3">
            {sorted.map((e) => {
              const state = exceptionState(e, hoje);
              return (
                <li
                  key={`${e.linha}-${e.cpf}`}
                  className={clsx(
                    'rounded-xl border-2 p-3',
                    state === 'Ativa' ? 'border-primary/40' : 'border-fg/10 opacity-80',
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">{e.nome || hideCpf(e.cpf)}</span>
                    <span
                      className={clsx(
                        'rounded-full px-2.5 py-0.5 text-sm font-bold',
                        state === 'Ativa' ? 'bg-primary text-on-primary' : 'bg-fg/15 text-fg-muted',
                      )}
                    >
                      {state}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-fg-muted">
                    CPF {hideCpf(e.cpf)} · nasc. {e.nasc} · até {e.validade}
                    {e.criadaPor && ` · criada por ${e.criadaPor}`}
                    {e.usadaEm && ` · usada em ${e.usadaEm}`}
                  </p>
                  {state === 'Ativa' && (
                    <div className="mt-2">
                      <ConfirmButton
                        label="Remover"
                        confirm="Remover esta exceção?"
                        onConfirm={() =>
                          void run('excecao_remover', { linha: e.linha, cpf: e.cpf })
                        }
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

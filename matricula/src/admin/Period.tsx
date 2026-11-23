import { useState } from 'react';
import { TextField } from '@/components/ui/TextField';
import { replyMessage } from '@/lib/adminApi';
import { maskDate, parseDate } from '@/lib/masks';
import type { Run } from './types';
import { Button, Card, Notice } from './ui';

const key = (s: string) => {
  const d = parseDate(s);
  return d ? d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate() : null;
};

/** Situação de hoje em relação ao período salvo. */
export function periodState(hoje: string, inicio: string, fim: string): string {
  const h = key(hoje);
  const a = key(inicio);
  const b = key(fim);
  if (h && a && h < a) return `Ainda não abriu: abre em ${inicio}.`;
  if (h && b && h > b) return `Encerrado: terminou em ${fim}.`;
  if (!a && !b) return 'Aberto, sem datas (o formulário aceita matrículas sempre).';
  return `Aberto${b ? ` até ${fim}` : ''}.`;
}

export function Period({
  periodo,
  hoje,
  run,
}: {
  periodo: { inicio: string; fim: string };
  hoje: string;
  run: Run;
}) {
  const [inicio, setInicio] = useState(periodo.inicio);
  const [fim, setFim] = useState(periodo.fim);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const errInicio = inicio && !parseDate(inicio) ? 'Data inválida.' : undefined;
  const errFim =
    fim && !parseDate(fim)
      ? 'Data inválida.'
      : fim && inicio && key(fim)! < key(inicio)!
        ? 'O fim é antes do início.'
        : undefined;

  const save = async (a: string, b: string) => {
    if (errInicio || errFim) return;
    setBusy(true);
    setMsg(null);
    const r = await run('periodo', { inicio: a, fim: b });
    setBusy(false);
    setMsg(
      r.status === 'ok'
        ? { tone: 'ok', text: 'Período salvo. O formulário já segue essas datas.' }
        : { tone: 'error', text: replyMessage(r) },
    );
  };

  return (
    <Card title="Período da matrícula">
      <p className="mb-4 rounded-xl bg-muted px-4 py-3 font-semibold">
        Hoje ({hoje}): {periodState(hoje, periodo.inicio, periodo.fim)}
      </p>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void save(inicio, fim);
        }}
        className="space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            id="inicio"
            label="Início"
            value={inicio}
            onChange={(v) => setInicio(maskDate(v))}
            inputMode="numeric"
            placeholder="dd/mm/aaaa"
            error={errInicio}
            hint="Em branco: sem data de início."
          />
          <TextField
            id="fim"
            label="Fim"
            value={fim}
            onChange={(v) => setFim(maskDate(v))}
            inputMode="numeric"
            placeholder="dd/mm/aaaa"
            error={errFim}
            hint="O último dia ainda vale."
          />
        </div>
        <Notice tone={msg?.tone}>{msg?.text}</Notice>
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={busy} icon="calendar">
            {busy ? 'Salvando…' : 'Salvar período'}
          </Button>
          <Button
            variant="ghost"
            disabled={busy || (!periodo.inicio && !periodo.fim)}
            onClick={() => {
              setInicio('');
              setFim('');
              void save('', '');
            }}
          >
            Tirar as datas
          </Button>
        </div>
      </form>
      <p className="mt-4 text-sm text-fg-muted">
        Para liberar um aluno fora do período, use a aba Exceções.
      </p>
    </Card>
  );
}

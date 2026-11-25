import clsx from 'clsx';
import { useState } from 'react';
import { FieldLabel, fieldClasses } from '@/components/ui/Field';
import { TextField } from '@/components/ui/TextField';
import { replyMessage } from '@/lib/adminApi';
import { parseAprovados } from '@/lib/adminData';
import { hideCpf, onlyDigits } from '@/lib/cpf';
import { normalizeText } from '@/lib/text';
import type { PanelData, Run } from './types';
import { Button, Card, ConfirmButton, Notice } from './ui';

export function Approved({ list, run }: { list: NonNullable<PanelData['aprovados']>; run: Run }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [busca, setBusca] = useState('');
  const parsed = parseAprovados(text);

  const save = async () => {
    if (!parsed.ok.length) return;
    setBusy(true);
    setMsg(null);
    const r = await run('aprovados_add', { linhas: parsed.ok });
    setBusy(false);
    if (r.status === 'ok') {
      setMsg({
        tone: 'ok',
        text: `${Number(r.adicionados)} adicionado(s), ${Number(r.atualizados)} atualizado(s).`,
      });
      setText('');
    } else setMsg({ tone: 'error', text: replyMessage(r) });
  };

  const q = normalizeText(busca.trim());
  const d = onlyDigits(busca);
  const found = list.filter(
    (a) => !q || normalizeText(a.nome).includes(q) || (d.length >= 3 && a.cpf.includes(d)),
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Card title="Adicionar aprovados">
        <p className="mb-3 text-fg-muted">
          Copie da planilha e cole aqui, uma pessoa por linha:{' '}
          <strong>CPF, data de nascimento</strong> e, se quiser, nome, modalidade e curso. Se a
          primeira linha tiver os títulos (CPF, Nascimento…), a ordem das colunas pode ser qualquer
          uma. CPF que já está na lista é atualizado.
        </p>
        <p className="mb-3 text-fg-muted">
          A lista é opcional e não bloqueia ninguém: cada matrícula ganha <strong>Sim</strong>,{' '}
          <strong>Não</strong> ou <strong>Sim, curso diferente</strong> na coluna “Lista de
          aprovados” da planilha.
        </p>
        <FieldLabel id="colar">Lista</FieldLabel>
        <textarea
          id="colar"
          rows={7}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'529.982.247-25\t15/03/2010\tAna Souza\tIntegrado\tFarmácia'}
          className={clsx(fieldClasses(false), 'font-mono text-sm')}
        />
        {text.trim() && (
          <div className="mt-3 space-y-2 text-sm" role="status">
            <p className="font-semibold text-ok">{parsed.ok.length} pronto(s) para salvar.</p>
            {parsed.bad.length > 0 && (
              <div className="rounded-xl border-2 border-danger/40 bg-danger/10 p-3">
                <p className="font-semibold">{parsed.bad.length} linha(s) recusada(s):</p>
                <ul className="mt-1 list-disc pl-5">
                  {parsed.bad.slice(0, 8).map((b) => (
                    <li key={b.linha}>
                      Linha {b.linha}: {b.motivo}
                    </li>
                  ))}
                  {parsed.bad.length > 8 && <li>… e mais {parsed.bad.length - 8}.</li>}
                </ul>
              </div>
            )}
          </div>
        )}
        <div className="mt-4 space-y-3">
          <Notice tone={msg?.tone}>{msg?.text}</Notice>
          <Button onClick={() => void save()} disabled={busy || parsed.ok.length === 0} icon="plus">
            {busy ? 'Salvando…' : `Salvar ${parsed.ok.length || ''} aprovado(s)`}
          </Button>
        </div>
      </Card>

      <Card title={`Aprovados (${list.length})`}>
        {list.length === 0 ? (
          <p className="text-fg-muted">
            Nenhum aprovado cadastrado: as matrículas entram com “Sem lista”.
          </p>
        ) : (
          <>
            <TextField
              id="busca-aprovado"
              label="Buscar"
              type="search"
              value={busca}
              onChange={setBusca}
              placeholder="Nome ou CPF"
            />
            <ul className="mt-3 divide-y divide-fg/10">
              {found.slice(0, 50).map((a) => (
                <li
                  key={a.cpf}
                  className="flex flex-wrap items-center justify-between gap-2 py-2.5"
                >
                  <span className="min-w-0">
                    <span className="block font-semibold">{a.nome || hideCpf(a.cpf)}</span>
                    <span className="text-sm text-fg-muted">
                      {hideCpf(a.cpf)} · {a.nasc}
                      {(a.modalidade || a.curso) &&
                        ` · ${[a.modalidade, a.curso].filter(Boolean).join(' · ')}`}
                    </span>
                  </span>
                  <ConfirmButton
                    label="Tirar"
                    confirm="Tirar da lista?"
                    onConfirm={() => void run('aprovados_remover', { cpf: a.cpf })}
                  />
                </li>
              ))}
            </ul>
            {found.length > 50 && (
              <p className="mt-2 text-sm text-fg-muted">
                Mostrando 50 de {found.length}. Use a busca.
              </p>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

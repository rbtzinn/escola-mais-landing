'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useDemoStore } from '@/hooks/useDemoStore';
import { formatHora } from '@/lib/attendance/clock';
import { undoSecondsLeft } from '@/lib/attendance/records';
import { CHANNEL_LABEL, type LateRecord } from '@/lib/attendance/types';
import { demoStore } from '@/lib/demoStore';
import { useRegistro } from './useRegistro';

type Marca = 'P' | 'F' | 'A';

const MARCAS: { id: Marca; nome: string; on: string }[] = [
  { id: 'P', nome: 'Presente', on: 'border-primary bg-primary text-on-primary' },
  { id: 'F', nome: 'Falta', on: 'border-danger bg-danger/15 text-danger' },
  { id: 'A', nome: 'Atraso', on: 'border-accent bg-accent text-on-accent' },
];

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

type Aviso = { titulo: string; detalhe: string; proxima: string | null };

/**
 * Chamada no celular do professor, como no diário de papel: cada aluno começa em P;
 * toque F (falta) ou A (atraso) e salve. Um atraso marcado pelo professor pode ser
 * desfeito por 5 minutos; atrasos de outras telas (portaria, QR) aparecem travados.
 */
export function ChamadaView() {
  const { roster, records, turmas, now, chamadas } = useRegistro();
  const { professorNome } = useDemoStore();
  const [turmaSel, setTurmaSel] = useState('');
  const [rascunho, setRascunho] = useState<Record<string, Record<string, Marca>>>({});
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [nome, setNome] = useState('');
  // Relógio real para o "desfazer" de 5 minutos.
  const [agora, setAgora] = useState(() => new Date());

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  const turma = turmaSel || turmas[0] || '';
  const salva = chamadas[turma];
  const atrasos = new Map(records.map((r) => [r.key, r]));
  const alunos = roster
    .filter((r) => r.turma === turma)
    .sort((a, b) => a.aluno.localeCompare(b.aluno, 'pt-BR'));

  // Estado salvo de cada aluno: atraso registrado > falta da chamada > presente.
  const salvo = (key: string): Marca =>
    atrasos.has(key) ? 'A' : salva?.ausentes.includes(key) ? 'F' : 'P';
  const marca = (key: string): Marca => rascunho[turma]?.[key] ?? salvo(key);
  /** Atraso que não pode mais ser trocado nesta tela. */
  const travado = (r: LateRecord | undefined) =>
    r !== undefined && (r.channel !== 'professor' || undoSecondsLeft(r, agora) === 0);

  const desfazendo = records.filter(
    (r) => r.channel === 'professor' && undoSecondsLeft(r, agora) > 0,
  ).length;
  useEffect(() => {
    if (desfazendo === 0) return;
    const t = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(t);
  }, [desfazendo]);

  const contagem = { P: 0, F: 0, A: 0 };
  for (const a of alunos) contagem[marca(a.key)]++;
  const alterada = alunos.some((a) => marca(a.key) !== salvo(a.key));

  const marcar = (key: string, m: Marca) => {
    setAviso(null);
    setRascunho({ ...rascunho, [turma]: { ...rascunho[turma], [key]: m } });
  };

  const salvar = () => {
    const por = professorNome ?? 'Professor(a)';
    let noHorario = 0;
    for (const a of alunos) {
      const m = marca(a.key);
      const r = atrasos.get(a.key);
      if (m === 'A' && !r) {
        const res = demoStore.register({
          entry: a,
          channel: 'professor',
          registradoPor: por,
          at: now(),
        });
        if (res.status === 'no-horario') noHorario++;
      }
      if (m !== 'A' && r && !travado(r)) demoStore.remove(r.id);
    }
    demoStore.saveChamada({
      turma,
      ausentes: alunos.filter((a) => marca(a.key) === 'F').map((a) => a.key),
      por,
      em: now().toISOString(),
    });
    setRascunho(Object.fromEntries(Object.entries(rascunho).filter(([t]) => t !== turma)));
    setAgora(new Date());

    const feitas = new Set([...Object.keys(chamadas), turma]);
    const i = turmas.indexOf(turma);
    const proxima =
      [...turmas.slice(i + 1), ...turmas.slice(0, i)].find((t) => !feitas.has(t)) ?? null;
    const p = contagem.P + noHorario;
    const at = contagem.A - noHorario;
    setAviso({
      titulo: `Chamada do ${turma} salva`,
      detalhe:
        `${p} ${p === 1 ? 'presente' : 'presentes'}, ${contagem.F} ${contagem.F === 1 ? 'falta' : 'faltas'}, ${at} ${at === 1 ? 'atraso' : 'atrasos'}.` +
        (noHorario ? ` ${noHorario} chegou dentro da tolerância e ficou como presente.` : ''),
      proxima,
    });
  };

  const trocarTurma = (t: string) => {
    setTurmaSel(t);
    setAviso(null);
    window.scrollTo({ top: 0 });
  };

  // Primeira vez: pergunta o nome (fica guardado só nesta aba).
  if (!professorNome)
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-4 px-4 py-8">
        <Link href="/demo/dia" className="text-sm font-semibold text-primary">
          ← Hoje na escola
        </Link>
        <form
          className="space-y-4 rounded-3xl border border-border bg-surface p-5 shadow-card"
          onSubmit={(e) => {
            e.preventDefault();
            demoStore.setProfessorNome(nome || 'Professor(a)');
          }}
        >
          <div>
            <h1 className="font-display text-2xl font-extrabold">Chamada</h1>
            <p className="text-fg-muted">Como você quer aparecer nos registros?</p>
          </div>
          <TextField
            id="chamada-nome"
            label="Seu nome"
            placeholder="Ex.: Prof. Rita"
            value={nome}
            onChange={setNome}
            autoComplete="name"
          />
          <Button type="submit" className="w-full">
            Começar a chamada
          </Button>
        </form>
      </div>
    );

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-bg px-4 pt-3 pb-2">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/demo/dia"
            aria-label="Voltar para Hoje na escola"
            className="-ml-2 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-muted"
          >
            <Icon name="arrow" size={20} className="rotate-180" />
          </Link>
          <h1 className="min-w-0 flex-1 font-display text-xl font-extrabold">
            Chamada <span className="font-semibold text-fg-muted">· {formatHora(now())}</span>
          </h1>
          <button
            type="button"
            onClick={() => {
              setNome(professorNome);
              demoStore.setProfessorNome(null);
            }}
            className="max-w-44 truncate rounded-full px-3 py-1.5 text-sm font-semibold text-fg-muted hover:bg-muted"
            aria-label={`${professorNome}, trocar nome`}
          >
            {professorNome} · trocar
          </button>
        </div>

        <div
          role="tablist"
          aria-label="Turma"
          className="-mx-4 mt-2 flex [scrollbar-width:none] gap-1.5 overflow-x-auto px-4 pb-1"
        >
          {turmas.map((t) => {
            const on = t === turma;
            const feita = Boolean(chamadas[t]);
            return (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => trocarTurma(t)}
                className={clsx(
                  'inline-flex min-h-10 shrink-0 items-center gap-1 rounded-full border px-3.5 text-sm font-semibold transition-colors',
                  on
                    ? 'border-primary bg-primary text-on-primary'
                    : 'border-border bg-surface text-fg hover:border-primary',
                )}
              >
                {feita && <Icon name="check" size={14} />}
                {t}
                {feita && <span className="sr-only"> (chamada feita)</span>}
              </button>
            );
          })}
        </div>

        <p className="mt-1.5 flex gap-3 text-sm font-semibold" aria-live="polite">
          <span className="text-primary">{plural(contagem.P, 'presente', 'presentes')}</span>
          <span className={contagem.F ? 'text-danger' : 'text-fg-muted'}>
            {plural(contagem.F, 'falta', 'faltas')}
          </span>
          <span className={contagem.A ? 'text-fg' : 'text-fg-muted'}>
            {plural(contagem.A, 'atraso', 'atrasos')}
          </span>
        </p>
      </header>

      <div className="flex-1 px-4 pt-2 pb-28">
        {aviso && (
          <div
            role="status"
            aria-label="Resultado do registro"
            className="my-2 rounded-2xl border-2 border-primary/50 bg-primary/10 p-3"
          >
            <p className="font-display text-lg font-extrabold">{aviso.titulo}</p>
            <p className="text-sm text-fg-muted">{aviso.detalhe}</p>
            {aviso.proxima ? (
              <Button size="sm" className="mt-2" onClick={() => trocarTurma(aviso.proxima!)}>
                Ir para {aviso.proxima}
                <Icon name="arrow" size={16} />
              </Button>
            ) : (
              <p className="mt-1 text-sm font-semibold text-primary">
                Todas as turmas estão com a chamada feita.
              </p>
            )}
          </div>
        )}

        <ol aria-label={`Alunos da turma ${turma}`} className="divide-y divide-border">
          {alunos.map((a, i) => {
            const m = marca(a.key);
            const r = atrasos.get(a.key);
            const preso = travado(r);
            const left = r && r.channel === 'professor' ? undoSecondsLeft(r, agora) : 0;
            return (
              <li key={a.key} className="flex items-center gap-3 py-2">
                <span className="w-6 shrink-0 text-right text-sm text-fg-muted tabular-nums">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{a.aluno}</span>
                  {r && (
                    <span className="block truncate text-xs text-fg-muted">
                      {r.channel === 'professor'
                        ? left > 0
                          ? `Atraso às ${formatHora(new Date(r.at))} · dá para trocar por ${mmss(left)}`
                          : `Atraso às ${formatHora(new Date(r.at))} · para corrigir, fale com a coordenação`
                        : `Chegou às ${formatHora(new Date(r.at))} · ${CHANNEL_LABEL[r.channel].toLowerCase()}`}
                    </span>
                  )}
                </span>
                <span role="group" aria-label={a.aluno} className="flex shrink-0 gap-1">
                  {MARCAS.map((o) => {
                    const on = m === o.id;
                    return (
                      <button
                        key={o.id}
                        type="button"
                        aria-pressed={on}
                        aria-label={o.nome}
                        disabled={preso && !on}
                        onClick={() => marcar(a.key, o.id)}
                        className={clsx(
                          'size-11 rounded-xl border-2 text-base font-extrabold transition-colors disabled:opacity-30',
                          on
                            ? o.on
                            : 'border-border bg-surface text-fg-muted hover:border-fg-muted',
                        )}
                      >
                        {o.id}
                      </button>
                    );
                  })}
                </span>
              </li>
            );
          })}
        </ol>
        <p className="mt-3 text-xs text-fg-muted">
          P = presente, F = falta, A = atraso. Todos começam em P. Atrasos registrados pela portaria
          ou pelo QR já aparecem marcados.
        </p>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <p className="min-w-0 flex-1 text-xs text-fg-muted">
            {salva && !alterada
              ? `Salva às ${formatHora(new Date(salva.em))} por ${salva.por}`
              : alterada && salva
                ? 'Alterações não salvas'
                : 'Chamada ainda não salva'}
          </p>
          <Button onClick={salvar} disabled={Boolean(salva) && !alterada} className="shrink-0">
            <Icon name="check" size={20} />
            {salva && !alterada ? 'Salva' : `Salvar ${turma}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

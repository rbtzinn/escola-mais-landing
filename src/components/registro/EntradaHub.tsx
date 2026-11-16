'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Icon, type IconName } from '@/components/icons';
import { Button, buttonClasses } from '@/components/ui/Button';
import { AlunoCheckin } from './AlunoCheckin';
import { QrCode } from './QrCode';
import { RegistroShell } from './RegistroShell';
import { useRegistro } from './useRegistro';

const ALUNO_PATH = '/demo/registro/aluno';

const STAFF: { href: string; icon: IconName; title: string; text: string }[] = [
  {
    href: '/demo/registro/portaria',
    icon: 'school',
    title: 'Portaria',
    text: 'Link aberto no celular do porteiro: registra pelo nome quem não conseguiu ler o QR.',
  },
  {
    href: '/demo/registro/professor',
    icon: 'users',
    title: 'Professor(a)',
    text: 'Marca quem entrou atrasado na chamada; dá para desfazer por 5 minutos.',
  },
  {
    href: '/demo/registro/coordenacao',
    icon: 'inbox',
    title: 'Coordenação',
    text: 'Corrige os registros, envia os avisos às famílias e vê os reincidentes.',
  },
];

// O endereço completo do link só existe no navegador (no servidor, usa o caminho).
const subscribeNoop = () => () => {};
const useOrigin = () =>
  useSyncExternalStore(
    subscribeNoop,
    () => window.location.origin,
    () => '',
  );

/** Cartaz para imprimir e colar na entrada. */
function Poster({ url }: { url: string }) {
  return (
    <div className="qr-light rounded-3xl border border-border bg-surface p-6 text-center text-fg">
      <p className="text-sm font-bold tracking-[0.14em] text-fg-muted uppercase">Escola+</p>
      <p className="mt-1 font-display text-2xl font-extrabold">Chegou atrasado?</p>
      <p className="text-fg-muted">Leia o QR com a câmera do celular e registre sua chegada.</p>
      <QrCode
        value={url}
        label="QR para registrar a chegada atrasada"
        className="mx-auto my-4 size-56 max-w-full"
      />
      <p className="text-sm text-fg-muted">Sem celular ou sem internet? Fale com a portaria.</p>
    </div>
  );
}

/** Entrada da escola: o QR que o aluno lê, o celular do aluno simulado e as telas da equipe. */
export function EntradaHub() {
  const { roster, turmas, now } = useRegistro();
  const origin = useOrigin();
  const url = `${origin}${ALUNO_PATH}`;

  return (
    <RegistroShell
      hub
      title="Registro de atrasos"
      subtitle="Um QR na entrada para o aluno e uma tela para cada pessoa da equipe, tudo no mesmo lugar."
    >
      <p className="mb-6 flex items-start gap-2 rounded-xl border border-border bg-muted p-3 text-sm text-fg-muted">
        <Icon name="info" size={18} className="mt-0.5 shrink-0 text-primary" />
        Demonstração sem servidor: os registros ficam só nesta aba e somem ao recarregar. Por isso o
        celular do aluno aparece simulado aqui ao lado; num celular de verdade o link abre, mas não
        conversa com esta tela.
      </p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        <section aria-labelledby="qr-titulo" className="space-y-3">
          <h2 id="qr-titulo" className="font-display text-xl font-bold">
            1. O QR da entrada
          </h2>
          <p className="text-fg-muted">
            Imprima e cole na entrada. O aluno atrasado lê com a câmera do próprio celular, abre o
            link e informa a turma e a matrícula. O link só aceita registros perto do horário de
            entrada.
          </p>
          <Poster url={url} />
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => window.print()}>
              <Icon name="file" size={18} />
              Imprimir cartaz
            </Button>
            <Link href={ALUNO_PATH} className={buttonClasses('ghost', undefined, 'sm')}>
              Abrir o link do aluno
            </Link>
          </div>
        </section>

        <section aria-labelledby="celular-titulo" className="space-y-3">
          <h2 id="celular-titulo" className="font-display text-xl font-bold">
            2. O celular do aluno (simulado)
          </h2>
          <p className="text-fg-muted">É o que abre ao ler o QR. Teste aqui:</p>
          <div className="mx-auto w-full max-w-sm rounded-[2.5rem] border-[10px] border-fg bg-fg p-0 shadow-card">
            <div className="flex justify-center bg-fg pb-2" aria-hidden="true">
              <span className="h-1.5 w-20 rounded-full bg-bg/30" />
            </div>
            <div className="min-h-[30rem] rounded-[1.75rem] bg-bg p-4">
              <AlunoCheckin
                roster={roster}
                turmas={turmas}
                now={now}
                demoHint
                idPrefix="simulado"
              />
            </div>
          </div>
        </section>
      </div>

      <section aria-labelledby="equipe-titulo" className="mt-10">
        <h2 id="equipe-titulo" className="mb-3 font-display text-xl font-bold">
          3. As telas da equipe
        </h2>
        <ul className="grid gap-3 md:grid-cols-3">
          {STAFF.map((s) => (
            <li key={s.href}>
              <Link
                href={s.href}
                className="flex h-full items-start gap-3 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-primary hover:bg-muted"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon name={s.icon} size={22} />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1 font-semibold">
                    {s.title}
                    <Icon name="arrow" size={16} className="text-fg-muted" />
                  </span>
                  <span className="block text-sm text-fg-muted">{s.text}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {origin &&
        createPortal(
          <div className="print-only p-10" aria-hidden="true">
            <Poster url={url} />
          </div>,
          document.body,
        )}
    </RegistroShell>
  );
}

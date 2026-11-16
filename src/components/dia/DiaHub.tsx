'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Icon, type IconName } from '@/components/icons';
import { Button, buttonClasses } from '@/components/ui/Button';
import { AlunoCheckin } from './AlunoCheckin';
import { QrCode } from './QrCode';
import { RegistroShell } from './RegistroShell';
import { TodayStats } from './TodayStats';
import { useRegistro } from './useRegistro';

const ALUNO_PATH = '/demo/dia/aluno';

const STAFF: { href: string; icon: IconName; title: string; text: string }[] = [
  {
    href: '/demo/dia/chamada',
    icon: 'users',
    title: 'Chamada (professor)',
    text: 'Marca só quem faltou e quem entrou atrasado. Gera a contagem do dia.',
  },
  {
    href: '/demo/dia/portaria',
    icon: 'school',
    title: 'Portaria',
    text: 'Registra pelo nome quem não conseguiu ler o QR (sem celular ou internet).',
  },
  {
    href: '/demo/dia/merenda',
    icon: 'utensils',
    title: 'Merenda (cozinha)',
    text: 'Quantas refeições preparar, por turma, com as respostas dos alunos.',
  },
  {
    href: '/demo/dia/horario',
    icon: 'calendar',
    title: 'Horário do dia',
    text: 'Professor faltou? Adianta as aulas e mostra quem está livre para cobrir.',
  },
  {
    href: '/demo/dia/coordenacao',
    icon: 'inbox',
    title: 'Coordenação',
    text: 'Corrige os atrasos, avisa as famílias e vê os reincidentes.',
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
    <div className="qr-light border border-fg bg-surface p-6 text-center text-fg">
      <p className="eyebrow text-fg-muted">Escola+</p>
      <p className="mt-1 font-display text-3xl font-medium">Chegou atrasado?</p>
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
export function DiaHub() {
  const { roster, turmas, now } = useRegistro();
  const origin = useOrigin();
  const url = `${origin}${ALUNO_PATH}`;

  return (
    <RegistroShell
      hub
      title="Hoje na escola"
      subtitle="Presença, atrasos, merenda e horário do dia, cada pessoa na sua tela e tudo no mesmo lugar."
    >
      <div className="mb-8">
        <TodayStats />
      </div>

      <p className="mb-8 flex items-start gap-2 border-l-2 border-primary bg-muted p-3 text-sm text-fg-muted">
        <Icon name="info" size={18} className="mt-0.5 shrink-0 text-primary" />
        Demonstração sem servidor: os registros ficam só nesta aba e somem ao recarregar. Por isso o
        celular do aluno aparece simulado aqui ao lado; num celular de verdade o link abre, mas não
        conversa com esta tela.
      </p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        <section aria-labelledby="qr-titulo" className="space-y-3">
          <h2 id="qr-titulo" className="font-display text-2xl font-medium">
            1. O QR da entrada
          </h2>
          <p className="text-fg-muted">
            Imprima e cole na entrada. O aluno lê com a câmera do próprio celular, informa turma e
            matrícula e então registra a chegada atrasada (só perto do horário de entrada) ou
            responde se vai comer a merenda.
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
          <h2 id="celular-titulo" className="font-display text-2xl font-medium">
            2. O celular do aluno (simulado)
          </h2>
          <p className="text-fg-muted">
            É o que abre ao ler o QR: registra a chegada atrasada e responde a merenda. Teste aqui:
          </p>
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
        <h2 id="equipe-titulo" className="mb-4 font-display text-2xl font-medium">
          3. As telas da equipe
        </h2>
        <ul className="grid gap-x-8 border-t border-fg sm:grid-cols-2 lg:grid-cols-3">
          {STAFF.map((s) => (
            <li key={s.href} className="border-b border-fg/20">
              <Link href={s.href} className="group flex h-full items-start gap-3 py-4">
                <Icon name={s.icon} size={22} className="mt-1 shrink-0 text-primary" />
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 font-display text-xl font-medium decoration-accent decoration-2 underline-offset-4 group-hover:underline">
                    {s.title}
                    <Icon
                      name="arrow"
                      size={16}
                      className="text-fg-muted transition-transform group-hover:translate-x-0.5"
                    />
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
